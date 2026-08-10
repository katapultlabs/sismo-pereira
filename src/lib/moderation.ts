"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getServerSupabase } from "./supabase/server";

const decisionSchema = z.object({
  id: z.uuid(),
  decision: z.enum(["verified", "rejected", "duplicate"]),
  note: z.string().max(1000).optional(),
});

export type ModerationState = { ok: boolean; message?: string };

/**
 * Approve or reject a community report.
 *
 * This intentionally uses the RLS-scoped user client, not the service role:
 * the `reports_moderator_write` policy is the authority on who may moderate,
 * so a non-moderator session simply updates zero rows.
 */
export async function moderateReport(
  _prev: ModerationState,
  formData: FormData,
): Promise<ModerationState> {
  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: "Backend unavailable." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: parsed.data.decision,
      moderator_note: parsed.data.note ?? null,
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .select("id");

  if (error) {
    console.error(`[moderateReport] ${error.message}`);
    return { ok: false, message: "Could not save decision." };
  }

  if (!data || data.length === 0) {
    return { ok: false, message: "Not permitted." };
  }

  revalidatePath("/[lang]/admin", "page");
  revalidatePath("/[lang]/reportes", "page");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase?.auth.signOut();
  revalidatePath("/", "layout");
}
