"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";

import { getServerSupabase } from "./supabase/server";
import { REPORT_CATEGORIES } from "./i18n";

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

export async function submitReport(
  _prev: SubmitReportState,
  formData: FormData,
): Promise<SubmitReportState> {
  const parsed = reportSchema.safeParse({
    category: nullify(formData.get("category")),
    service: nullify(formData.get("service")),
    zone_slug: nullify(formData.get("zone_slug")),
    address_hint: nullify(formData.get("address_hint")),
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
