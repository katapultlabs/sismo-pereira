import { getServerSupabase } from "@/lib/supabase/server";
import type { ServiceReport } from "@/lib/types";

/**
 * CSV of the household reports this session is allowed to see.
 *
 * Exists because a utility that has lost its systems does not want to work
 * inside somebody else's web console — it wants the rows in the tools it
 * already has. This is the hand-off path.
 *
 * Authorization is the RLS policy `can_see_service_reports`, reached through
 * the cookie-scoped client: an anonymous request produces an empty file rather
 * than an error, and an org gets only its own services. There is no service
 * role anywhere near this route.
 */
export const dynamic = "force-dynamic";

const SELECT =
  "id, service, status, zone_slug, lat, lng, location_accuracy_m, location_source, address_hint, matricula, contact_phone, on_behalf, hazard, since, note, acknowledged_at, created_at";

const COLUMNS: (keyof ServiceReport)[] = [
  "created_at",
  "status",
  "since",
  "zone_slug",
  "address_hint",
  "lat",
  "lng",
  "location_accuracy_m",
  "location_source",
  "contact_phone",
  "matricula",
  "on_behalf",
  "hazard",
  "note",
  "acknowledged_at",
  "id",
];

/**
 * Excel on a Colombian locale happily reads `=cmd|…` in a cell as a formula, so
 * any value that could start one is prefixed. Phone numbers beginning with `+`
 * are the realistic case here, not an exotic attack.
 */
function csvCell(value: unknown): string {
  if (value == null) return "";
  const raw = String(value);
  const escaped = raw.replace(/"/g, '""');
  const risky = /^[=+\-@\t\r]/.test(raw);
  return `"${risky ? `'${escaped}` : escaped}"`;
}

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return new Response("Base de datos no disponible.\n", { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Inicia sesión.\n", { status: 401 });
  }

  const { data, error } = await supabase
    .from("service_reports")
    .select(SELECT)
    .eq("flagged", false)
    .order("created_at", { ascending: false })
    .limit(10_000);

  if (error) {
    console.error(`[panel/export] ${error.message}`);
    return new Response("No se pudo generar el archivo.\n", { status: 500 });
  }

  const rows = (data ?? []) as ServiceReport[];
  const body = [
    COLUMNS.join(","),
    ...rows.map((row) => COLUMNS.map((c) => csvCell(row[c])).join(",")),
  ].join("\n");

  // Timestamp in the filename so successive pulls do not overwrite each other
  // in a downloads folder during a shift.
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");

  return new Response(`﻿${body}\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="reportes-energia-${stamp}.csv"`,
      // Contains contact details: never let a proxy or the browser keep it.
      "cache-control": "no-store, private",
    },
  });
}
