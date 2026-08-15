"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";

import { getServerSupabase } from "./supabase/server";
import { REPORT_CATEGORIES } from "./i18n";
import { INSTRUMENT_SERVICES, INSTRUMENTS } from "./service-instruments";

const SERVICES = [
  "electricity",
  "water",
  "gas",
  "internet",
  "mobile",
  "transport",
  "health",
  "fuel",
  "education",
  "banking",
] as const;

const reportSchema = z.object({
  category: z.enum(REPORT_CATEGORIES),
  service: z.enum(SERVICES).nullish(),
  zone_slug: z.string().min(1).max(64).nullish(),
  address_hint: z.string().max(200).nullish(),
  // Written by GPS or the map picker, never typed. Optional here — unlike the
  // service instruments, a community report without coordinates is still
  // useful to a moderator, so we ask rather than require.
  lat: z.coerce.number().min(-90).max(90).nullish(),
  lng: z.coerce.number().min(-180).max(180).nullish(),
  description: z.string().min(10).max(4000),
  contact_name: z.string().max(120).nullish(),
  contact_phone: z.string().max(40).nullish(),
});

export type SubmitReportState = {
  ok: boolean;
  error?: "validation" | "server";
  fieldErrors?: Record<string, string[]>;
};

/** Blank strings from an HTML form should be null, not "". */
function nullify(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ---------------------------------------------------------------------------
// Service reports (/luz)
// ---------------------------------------------------------------------------

const REPORTED_STATUSES = ["outage", "degraded", "operational"] as const;
const LOCATION_SOURCES = ["gps", "map", "zone"] as const;
const OUTAGE_SINCE = ["since_quake", "today", "last_hour", "unknown"] as const;

/**
 * Reduce a phone number to digits so the same household typing "310 123 4567"
 * and "3101234567" collapses to one row in `service_report_density`.
 *
 * This is the identity key the public household count is built on, so it has to
 * be stable. It is deliberately permissive about what it accepts: a real number
 * we reject is a household the operator never hears about, which is a worse
 * failure than a fake number we store.
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // +57 country code, with or without the plus, on a 10-digit mobile.
  if (digits.length === 12 && digits.startsWith("57")) return digits.slice(2);
  return digits;
}

const serviceReportSchema = z
  .object({
    service: z.enum(INSTRUMENT_SERVICES),
    status: z.enum(REPORTED_STATUSES),
    zone_slug: z.string().min(1).max(64).nullish(),
    lat: z.coerce.number().min(-90).max(90).nullish(),
    lng: z.coerce.number().min(-180).max(180).nullish(),
    location_accuracy_m: z.coerce.number().min(0).max(100_000).nullish(),
    location_source: z.enum(LOCATION_SOURCES).nullish(),
    address_hint: z.string().max(200).nullish(),
    matricula: z.string().max(40).nullish(),
    contact_phone: z
      .string()
      .transform(normalizePhone)
      .refine((v) => v.length >= 7 && v.length <= 12, { message: "phone" }),
    on_behalf: z.boolean(),
    hazard: z.boolean(),
    since: z.enum(OUTAGE_SINCE),
    note: z.string().max(600).nullish(),
  })
  // A report with neither a zone nor coordinates cannot be acted on by anyone,
  // so it is a validation failure rather than a row nobody can use.
  .refine(
    (v) => Boolean(v.zone_slug) || (v.lat != null && v.lng != null),
    { path: ["zone_slug"], message: "location" },
  );

export type SubmitServiceReportState = {
  ok: boolean;
  error?: "validation" | "server";
  fieldErrors?: Record<string, string[]>;
};

function checked(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

/**
 * File a household report about a utility.
 *
 * Fails loudly, like `submitReport` and for the same reason: someone is telling
 * an operator their street is dark, and a false "recibido" is worse than an
 * error they can retry.
 */
export async function submitServiceReport(
  _prev: SubmitServiceReportState,
  formData: FormData,
): Promise<SubmitServiceReportState> {
  const parsed = serviceReportSchema.safeParse({
    service: nullify(formData.get("service")),
    status: nullify(formData.get("status")),
    zone_slug: nullify(formData.get("zone_slug")),
    lat: nullify(formData.get("lat")),
    lng: nullify(formData.get("lng")),
    location_accuracy_m: nullify(formData.get("location_accuracy_m")),
    location_source: nullify(formData.get("location_source")),
    address_hint: nullify(formData.get("address_hint")),
    matricula: nullify(formData.get("matricula")),
    contact_phone: nullify(formData.get("contact_phone")) ?? "",
    on_behalf: checked(formData.get("on_behalf")),
    hazard: checked(formData.get("hazard")),
    since: nullify(formData.get("since")) ?? "unknown",
    note: nullify(formData.get("note")),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  /*
   * The launch switch, enforced where it counts. The page renders the closed
   * state, but a hand-crafted POST must not file into an instrument whose
   * operator has not confirmed anyone is reading — see
   * `src/lib/service-instruments.ts`.
   */
  if (!INSTRUMENTS[parsed.data.service].live) {
    console.error(
      `[submitServiceReport] rejected: ${parsed.data.service} instrument is not live`,
    );
    return { ok: false, error: "server" };
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    console.error("[submitServiceReport] Supabase not configured; report dropped");
    return { ok: false, error: "server" };
  }

  const h = await headers();
  const rawIp =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const submitterHash = createHash("sha256")
    .update(`${rawIp}:${process.env.REPORT_HASH_SALT ?? "sismo-pereira"}`)
    .digest("hex")
    .slice(0, 32);

  const { error } = await supabase.from("service_reports").insert({
    ...parsed.data,
    // Records that the sharing notice was displayed at submission — not a
    // ticked consent box. See docs/DECISIONS.md.
    consent_share: true,
    submitter_hash: submitterHash,
  });

  if (error) {
    console.error(`[submitServiceReport] insert failed: ${error.message}`);
    return { ok: false, error: "server" };
  }

  return { ok: true };
}

export async function submitReport(
  _prev: SubmitReportState,
  formData: FormData,
): Promise<SubmitReportState> {
  const parsed = reportSchema.safeParse({
    category: nullify(formData.get("category")),
    service: nullify(formData.get("service")),
    zone_slug: nullify(formData.get("zone_slug")),
    address_hint: nullify(formData.get("address_hint")),
    lat: nullify(formData.get("lat")),
    lng: nullify(formData.get("lng")),
    description: nullify(formData.get("description")),
    contact_name: nullify(formData.get("contact_name")),
    contact_phone: nullify(formData.get("contact_phone")),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    // Supabase isn't provisioned yet. Fail loudly rather than pretending the
    // report was filed — someone may be reporting a person trapped in rubble.
    console.error("[submitReport] Supabase not configured; report dropped");
    return { ok: false, error: "server" };
  }

  // Coarse, non-reversible submitter fingerprint for abuse triage only.
  // We deliberately never store the raw IP.
  const h = await headers();
  const rawIp =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const submitterHash = createHash("sha256")
    .update(`${rawIp}:${process.env.REPORT_HASH_SALT ?? "sismo-pereira"}`)
    .digest("hex")
    .slice(0, 32);

  const { error } = await supabase.from("reports").insert({
    ...parsed.data,
    status: "pending",
    submitter_hash: submitterHash,
  });

  if (error) {
    console.error(`[submitReport] insert failed: ${error.message}`);
    return { ok: false, error: "server" };
  }

  return { ok: true };
}
