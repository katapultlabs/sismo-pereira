"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getModerator } from "../auth";
import { getServiceSupabase } from "../supabase/server";
import { createBroadcast, runBroadcastChunk } from "./broadcast";
import { isWithinServiceWindow } from "./config";
import { sendTextAndRecord } from "./send";
import type { WhatsAppContact } from "./store";

/**
 * Moderator actions on the WhatsApp channel.
 *
 * Each one re-checks `getModerator()` rather than trusting that the page
 * rendered. A server action is a public endpoint: the page's own auth check
 * guards what a person *sees*, never what they can *call*.
 */

export type ActionState = { ok: boolean; message?: string };

const replySchema = z.object({
  contactId: z.uuid(),
  body: z.string().trim().min(1).max(3000),
});

/**
 * Reply to a thread in free text.
 *
 * Refuses outside Meta's 24-hour service window instead of letting the Graph
 * call fail: the moderator needs to know *why* their message will not send,
 * and "the person has not written to us since yesterday" is actionable in a
 * way that a 131047 error code is not.
 */
export async function replyToThread(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const moderator = await getModerator();
  if (!moderator) return { ok: false, message: "No autorizado." };

  const parsed = replySchema.safeParse({
    contactId: formData.get("contactId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, message: "Mensaje vacío o demasiado largo." };

  const sb = getServiceSupabase();
  if (!sb) return { ok: false, message: "Backend no disponible." };

  const { data: contact } = await sb
    .from("whatsapp_contacts")
    .select("id, wa_id, blocked, last_inbound_at")
    .eq("id", parsed.data.contactId)
    .maybeSingle();

  if (!contact) return { ok: false, message: "Contacto no encontrado." };

  const row = contact as Pick<
    WhatsAppContact,
    "id" | "wa_id" | "blocked" | "last_inbound_at"
  >;

  if (row.blocked) return { ok: false, message: "Este número está bloqueado." };

  if (!isWithinServiceWindow(row.last_inbound_at)) {
    return {
      ok: false,
      message:
        "Pasaron más de 24 horas desde su último mensaje. WhatsApp solo permite " +
        "plantillas aprobadas fuera de esa ventana.",
    };
  }

  const result = await sendTextAndRecord(row, parsed.data.body, `moderator:${moderator.id}`);

  revalidatePath(`/admin/whatsapp/${parsed.data.contactId}`, "page");
  revalidatePath("/admin/whatsapp", "page");

  return result.ok
    ? { ok: true }
    : { ok: false, message: `No se pudo enviar: ${result.error}` };
}

const blockSchema = z.object({ contactId: z.uuid(), blocked: z.enum(["true", "false"]) });

/**
 * Silence a number. The transcript is kept — we stop replying, we do not
 * erase what was said, because a moderator may need to review the decision.
 */
export async function setBlocked(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const moderator = await getModerator();
  if (!moderator) return { ok: false, message: "No autorizado." };

  const parsed = blockSchema.safeParse({
    contactId: formData.get("contactId"),
    blocked: formData.get("blocked"),
  });
  if (!parsed.success) return { ok: false, message: "Entrada inválida." };

  const sb = getServiceSupabase();
  if (!sb) return { ok: false, message: "Backend no disponible." };

  const blocked = parsed.data.blocked === "true";
  await sb
    .from("whatsapp_contacts")
    .update({ blocked, ...(blocked ? { subscription: "blocked" } : {}) })
    .eq("id", parsed.data.contactId);

  revalidatePath(`/admin/whatsapp/${parsed.data.contactId}`, "page");
  revalidatePath("/admin/whatsapp", "page");
  return { ok: true };
}

/**
 * Only the *selection* comes from the form. The title and URL that go out to
 * hundreds of phones are re-read from the database below, because a server
 * action is a public endpoint and its hidden fields are client-controlled —
 * accepting them would let any moderator broadcast arbitrary text and links
 * under our name, with no published update behind it (Rules 3 and 5).
 */
const broadcastSchema = z.object({
  updateId: z.uuid(),
  zoneSlug: z.string().trim().max(64).nullish(),
  lang: z.enum(["es", "en"]).nullish(),
});

export type BroadcastState = ActionState & {
  broadcastId?: string;
  sent?: number;
  failed?: number;
  remaining?: number;
};

/**
 * Create a broadcast and send its first chunk.
 *
 * The chunk boundary is real: a list larger than `CHUNK_SIZE` finishes over
 * several invocations, and the returned `remaining` is what the UI uses to
 * ask the moderator to continue. Nothing is sent twice — see
 * `runBroadcastChunk`.
 */
export async function startBroadcast(
  _prev: BroadcastState,
  formData: FormData,
): Promise<BroadcastState> {
  const moderator = await getModerator();
  if (!moderator) return { ok: false, message: "No autorizado." };

  const parsed = broadcastSchema.safeParse({
    updateId: formData.get("updateId") || undefined,
    zoneSlug: formData.get("zoneSlug") || undefined,
    lang: formData.get("lang") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "Selecciona una actualización publicada." };
  }

  // Re-read the update, and require it to be published. This is the publishing
  // gate the composer promises: a broadcast can only ever carry something that
  // already cleared moderation.
  const sb = getServiceSupabase();
  if (!sb) return { ok: false, message: "Backend no disponible." };

  const { data: update, error: updateError } = await sb
    .from("updates")
    .select("id, slug, title, status")
    .eq("id", parsed.data.updateId)
    .maybeSingle();

  if (updateError) {
    console.error(`[startBroadcast] update lookup failed: ${updateError.message}`);
    return { ok: false, message: "No se pudo leer la actualización." };
  }

  const row = update as { id: string; slug: string | null; title: string; status: string } | null;

  if (!row) return { ok: false, message: "Esa actualización no existe." };
  if (row.status !== "published") {
    return {
      ok: false,
      message: "Esa actualización no está publicada. Publícala antes de difundirla.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sismopereira.org";
  const url = row.slug ? `${siteUrl}/actualizaciones/${row.slug}` : siteUrl;

  const created = await createBroadcast({
    updateId: row.id,
    bodyPreview: `${row.title} — ${url}`,
    templateParams: [row.title, url],
    audience: {
      zone_slug: parsed.data.zoneSlug ?? null,
      lang: parsed.data.lang ?? null,
    },
    createdBy: moderator.id,
  });

  if (!created.ok) return { ok: false, message: created.error };

  const run = await runBroadcastChunk(created.broadcast.id);
  revalidatePath("/admin/whatsapp/difusion", "page");

  return {
    ok: run.ok,
    message: run.error,
    broadcastId: created.broadcast.id,
    sent: run.sent,
    failed: run.failed,
    remaining: run.remaining,
  };
}

export async function continueBroadcast(
  _prev: BroadcastState,
  formData: FormData,
): Promise<BroadcastState> {
  const moderator = await getModerator();
  if (!moderator) return { ok: false, message: "No autorizado." };

  const id = z.uuid().safeParse(formData.get("broadcastId"));
  if (!id.success) return { ok: false, message: "Difusión inválida." };

  const run = await runBroadcastChunk(id.data);
  revalidatePath("/admin/whatsapp/difusion", "page");

  return {
    ok: run.ok,
    message: run.error,
    broadcastId: id.data,
    sent: run.sent,
    failed: run.failed,
    remaining: run.remaining,
  };
}
