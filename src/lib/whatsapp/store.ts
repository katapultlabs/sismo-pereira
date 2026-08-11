import "server-only";

import { createHash } from "node:crypto";

import { getServiceSupabase } from "../supabase/server";
import type { Lang } from "../i18n";

/**
 * Database access for the WhatsApp channel.
 *
 * Everything here runs with the **service role**, for the same reason
 * `src/app/api/v1/*` does: the caller is Meta, a machine with no Supabase
 * session, so there is no RLS identity to lean on. That makes this file
 * security-critical — it must never be imported from anything reachable by a
 * browser, and every row it writes is scoped explicitly by `wa_id`.
 */

export interface WhatsAppContact {
  id: string;
  wa_id: string;
  display_name: string | null;
  lang: Lang;
  zone_slug: string | null;
  subscription: "none" | "subscribed" | "unsubscribed" | "blocked";
  blocked: boolean;
  last_inbound_at: string | null;
  inbound_count: number;
}

const CONTACT_COLUMNS =
  "id, wa_id, display_name, lang, zone_slug, subscription, blocked, last_inbound_at, inbound_count";

/** Postgres unique-violation. Our idempotency signal, not an error. */
const UNIQUE_VIOLATION = "23505";

function client() {
  return getServiceSupabase();
}

/** Meta sends digits only; be defensive about anything else reaching us. */
export function normaliseWaId(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 20 ? digits : null;
}

/**
 * Find or create the contact row for a WhatsApp id.
 *
 * `display_name` is Meta's profile name. It is refreshed on every inbound
 * message because people change it, and a moderator reading the queue needs
 * the name the person is using now.
 */
export async function upsertContact(
  waId: string,
  profileName: string | null,
): Promise<WhatsAppContact | null> {
  const sb = client();
  if (!sb) return null;

  const { data: existing, error: selectError } = await sb
    .from("whatsapp_contacts")
    .select(CONTACT_COLUMNS)
    .eq("wa_id", waId)
    .maybeSingle();

  if (selectError) {
    console.error(`[whatsapp/store] contact lookup failed: ${selectError.message}`);
    return null;
  }

  if (existing) {
    if (profileName && profileName !== existing.display_name) {
      await sb
        .from("whatsapp_contacts")
        .update({ display_name: profileName })
        .eq("id", existing.id);
    }
    return existing as WhatsAppContact;
  }

  const { data: created, error: insertError } = await sb
    .from("whatsapp_contacts")
    .insert({ wa_id: waId, display_name: profileName })
    .select(CONTACT_COLUMNS)
    .single();

  if (insertError) {
    // Two webhook deliveries for a first-time sender can race here.
    if (insertError.code === UNIQUE_VIOLATION) {
      const { data: raced } = await sb
        .from("whatsapp_contacts")
        .select(CONTACT_COLUMNS)
        .eq("wa_id", waId)
        .maybeSingle();
      return (raced as WhatsAppContact) ?? null;
    }
    console.error(`[whatsapp/store] contact insert failed: ${insertError.message}`);
    return null;
  }

  return created as WhatsAppContact;
}

export interface InboundRecord {
  contactId: string;
  waMessageId: string;
  messageType: string;
  body: string | null;
  media: { id: string; mime: string | null; filename: string | null } | null;
  occurredAt: string;
  raw: unknown;
}

/**
 * The three genuinely different outcomes of trying to store an inbound message.
 *
 * Collapsing these into `null` was a real bug: a transient database error is
 * NOT "already handled". Treating it as one makes the webhook answer 200, Meta
 * never retries, and someone's report of a collapsed building is gone. Rule 7
 * says writes fail loudly — so the caller has to be able to tell "duplicate"
 * (do nothing, answer 200) from "broken" (answer non-200, let Meta redeliver).
 */
export type InboundResult =
  | { status: "stored"; id: string }
  | { status: "duplicate" }
  | { status: "error"; message: string };

/**
 * Persist an inbound message.
 *
 * Meta retries a webhook until it receives a 200, so the UNIQUE violation on
 * `wa_message_id` is the single point that stops one earthquake report
 * becoming five.
 */
export async function recordInbound(record: InboundRecord): Promise<InboundResult> {
  const sb = client();
  if (!sb) {
    return { status: "error", message: "Supabase service role is not configured." };
  }

  const { data, error } = await sb
    .from("whatsapp_messages")
    .insert({
      contact_id: record.contactId,
      wa_message_id: record.waMessageId,
      direction: "inbound",
      message_type: record.messageType,
      body: record.body,
      media_id: record.media?.id ?? null,
      media_mime: record.media?.mime ?? null,
      media_filename: record.media?.filename ?? null,
      delivery: "received",
      occurred_at: record.occurredAt,
      raw: record.raw,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { status: "duplicate" };
    console.error(`[whatsapp/store] inbound insert failed: ${error.message}`);
    return { status: "error", message: error.message };
  }

  if (!data) {
    return { status: "error", message: "Insert returned no row." };
  }

  return { status: "stored", id: (data as { id: string }).id };
}

export async function recordOutbound(params: {
  contactId: string;
  waMessageId: string | null;
  body: string;
  templateName?: string | null;
  broadcastId?: string | null;
  delivery: "sent" | "failed";
  errorDetail?: string | null;
  handledAs?: string | null;
}): Promise<void> {
  const sb = client();
  if (!sb) return;

  const { error } = await sb.from("whatsapp_messages").insert({
    contact_id: params.contactId,
    wa_message_id: params.waMessageId,
    direction: "outbound",
    message_type: params.templateName ? "template" : "text",
    body: params.body,
    template_name: params.templateName ?? null,
    broadcast_id: params.broadcastId ?? null,
    delivery: params.delivery,
    error_detail: params.errorDetail ?? null,
    handled_as: params.handledAs ?? null,
    occurred_at: new Date().toISOString(),
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error(`[whatsapp/store] outbound insert failed: ${error.message}`);
  }
}

/** Meta's delivery receipts. Best-effort: a missed one costs us nothing. */
export async function updateDelivery(
  waMessageId: string,
  delivery: "sent" | "delivered" | "read" | "failed",
  errorDetail: string | null,
): Promise<void> {
  const sb = client();
  if (!sb) return;

  const { error } = await sb
    .from("whatsapp_messages")
    .update({ delivery, ...(errorDetail ? { error_detail: errorDetail } : {}) })
    .eq("wa_message_id", waMessageId);

  if (error) {
    console.warn(`[whatsapp/store] delivery update failed: ${error.message}`);
  }
}

export async function setHandledAs(
  messageId: string,
  handledAs: string,
  reportId: string | null,
): Promise<void> {
  const sb = client();
  if (!sb) return;
  await sb
    .from("whatsapp_messages")
    .update({ handled_as: handledAs, report_id: reportId })
    .eq("id", messageId);
}

/**
 * Change someone's subscription state.
 *
 * Returns whether it actually happened, and the caller must respect that.
 * Telling someone "ya no recibirás avisos" while they are still subscribed is
 * the worst failure this channel can produce short of losing a report: they
 * have asked to be left alone, been told they were, and will be messaged
 * again anyway.
 */
export async function setSubscription(
  contactId: string,
  subscription: "subscribed" | "unsubscribed",
): Promise<boolean> {
  const sb = client();
  if (!sb) return false;

  const stamp = new Date().toISOString();
  const { data, error } = await sb
    .from("whatsapp_contacts")
    .update({
      subscription,
      ...(subscription === "subscribed"
        ? { subscribed_at: stamp }
        : { unsubscribed_at: stamp }),
    })
    .eq("id", contactId)
    .select("id");

  if (error) {
    console.error(`[whatsapp/store] subscription update failed: ${error.message}`);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

export async function setContactLang(contactId: string, lang: Lang): Promise<boolean> {
  const sb = client();
  if (!sb) return false;

  const { data, error } = await sb
    .from("whatsapp_contacts")
    .update({ lang })
    .eq("id", contactId)
    .select("id");

  if (error) {
    console.error(`[whatsapp/store] language update failed: ${error.message}`);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Claim a recipient for a broadcast, atomically.
 *
 * Inserts the transcript row *before* the Graph call, so the partial unique
 * index on `(broadcast_id, contact_id)` — not an earlier SELECT — decides who
 * sends. Two concurrent chunks race on the index and exactly one wins; a crash
 * between claiming and sending leaves a `queued` row rather than a recipient
 * who looks un-messaged and gets messaged twice.
 *
 * Returns the row id to fill in afterwards, or null if someone else has it.
 */
export async function claimBroadcastRecipient(
  broadcastId: string,
  contactId: string,
  preview: string,
  templateName: string,
): Promise<string | null> {
  const sb = client();
  if (!sb) return null;

  const { data, error } = await sb
    .from("whatsapp_messages")
    .insert({
      contact_id: contactId,
      broadcast_id: broadcastId,
      direction: "outbound",
      message_type: "template",
      template_name: templateName,
      body: preview,
      delivery: "queued",
      occurred_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code !== UNIQUE_VIOLATION) {
      console.error(`[whatsapp/store] broadcast claim failed: ${error.message}`);
    }
    return null;
  }

  return (data as { id: string }).id;
}

/** Fill in the outcome of a claimed broadcast send. */
export async function settleBroadcastRecipient(
  messageId: string,
  outcome:
    | { ok: true; waMessageId: string | null }
    | { ok: false; error: string },
): Promise<void> {
  const sb = client();
  if (!sb) return;

  await sb
    .from("whatsapp_messages")
    .update(
      outcome.ok
        ? { delivery: "sent", wa_message_id: outcome.waMessageId }
        : { delivery: "failed", error_detail: outcome.error },
    )
    .eq("id", messageId);
}

/**
 * File an inbound message into the community moderation queue.
 *
 * This is the whole point of the inbound side: WhatsApp becomes another front
 * door onto the queue that already exists, with the same `pending` gate and
 * the same PII rules. The sender's number goes into `contact_phone`, which the
 * `public_reports` view drops at the database level — see Rule 4.
 */
export async function fileReport(params: {
  waId: string;
  displayName: string | null;
  description: string;
}): Promise<string | null> {
  const sb = client();
  if (!sb) return null;

  // Same shape of coarse, non-reversible fingerprint `submitReport` keeps for
  // web submissions. Derived from the wa_id so repeat abuse from one number is
  // visible without storing the number a second time in a comparable form.
  const submitterHash = createHash("sha256")
    .update(`wa:${params.waId}:${process.env.REPORT_HASH_SALT ?? "sismo-pereira"}`)
    .digest("hex")
    .slice(0, 32);

  const { data, error } = await sb
    .from("reports")
    .insert({
      // Uncategorised on purpose: a moderator reads the text and decides.
      // Guessing a category from keywords is exactly the kind of inference
      // that turns a rumour into a structured-looking fact.
      category: "other",
      description: params.description.slice(0, 4000),
      contact_name: params.displayName,
      contact_phone: `+${params.waId}`,
      status: "pending",
      submitter_hash: submitterHash,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[whatsapp/store] report insert failed: ${error.message}`);
    return null;
  }

  return (data as { id: string }).id;
}
