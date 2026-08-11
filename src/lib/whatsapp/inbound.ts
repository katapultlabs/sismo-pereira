import "server-only";

import { isLang, type Lang } from "../i18n";
import { markRead } from "./client";
import { getWhatsAppConfig } from "./config";
import { commandLabel, parseCommand } from "./commands";
import {
  emergencyReply,
  helpReply,
  langChangedReply,
  linksReply,
  mediaOnlyReply,
  missingPersonReply,
  reportFiledReply,
  resourcesReply,
  statusAllReply,
  statusServiceReply,
  subscribedReply,
  subscriptionFailedReply,
  langChangeFailedReply,
  tooShortReply,
  unsubscribedReply,
} from "./replies";
import { sendTextAndRecord } from "./send";
import {
  fileReport,
  normaliseWaId,
  recordInbound,
  setContactLang,
  setHandledAs,
  setSubscription,
  updateDelivery,
  upsertContact,
} from "./store";
import type { NormalisedInbound, WaInboundMessage, WaStatusUpdate, WaWebhookPayload } from "./types";

/**
 * Minimum length for a message to be filed as a report.
 *
 * Not arbitrary: `reports.description` has a CHECK constraint of 10..4000
 * characters, so anything shorter would be rejected by Postgres. Rather than
 * pad it to fit — which would be fabricating content — we ask for more detail.
 */
const MIN_REPORT_LENGTH = 10;

/**
 * What happened to one inbound message.
 *
 * `error` is the one that matters: it makes the webhook answer non-200 so Meta
 * redelivers, instead of acknowledging a message we failed to keep.
 */
export type InboundOutcome = "handled" | "duplicate" | "skipped" | "error";

/**
 * A wa_id is a phone number, and Rule 4 confines those to the moderator queue.
 * Logs are not that surface, so anything that reaches a log is masked.
 */
function maskWaId(waId: string): string {
  return `***${waId.slice(-4)}`;
}

/**
 * Turn Meta's per-type message envelope into one shape.
 *
 * Unknown types degrade to a labelled placeholder rather than throwing: Meta
 * ships new message types without notice, and an unhandled one must still land
 * in the moderator's queue rather than 500 the webhook into a retry loop.
 */
export function normaliseInbound(
  message: WaInboundMessage,
  profileName: string | null,
): NormalisedInbound | null {
  const waId = normaliseWaId(message.from ?? "");
  if (!waId || !message.id) return null;

  // `occurred_at` is Meta's send time when Meta gives us one. When it does
  // not, we fall back to *our receipt time* — which is a fact we actually
  // observed, not an invented send time — and say so in the log, because that
  // column also drives the 24-hour reply window.
  const seconds = Number.parseInt(message.timestamp ?? "", 10);
  const hasTimestamp = Number.isFinite(seconds) && seconds > 0;
  if (!hasTimestamp) {
    console.warn(
      `[whatsapp] message ${message.id} arrived without a usable timestamp; using receipt time`,
    );
  }
  const occurredAt = hasTimestamp
    ? new Date(seconds * 1000).toISOString()
    : new Date().toISOString();

  const base = {
    waId,
    waMessageId: message.id,
    occurredAt,
    messageType: message.type ?? "unknown",
    profileName,
  };

  const media = (
    payload: { id: string; mime_type?: string; filename?: string } | undefined,
  ) =>
    payload
      ? { id: payload.id, mime: payload.mime_type ?? null, filename: payload.filename ?? null }
      : null;

  switch (message.type) {
    case "text":
      return {
        ...base,
        body: message.text?.body ?? "",
        bodyIsPlaceholder: false,
        media: null,
      };
    case "image":
    case "video":
    case "document":
    case "audio":
    case "sticker": {
      const payload =
        message.image ?? message.video ?? message.document ?? message.audio ?? message.sticker;
      const caption = payload?.caption?.trim();
      return {
        ...base,
        body: caption || `[${message.type}]`,
        bodyIsPlaceholder: !caption,
        media: media(payload),
      };
    }
    case "location": {
      const loc = message.location;
      const label = [loc?.name, loc?.address].filter(Boolean).join(" — ");
      return {
        ...base,
        // Coordinates are data the sender actually provided, so they are kept
        // verbatim. Resolving them to an address would be us inventing one.
        body: label
          ? `[ubicación] ${label} (${loc?.latitude}, ${loc?.longitude})`
          : `[ubicación] ${loc?.latitude}, ${loc?.longitude}`,
        bodyIsPlaceholder: !label,
        media: null,
      };
    }
    case "button":
      return {
        ...base,
        body: message.button?.text ?? "",
        bodyIsPlaceholder: false,
        media: null,
      };
    case "interactive": {
      const reply = message.interactive?.button_reply ?? message.interactive?.list_reply;
      return {
        ...base,
        body: reply?.title ?? "",
        bodyIsPlaceholder: false,
        media: null,
      };
    }
    case "reaction":
      // Reactions carry no reportable content and no thread of their own.
      return null;
    default:
      return {
        ...base,
        body: `[${message.type ?? "desconocido"}]`,
        bodyIsPlaceholder: true,
        media: null,
      };
  }
}

/**
 * Ingest one inbound message: persist it, then answer it.
 *
 * Ordering is deliberate. The message row is written **first**, because its
 * UNIQUE `wa_message_id` is what makes a retried webhook a no-op. Only after
 * that insert succeeds do we file a report or send a reply — so a redelivery
 * cannot duplicate either.
 */
export async function handleInboundMessage(
  message: WaInboundMessage,
  profileName: string | null,
): Promise<InboundOutcome> {
  const normalised = normaliseInbound(message, profileName);
  if (!normalised) return "skipped";

  const contact = await upsertContact(normalised.waId, normalised.profileName);
  if (!contact) {
    // Never log the raw wa_id: it is a phone number, and application logs are
    // not the moderator-only surface Rule 4 confines contact details to.
    console.error(
      `[whatsapp] could not resolve contact for ${maskWaId(normalised.waId)}`,
    );
    return "error";
  }

  const stored = await recordInbound({
    contactId: contact.id,
    waMessageId: normalised.waMessageId,
    messageType: normalised.messageType,
    body: normalised.body || null,
    media: normalised.media,
    occurredAt: normalised.occurredAt,
    raw: message,
  });

  // Already ingested — a Meta retry. Do nothing else; answering again would
  // send the same person the same reply twice.
  if (stored.status === "duplicate") return "duplicate";

  // The write failed. Report it so the webhook can return a non-200 and Meta
  // redelivers, rather than acknowledging a message we did not keep.
  if (stored.status === "error") return "error";

  // A moderator has silenced this number. Keep the transcript, send nothing.
  if (contact.blocked) {
    await setHandledAs(stored.id, "blocked", null);
    return "handled";
  }

  await markRead(normalised.waMessageId);

  const lang: Lang = isLang(contact.lang) ? contact.lang : "es";
  const command = normalised.bodyIsPlaceholder
    ? ({ kind: "report" } as const)
    : parseCommand(normalised.body);

  let reply: string;
  let reportId: string | null = null;
  let label = commandLabel(command);

  switch (command.kind) {
    case "help":
      reply = helpReply(lang);
      break;
    case "emergency":
      reply = emergencyReply(lang);
      break;
    case "status_all":
      reply = (await statusAllReply(lang)).text;
      break;
    case "status_service":
      reply = (await statusServiceReply(command.service, lang)).text;
      break;
    case "resources":
      reply = (await resourcesReply(lang)).text;
      break;
    case "links":
      reply = (await linksReply(lang)).text;
      break;
    case "missing_person":
      reply = (await missingPersonReply(lang)).text;
      break;
    case "subscribe": {
      const ok = await setSubscription(contact.id, "subscribed");
      reply = ok ? subscribedReply(lang) : subscriptionFailedReply(lang, "subscribe");
      if (!ok) label = "subscribe_failed";
      break;
    }
    case "unsubscribe": {
      const ok = await setSubscription(contact.id, "unsubscribed");
      reply = ok ? unsubscribedReply(lang) : subscriptionFailedReply(lang, "unsubscribe");
      if (!ok) label = "unsubscribe_failed";
      break;
    }
    case "set_lang": {
      const ok = await setContactLang(contact.id, command.lang);
      reply = ok ? langChangedReply(command.lang) : langChangeFailedReply(lang);
      if (!ok) label = "set_lang_failed";
      break;
    }
    case "report": {
      const text = normalised.body.trim();

      if (normalised.bodyIsPlaceholder && normalised.media) {
        // A photo with no caption. We cannot read the image, so we do not
        // pretend to have understood it — we ask for the words.
        reply = mediaOnlyReply(lang);
        label = "media_no_caption";
        break;
      }

      if (text.length < MIN_REPORT_LENGTH) {
        reply = tooShortReply(lang);
        label = "too_short";
        break;
      }

      reportId = await fileReport({
        waId: contact.wa_id,
        displayName: normalised.profileName ?? contact.display_name,
        description: text,
      });

      if (!reportId) {
        // The write failed. Say so — `submitReport` fails loudly for exactly
        // this reason, and someone may be reporting a person under rubble.
        reply =
          lang === "es"
            ? "No pudimos guardar tu mensaje por un problema técnico. Por favor " +
              "vuelve a enviarlo. Si es una emergencia, llama al *123*."
            : "We could not save your message due to a technical problem. " +
              "Please send it again. If this is an emergency, call *123*.";
        label = "report_failed";
        break;
      }

      reply = reportFiledReply(lang);
      label = "report_filed";
      break;
    }
  }

  await setHandledAs(stored.id, label, reportId);
  await sendTextAndRecord(contact, reply, `auto:${label}`);

  // A failed report write is a failed ingest even though the transcript row
  // exists: the message is not in the moderation queue, which is the only
  // place it does any good.
  return label === "report_failed" ? "error" : "handled";
}

/** Meta's delivery receipt for something we sent. */
export async function handleStatusUpdate(status: WaStatusUpdate): Promise<void> {
  if (!status.id || !status.status) return;
  const detail = status.errors?.[0]
    ? `${status.errors[0].code} ${status.errors[0].title}${
        status.errors[0].message ? `: ${status.errors[0].message}` : ""
      }`
    : null;
  await updateDelivery(status.id, status.status, detail);
}

/**
 * Walk a webhook payload.
 *
 * Every unit of work is individually try/caught so one malformed message in a
 * batch cannot stop the rest. Failures are *counted* rather than swallowed:
 * the caller turns a non-zero `failed` into a non-200 so Meta redelivers the
 * batch, and the UNIQUE `wa_message_id` makes that redelivery harmless for the
 * messages that did succeed.
 */
export async function processWebhookPayload(payload: WaWebhookPayload): Promise<{
  handled: number;
  duplicates: number;
  failed: number;
  statuses: number;
  ignored: number;
}> {
  let handled = 0;
  let duplicates = 0;
  let failed = 0;
  let statuses = 0;
  let ignored = 0;

  // The WhatsApp Business Account this runs on is shared with ProCarmelita,
  // and a WABA can carry several phone numbers. Whether the payload arrives
  // direct from Meta or relayed by the other project, anything addressed to a
  // different number is not ours to answer — see docs/WHATSAPP.md.
  const ourNumberId = getWhatsAppConfig()?.phoneNumberId ?? null;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value) continue;

      const targetNumberId = value.metadata?.phone_number_id;
      if (ourNumberId && targetNumberId && targetNumberId !== ourNumberId) {
        ignored += (value.messages?.length ?? 0) + (value.statuses?.length ?? 0);
        continue;
      }

      for (const message of value.messages ?? []) {
        const profileName =
          value.contacts?.find((c) => c.wa_id === message.from)?.profile?.name ?? null;
        try {
          const outcome = await handleInboundMessage(message, profileName);
          if (outcome === "handled") handled += 1;
          else if (outcome === "duplicate") duplicates += 1;
          else if (outcome === "error") failed += 1;
        } catch (err) {
          console.error("[whatsapp] inbound handler threw:", err);
          failed += 1;
        }
      }

      for (const status of value.statuses ?? []) {
        try {
          await handleStatusUpdate(status);
          statuses += 1;
        } catch (err) {
          console.error("[whatsapp] status handler threw:", err);
        }
      }
    }
  }

  return { handled, duplicates, failed, statuses, ignored };
}
