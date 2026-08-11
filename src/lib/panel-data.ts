import "server-only";

import { getServerSupabase } from "./supabase/server";
import type { ServiceReport, ServiceType } from "./types";

/**
 * Reads for the operator console.
 *
 * Deliberately does NOT go through `query()` in `data.ts`, and this is the same
 * call `/admin` makes. That helper's contract is "a public page never fails,
 * it degrades to seed content" — which is exactly wrong here. A control room
 * shown seed data instead of an error would dispatch crews against fiction. So
 * this returns an explicit error and the page renders it.
 *
 * It still never throws: a console that 500s during an aftershock is no more
 * acceptable than a public page that does.
 */

/** How far back the console looks. Matches the public 12-hour window. */
export const PANEL_WINDOW_HOURS = 12;

const SELECT =
  "id, service, status, zone_slug, lat, lng, location_accuracy_m, location_source, address_hint, matricula, contact_phone, on_behalf, hazard, since, note, acknowledged_at, created_at";

export interface PanelReports {
  reports: ServiceReport[];
  /** Null when the read succeeded, including when it legitimately found none. */
  error: string | null;
  /** False when Supabase is not configured at all. */
  configured: boolean;
}

export async function getOperatorReports(
  service: ServiceType = "electricity",
  hours: number = PANEL_WINDOW_HOURS,
): Promise<PanelReports> {
  const supabase = await getServerSupabase();
  if (!supabase) return { reports: [], error: null, configured: false };

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  try {
    /*
     * RLS decides what comes back, not this query: `can_see_service_reports`
     * scopes rows to the caller's organization's `services`. A signed-in
     * account with no organization gets an empty list rather than an error,
     * which is why the page renders "no reports" and "no permission" as the
     * same honest empty state instead of guessing them apart in TypeScript.
     */
    const { data, error } = await supabase
      .from("service_reports")
      .select(SELECT)
      .eq("service", service)
      .eq("flagged", false)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error(`[getOperatorReports] ${error.message}`);
      return { reports: [], error: error.message, configured: true };
    }

    return {
      reports: (data ?? []) as ServiceReport[],
      error: null,
      configured: true,
    };
  } catch (err) {
    console.error("[getOperatorReports] threw:", err);
    return { reports: [], error: "unexpected", configured: true };
  }
}
