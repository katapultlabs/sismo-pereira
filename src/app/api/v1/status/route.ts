import { z } from "zod";

import { authenticateOrg, jsonError } from "@/lib/api-auth";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getServiceStatus } from "@/lib/data";

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

const STATUSES = [
  "operational",
  "degraded",
  "outage",
  "restoring",
  "unknown",
] as const;

const statusEntry = z.object({
  service: z.enum(SERVICES),
  zone_slug: z.string().min(1).max(64).default("pereira"),
  status: z.enum(STATUSES),
  headline: z.string().max(200).nullish(),
  detail: z.string().max(4000).nullish(),
  affected_users: z.number().int().min(0).nullish(),
  eta_restored: z.iso.datetime({ offset: true }).nullish(),
  source_url: z.url().nullish(),
  reported_at: z.iso.datetime({ offset: true }).nullish(),
});

// Accept a single object or a batch, so an operator can push their whole grid
// in one call during an incident rather than N round-trips on a strained network.
const payloadSchema = z.union([
  statusEntry,
  z.object({ entries: z.array(statusEntry).min(1).max(200) }),
]);

/**
 * GET /api/v1/status
 *
 * Public, unauthenticated read of the current status board. Deliberately open:
 * other responders, newsrooms, and community bots should be able to mirror this
 * data rather than scrape the HTML.
 */
export async function GET() {
  const { data, degraded } = await getServiceStatus();

  return Response.json(
    {
      ok: true,
      degraded,
      generated_at: new Date().toISOString(),
      count: data.length,
      data,
    },
    {
      headers: {
        "cache-control": "public, s-maxage=30, stale-while-revalidate=120",
        "access-control-allow-origin": "*",
      },
    },
  );
}

/**
 * POST /api/v1/status
 *
 * Partner ingestion. Utilities and telcos push service status here with an
 * API key. Rows are always attributed to the authenticated organization — a
 * partner can never publish under someone else's name.
 */
export async function POST(request: Request) {
  const auth = await authenticateOrg(request);
  if (!auth.ok) return jsonError(auth.status, auth.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Body must be valid JSON.");
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "Payload failed validation.", z.treeifyError(parsed.error));
  }

  const entries =
    "entries" in parsed.data ? parsed.data.entries : [parsed.data];

  // An org may only report on services it is registered for. Without this an
  // electricity utility could publish (or contradict) water status.
  if (auth.org.services.length > 0) {
    const notAllowed = entries
      .map((e) => e.service)
      .filter((service) => !auth.org.services.includes(service));

    if (notAllowed.length > 0) {
      return jsonError(
        403,
        `Organization is not registered for: ${[...new Set(notAllowed)].join(", ")}.`,
      );
    }
  }

  const supabase = getServiceSupabase();
  if (!supabase) return jsonError(503, "Ingestion backend unavailable.");

  const rows = entries.map((entry) => ({
    org_id: auth.org.id,
    service: entry.service,
    zone_slug: entry.zone_slug,
    status: entry.status,
    headline: entry.headline ?? null,
    detail: entry.detail ?? null,
    affected_users: entry.affected_users ?? null,
    eta_restored: entry.eta_restored ?? null,
    source: "official" as const,
    source_url: entry.source_url ?? null,
    reported_at: entry.reported_at ?? new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("service_status")
    .insert(rows)
    .select("id, service, zone_slug, status, reported_at");

  if (error) {
    console.error(`[api/v1/status] insert failed: ${error.message}`);
    return jsonError(500, "Could not record status.");
  }

  return Response.json(
    { ok: true, organization: auth.org.slug, inserted: data?.length ?? 0, data },
    { status: 201 },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
    },
  });
}
