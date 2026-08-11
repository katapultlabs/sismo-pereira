"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getServerSupabase } from "./supabase/server";

const ackSchema = z.object({
  id: z.uuid(),
  // Un-acknowledging matters: a dispatcher who ticks the wrong row needs to put
  // it back in the queue, and there is nobody to ask for help at 3am.
  acknowledged: z.enum(["true", "false"]),
});

export type PanelActionState = { ok: boolean; message?: string };

/**
 * Mark a household report as seen by the operator.
 *
 * Uses the RLS-scoped user client on purpose, like `moderateReport`: the
 * `service_reports_org_update` policy plus the column-level grant decide what
 * this can touch, so a session outside the operating organization updates zero
 * rows rather than being blocked by a check in TypeScript.
 */
export async function acknowledgeReport(
  _prev: PanelActionState,
  formData: FormData,
): Promise<PanelActionState> {
  const parsed = ackSchema.safeParse({
    id: formData.get("id"),
    acknowledged: formData.get("acknowledged"),
  });

  if (!parsed.success) return { ok: false, message: "Entrada inválida." };

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: "Base de datos no disponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesión no iniciada." };

  const on = parsed.data.acknowledged === "true";

  const { data, error } = await supabase
    .from("service_reports")
    .update({
      acknowledged_at: on ? new Date().toISOString() : null,
      acknowledged_by: on ? user.id : null,
    })
    .eq("id", parsed.data.id)
    .select("id");

  if (error) {
    console.error(`[acknowledgeReport] ${error.message}`);
    return { ok: false, message: "No se pudo guardar." };
  }

  if (!data || data.length === 0) {
    return { ok: false, message: "Sin permisos sobre este reporte." };
  }

  revalidatePath("/panel", "page");
  return { ok: true };
}

/** Hide an obviously bogus report from the public household counts. */
export async function flagReport(
  _prev: PanelActionState,
  formData: FormData,
): Promise<PanelActionState> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Entrada inválida." };

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: "Base de datos no disponible." };

  const { data, error } = await supabase
    .from("service_reports")
    .update({ flagged: true })
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error(`[flagReport] ${error.message}`);
    return { ok: false, message: "No se pudo guardar." };
  }
  if (!data || data.length === 0) {
    return { ok: false, message: "Sin permisos sobre este reporte." };
  }

  revalidatePath("/panel", "page");
  revalidatePath("/luz", "page");
  return { ok: true };
}
