import { verifySignature } from "@/lib/whatsapp/client";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";
import { processWebhookPayload } from "@/lib/whatsapp/inbound";
import type { WaWebhookPayload } from "@/lib/whatsapp/types";

/**
 * Meta WhatsApp Cloud API webhook.
 *
 * `GET`  — the one-time subscription handshake.
 * `POST` — inbound messages and delivery receipts.
 *
 * Two things about this endpoint are unlike the rest of the site:
 *
 *  * It is the only public route that writes to the moderation queue, so the
 *    signature check is not optional. A missing `WHATSAPP_APP_SECRET` makes
 *    the endpoint refuse traffic rather than accept it unverified.
 *  * The HTTP status is a durability claim, not politeness. 200 means "this is
 *    stored"; anything we failed to persist answers 503 so Meta redelivers.
 *    Retries are safe because the UNIQUE `wa_message_id` makes re-ingestion a
 *    no-op, and the alternative — acknowledging a message we dropped — loses a
 *    crisis report permanently, which is exactly what Rule 7 forbids.
 */

// Ingestion is a handful of round trips plus one Graph call per message, and a
// batch can hold several messages. Meta will retry if we exceed this.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = getWhatsAppConfig();
  if (!config) {
    console.error("[whatsapp] webhook verification attempted while unconfigured");
    return new Response("WhatsApp is not configured", { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === config.verifyToken && challenge) {
    console.log("[whatsapp] webhook verified");
    return new Response(challenge, {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  console.warn("[whatsapp] webhook verification rejected", { mode });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const config = getWhatsAppConfig();
  if (!config) {
    // 503 rather than 200: Meta will retry, and once the env is set the
    // backlog is delivered instead of silently discarded.
    console.error("[whatsapp] inbound webhook received while unconfigured");
    return Response.json({ ok: false, error: "not configured" }, { status: 503 });
  }

  // The signature covers the raw bytes, so the body must be read as text and
  // parsed afterwards — `request.json()` first would re-serialise and change
  // the digest.
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"), config.appSecret)) {
    console.warn("[whatsapp] rejected webhook with invalid signature");
    return Response.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let payload: WaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WaWebhookPayload;
  } catch {
    // Malformed and signed by us: retrying will not help, so acknowledge it.
    console.error("[whatsapp] webhook body was not JSON");
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (payload.object !== "whatsapp_business_account") {
    return Response.json({ ok: true, ignored: true });
  }

  try {
    const counts = await processWebhookPayload(payload);

    // A message we failed to store is a message that is NOT in the moderation
    // queue. Acknowledging it with 200 would stop Meta retrying and lose it
    // for good — so we answer 503 and let the batch come back. Redelivery is
    // safe: the UNIQUE `wa_message_id` turns the already-stored messages in
    // the batch into no-ops.
    if (counts.failed > 0) {
      console.error(`[whatsapp] ${counts.failed} message(s) failed; asking Meta to retry`);
      return Response.json({ ok: false, ...counts }, { status: 503 });
    }

    return Response.json({ ok: true, ...counts });
  } catch (err) {
    console.error("[whatsapp] webhook processing threw:", err);
    return Response.json({ ok: false, error: "processing error" }, { status: 503 });
  }
}
