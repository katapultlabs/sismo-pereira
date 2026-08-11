import "server-only";

import { sendTemplate, sendText, type SendResult } from "./client";
import { recordOutbound, type WhatsAppContact } from "./store";

/**
 * Send-and-record.
 *
 * Nothing should call `client.ts` directly to reach a person: a message that
 * left the building without a row in `whatsapp_messages` is invisible to the
 * moderator reading the thread, and a failure with no row is a message we will
 * quietly believe we sent. Both directions of the transcript are the record.
 */

export async function sendTextAndRecord(
  contact: Pick<WhatsAppContact, "id" | "wa_id" | "blocked">,
  body: string,
  handledAs: string | null = null,
): Promise<SendResult> {
  if (contact.blocked) {
    return { ok: false, error: "Contact is blocked by a moderator." };
  }

  const result = await sendText(contact.wa_id, body);

  await recordOutbound({
    contactId: contact.id,
    waMessageId: result.ok ? result.waMessageId : null,
    body,
    delivery: result.ok ? "sent" : "failed",
    errorDetail: result.ok ? null : result.error,
    handledAs,
  });

  return result;
}

export async function sendTemplateAndRecord(
  contact: Pick<WhatsAppContact, "id" | "wa_id" | "blocked">,
  template: { name: string; lang: string; params: string[] },
  /** Rendered text for the transcript — Meta stores the template, we store what it said. */
  preview: string,
  broadcastId: string | null = null,
): Promise<SendResult> {
  if (contact.blocked) {
    return { ok: false, error: "Contact is blocked by a moderator." };
  }

  const result = await sendTemplate(
    contact.wa_id,
    template.name,
    template.lang,
    template.params,
  );

  await recordOutbound({
    contactId: contact.id,
    waMessageId: result.ok ? result.waMessageId : null,
    body: preview,
    templateName: template.name,
    broadcastId,
    delivery: result.ok ? "sent" : "failed",
    errorDetail: result.ok ? null : result.error,
  });

  return result;
}
