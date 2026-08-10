import { z } from "zod";

import { authenticateOrg, jsonError } from "@/lib/api-auth";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getUpdates } from "@/lib/data";

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

const updateSchema = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().max(500).nullish(),
  body: z.string().max(20_000).nullish(),
  lang: z.enum(["es", "en"]).default("es"),
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  services: z.array(z.enum(SERVICES)).max(10).default([]),
  zone_slugs: z.array(z.string().min(1).max(64)).max(40).default([]),
  source_url: z.url().nullish(),
  /**
   * Partners publish live by default — during an incident, a queue that a
   * moderator must drain is a queue that goes unread. Anything they publish is
   * attributed to them and moderators can archive it after the fact.
   */
  publish: z.boolean().default(true),
});

/** GET /api/v1/updates — public read of the published feed. */
export async function GET(request: Request) {
  const limit = Math.min(
    Number(new URL(request.url).searchParams.get("limit") ?? 30) || 30,
    100,
  );
  const { data, degraded } = await getUpdates(limit);

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

/** POST /api/v1/updates — partner publishing, attributed to the caller's org. */
export async function POST(request: Request) {
  const auth = await authenticateOrg(request);
  if (!auth.ok) return jsonError(auth.status, auth.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Body must be valid JSON.");
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "Payload failed validation.", z.treeifyError(parsed.error));
  }

  const supabase = getServiceSupabase();
  if (!supabase) return jsonError(503, "Ingestion backend unavailable.");

  const input = parsed.data;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("updates")
    .insert({
      title: input.title,
      summary: input.summary ?? null,
      body: input.body ?? null,
      lang: input.lang,
      severity: input.severity,
      services: input.services,
      zone_slugs: input.zone_slugs,
      source: "official",
      source_name: auth.org.name,
      source_url: input.source_url ?? null,
      org_id: auth.org.id,
      status: input.publish ? "published" : "draft",
      published_at: input.publish ? now : null,
      // Slugs are generated from the title plus a timestamp so two partners
      // posting "Restablecimiento del servicio" don't collide.
      slug: `${slugify(input.title)}-${Date.now().toString(36)}`,
    })
    .select("id, slug, status, published_at")
    .single();

  if (error) {
    console.error(`[api/v1/updates] insert failed: ${error.message}`);
    return jsonError(500, "Could not record update.");
  }

  return Response.json(
    { ok: true, organization: auth.org.slug, data },
    { status: 201 },
  );
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
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
