import "server-only";

import { getServiceSupabase } from "../supabase/server";
import { getBroadcastTemplate } from "./config";
import { sendTemplateAndRecord } from "./send";
import type { WhatsAppContact } from "./store";

/**
 * Broadcasting a published update to opted-in subscribers.
 *
 * Three constraints shape this file:
 *
 *  1. **Templates only.** A subscriber is by definition outside the 24-hour
 *     service window, so Meta accepts nothing else. The template must already
 *     be approved; there is no fallback to free text, because the fallback
 *     would silently fail for every recipient.
 *  2. **Opt-in only.** `subscription = 'subscribed'`. Never "everyone who has
 *     ever messaged us" — that is how a crisis line becomes a spam channel and
 *     gets the number blocked by Meta, taking the inbound side down with it.
 *  3. **Resumable.** A send is chunked and records progress per recipient, so
 *     a function timeout half way through a list resumes rather than restarts.
 *     Delivery is deduplicated by `whatsapp_messages.broadcast_id`.
 */

/** Meta's default throughput is far higher; this is politeness, not a limit. */
const SEND_DELAY_MS = 120;

/** Recipients attempted per invocation, sized to fit inside `maxDuration`. */
export const CHUNK_SIZE = 200;

/** Hard ceiling on one broadcast's audience, as a blast-radius guard. */
const MAX_AUDIENCE = 5000;

export interface BroadcastAudience {
  zone_slug?: string | null;
  lang?: "es" | "en" | null;
}

export interface BroadcastRow {
  id: string;
  template_name: string;
  template_lang: string;
  template_params: string[];
  body_preview: string;
  audience: BroadcastAudience;
  status: "draft" | "sending" | "sent" | "partial" | "failed";
  recipient_count: number;
  sent_count: number;
  failed_count: number;
}

const BROADCAST_COLUMNS =
  "id, template_name, template_lang, template_params, body_preview, audience, status, recipient_count, sent_count, failed_count";

/**
 * Create a broadcast in `draft`, with its audience already counted.
 *
 * Counting up front means the moderator sees "412 personas" before they
 * confirm, rather than discovering the size of the audience from the invoice.
 */
export async function createBroadcast(params: {
  updateId: string | null;
  bodyPreview: string;
  templateParams: string[];
  audience: BroadcastAudience;
  createdBy: string;
}): Promise<{ ok: true; broadcast: BroadcastRow } | { ok: false; error: string }> {
  const template = getBroadcastTemplate();
  if (!template) {
    return {
      ok: false,
      error: "WHATSAPP_BROADCAST_TEMPLATE is not set, so broadcasting is disabled.",
    };
  }

  const sb = getServiceSupabase();
  if (!sb) return { ok: false, error: "Supabase service role is not configured." };

  const recipients = await eligibleContactIds(params.audience);
  if (recipients.length === 0) {
    return { ok: false, error: "No subscribers match that audience." };
  }

  const { data, error } = await sb
    .from("whatsapp_broadcasts")
    .insert({
      update_id: params.updateId,
      template_name: template.name,
      template_lang: template.lang,
      template_params: params.templateParams,
      body_preview: params.bodyPreview,
      audience: params.audience,
      status: "draft",
      recipient_count: recipients.length,
      created_by: params.createdBy,
    })
    .select(BROADCAST_COLUMNS)
    .single();

  if (error) {
    console.error(`[whatsapp/broadcast] create failed: ${error.message}`);
    return { ok: false, error: "Could not create the broadcast." };
  }

  return { ok: true, broadcast: data as BroadcastRow };
}

async function eligibleContactIds(audience: BroadcastAudience): Promise<string[]> {
  const sb = getServiceSupabase();
  if (!sb) return [];

  let q = sb
    .from("whatsapp_contacts")
    .select("id")
    .eq("subscription", "subscribed")
    .eq("blocked", false)
    .limit(MAX_AUDIENCE);

  if (audience.zone_slug) q = q.eq("zone_slug", audience.zone_slug);
  if (audience.lang) q = q.eq("lang", audience.lang);

  const { data, error } = await q;
  if (error) {
    console.error(`[whatsapp/broadcast] audience query failed: ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => (r as { id: string }).id);
}

/**
 * Send the next chunk of a broadcast.
 *
 * Idempotent per recipient: anyone who already has a `whatsapp_messages` row
 * carrying this `broadcast_id` is skipped, whether the previous attempt
 * succeeded or failed. A failed recipient is therefore *not* retried
 * automatically — a number Meta rejected once will be rejected again, and
 * hammering it risks the whole sender's reputation. Failures are visible in
 * the transcript for a moderator to act on.
 */
export async function runBroadcastChunk(broadcastId: string): Promise<{
  ok: boolean;
  sent: number;
  failed: number;
  remaining: number;
  error?: string;
}> {
  const sb = getServiceSupabase();
  if (!sb) return { ok: false, sent: 0, failed: 0, remaining: 0, error: "No service role." };

  const { data: broadcastRow, error: loadError } = await sb
    .from("whatsapp_broadcasts")
    .select(BROADCAST_COLUMNS)
    .eq("id", broadcastId)
    .maybeSingle();

  if (loadError || !broadcastRow) {
    return { ok: false, sent: 0, failed: 0, remaining: 0, error: "Broadcast not found." };
  }

  const broadcast = broadcastRow as BroadcastRow;
  if (broadcast.status === "sent") {
    return { ok: true, sent: 0, failed: 0, remaining: 0 };
  }

  await sb
    .from("whatsapp_broadcasts")
    .update({ status: "sending", started_at: new Date().toISOString() })
    .eq("id", broadcastId)
    .is("started_at", null);

  const eligible = await eligibleContactIds(broadcast.audience ?? {});
  const alreadyAttempted = await attemptedContactIds(broadcastId);
  const pending = eligible.filter((id) => !alreadyAttempted.has(id));
  const batch = pending.slice(0, CHUNK_SIZE);

  let sent = 0;
  let failed = 0;

  for (const contactId of batch) {
    const { data: contact } = await sb
      .from("whatsapp_contacts")
      .select("id, wa_id, blocked")
      .eq("id", contactId)
      .maybeSingle();

    if (!contact) {
      failed += 1;
      continue;
    }

    const result = await sendTemplateAndRecord(
      contact as Pick<WhatsAppContact, "id" | "wa_id" | "blocked">,
      {
        name: broadcast.template_name,
        lang: broadcast.template_lang,
        params: broadcast.template_params ?? [],
      },
      broadcast.body_preview,
      broadcastId,
    );

    if (result.ok) sent += 1;
    else failed += 1;

    await sleep(SEND_DELAY_MS);
  }

  const remaining = pending.length - batch.length;
  const totalSent = broadcast.sent_count + sent;
  const totalFailed = broadcast.failed_count + failed;

  await sb
    .from("whatsapp_broadcasts")
    .update({
      sent_count: totalSent,
      failed_count: totalFailed,
      ...(remaining === 0
        ? {
            status: totalSent === 0 ? "failed" : totalFailed > 0 ? "partial" : "sent",
            finished_at: new Date().toISOString(),
          }
        : {}),
    })
    .eq("id", broadcastId);

  return { ok: true, sent, failed, remaining };
}

/** Contacts with any row for this broadcast — success or failure. */
async function attemptedContactIds(broadcastId: string): Promise<Set<string>> {
  const sb = getServiceSupabase();
  if (!sb) return new Set();

  const ids = new Set<string>();
  const PAGE = 1000;

  for (let from = 0; from < MAX_AUDIENCE; from += PAGE) {
    const { data, error } = await sb
      .from("whatsapp_messages")
      .select("contact_id")
      .eq("broadcast_id", broadcastId)
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`[whatsapp/broadcast] attempted query failed: ${error.message}`);
      break;
    }
    const rows = (data ?? []) as Array<{ contact_id: string }>;
    for (const row of rows) ids.add(row.contact_id);
    if (rows.length < PAGE) break;
  }

  return ids;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
