import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { GRAPH_URL, getWhatsAppConfig } from "./config";

/**
 * Thin wrapper over the Graph messaging endpoints.
 *
 * Every function returns a result object instead of throwing. A send that
 * fails must be *recorded* as failed — see `docs/EDITORIAL.md` Rule 7: writes
 * fail loudly, and the loudest possible failure is a row in the transcript
 * saying we never delivered the message.
 */

export type SendResult =
  | { ok: true; waMessageId: string | null }
  | { ok: false; error: string; status?: number };

async function post(body: unknown): Promise<SendResult> {
  const config = getWhatsAppConfig();
  if (!config) return { ok: false, error: "WhatsApp is not configured." };

  let response: Response;
  try {
    response = await fetch(`${GRAPH_URL}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...(body as object) }),
      // Meta is the slow party here; give up rather than hold a function open.
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "network error";
    console.error(`[whatsapp] send threw: ${message}`);
    return { ok: false, error: message };
  }

  const text = await response.text().catch(() => "");

  if (!response.ok) {
    // Meta puts the useful part in error.message; keep the raw body too since
    // error codes (131047 re-engagement, 131026 undeliverable) drive triage.
    console.error(`[whatsapp] send failed ${response.status}: ${text}`);
    return { ok: false, error: extractGraphError(text), status: response.status };
  }

  try {
    const json = JSON.parse(text) as { messages?: Array<{ id?: string }> };
    return { ok: true, waMessageId: json.messages?.[0]?.id ?? null };
  } catch {
    return { ok: true, waMessageId: null };
  }
}

function extractGraphError(text: string): string {
  try {
    const json = JSON.parse(text) as {
      error?: { message?: string; code?: number; error_data?: { details?: string } };
    };
    const parts = [
      json.error?.message,
      json.error?.error_data?.details,
      json.error?.code ? `(code ${json.error.code})` : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  } catch {
    // fall through
  }
  return text.slice(0, 500) || "Unknown Graph API error";
}

/**
 * Free-form text. Only valid inside the 24-hour service window — outside it
 * Meta rejects the call, which is why callers must check
 * `isWithinServiceWindow()` first rather than relying on the error.
 */
export function sendText(waId: string, body: string): Promise<SendResult> {
  return post({
    to: waId,
    type: "text",
    // Link previews are noise in a crisis thread and leak referrer data.
    text: { preview_url: false, body: body.slice(0, 4096) },
  });
}

/** An approved template — the only thing that sends outside the window. */
export function sendTemplate(
  waId: string,
  templateName: string,
  lang: string,
  bodyParams: string[] = [],
): Promise<SendResult> {
  return post({
    to: waId,
    type: "template",
    template: {
      name: templateName,
      language: { code: lang },
      ...(bodyParams.length > 0
        ? {
            components: [
              {
                type: "body",
                parameters: bodyParams.map((text) => ({ type: "text", text })),
              },
            ],
          }
        : {}),
    },
  });
}

/**
 * Mark an inbound message read, so the sender sees the blue ticks.
 *
 * This is not cosmetic. Someone who has just reported a collapsed wall and
 * sees a single grey tick has no idea whether anyone received it.
 */
export async function markRead(waMessageId: string): Promise<void> {
  const result = await post({ status: "read", message_id: waMessageId });
  if (!result.ok) console.warn(`[whatsapp] markRead failed: ${result.error}`);
}

/**
 * Verify Meta's `X-Hub-Signature-256` over the *raw* request body.
 *
 * Compared in constant time. A byte-wise `===` on a hex digest leaks how much
 * of a forged signature was correct, which is enough to forge one given
 * enough attempts against an endpoint that writes to the moderation queue.
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  } catch {
    return false;
  }

  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Fetch the approved templates on the WABA. Used by the broadcast UI so a
 * moderator picks from what Meta has actually approved instead of typing a
 * name that will fail at send time.
 */
export async function listApprovedTemplates(): Promise<
  { ok: true; templates: Array<{ name: string; language: string; category: string }> }
  | { ok: false; error: string }
> {
  const config = getWhatsAppConfig();
  if (!config) return { ok: false, error: "WhatsApp is not configured." };
  if (!config.businessId) {
    return { ok: false, error: "WHATSAPP_CLOUD_BUSINESS_ID is not set." };
  }

  const url =
    `${GRAPH_URL}/${config.businessId}/message_templates` +
    `?fields=name,language,status,category&limit=100`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.token}` },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 300 },
    });
    const text = await response.text().catch(() => "");
    if (!response.ok) return { ok: false, error: extractGraphError(text) };

    const json = JSON.parse(text) as {
      data?: Array<{ name: string; language: string; status: string; category: string }>;
    };
    return {
      ok: true,
      templates: (json.data ?? [])
        .filter((t) => t.status === "APPROVED")
        .map((t) => ({ name: t.name, language: t.language, category: t.category })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}
