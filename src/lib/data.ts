import "server-only";

import { getServerSupabase } from "./supabase/server";
import {
  FALLBACK_LINKS,
  FALLBACK_ORGS,
  FALLBACK_REPORTS,
  FALLBACK_RESOURCES,
  FALLBACK_STATUS,
  FALLBACK_UPDATES,
  FALLBACK_ZONES,
} from "./fallback-data";
import type {
  Organization,
  PublicReport,
  Resource,
  ServiceStatus,
  SiteLink,
  Update,
  Zone,
} from "./types";

/**
 * Every read goes through this helper.
 *
 * The contract: a page never fails because the database is down. During a
 * disaster the site is most valuable at exactly the moment our infrastructure
 * is least reliable, so a failed query degrades to seed content and the page
 * renders with a visible "datos de respaldo" notice rather than a 500.
 */
async function query<T>(
  label: string,
  fallback: T,
  run: (
    supabase: NonNullable<Awaited<ReturnType<typeof getServerSupabase>>>,
  ) => Promise<{ data: T | null; error: { message: string } | null }>,
): Promise<{ data: T; degraded: boolean }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { data: fallback, degraded: true };

  try {
    const { data, error } = await run(supabase);
    if (error) {
      console.error(`[data] ${label} failed: ${error.message}`);
      return { data: fallback, degraded: true };
    }
    if (data === null) return { data: fallback, degraded: true };
    return { data, degraded: false };
  } catch (err) {
    console.error(`[data] ${label} threw:`, err);
    return { data: fallback, degraded: true };
  }
}

export async function getServiceStatus() {
  return query<ServiceStatus[]>("getServiceStatus", FALLBACK_STATUS, async (sb) => {
    const res = await sb
      .from("current_service_status")
      .select("*")
      .order("service", { ascending: true });
    return res as { data: ServiceStatus[] | null; error: { message: string } | null };
  });
}

export async function getUpdates(limit = 30) {
  return query<Update[]>("getUpdates", FALLBACK_UPDATES, async (sb) => {
    const res = await sb
      .from("updates")
      .select(
        "id, slug, title, summary, body, severity, services, zone_slugs, " +
          "source, source_name, source_url, pinned, published_at",
      )
      .eq("status", "published")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);
    return res as { data: Update[] | null; error: { message: string } | null };
  });
}

export async function getUpdateBySlug(slug: string) {
  const match = FALLBACK_UPDATES.find((u) => u.slug === slug) ?? null;
  return query<Update | null>("getUpdateBySlug", match, async (sb) => {
    const res = await sb
      .from("updates")
      .select(
        "id, slug, title, summary, body, severity, services, zone_slugs, " +
          "source, source_name, source_url, pinned, published_at",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    return res as { data: Update | null; error: { message: string } | null };
  });
}

export async function getZones() {
  return query<Zone[]>("getZones", FALLBACK_ZONES, async (sb) => {
    const res = await sb
      .from("zones")
      .select("slug, name, kind")
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    return res as { data: Zone[] | null; error: { message: string } | null };
  });
}

export async function getPublicReports(limit = 50) {
  return query<PublicReport[]>("getPublicReports", FALLBACK_REPORTS, async (sb) => {
    const res = await sb
      .from("public_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return res as { data: PublicReport[] | null; error: { message: string } | null };
  });
}

export async function getOrganizations() {
  return query<Organization[]>("getOrganizations", FALLBACK_ORGS, async (sb) => {
    const res = await sb
      .from("public_organizations")
      .select("id, slug, name, short_name, type, services, website, logo_url, verified")
      .order("type", { ascending: true })
      .order("name", { ascending: true });
    return res as { data: Organization[] | null; error: { message: string } | null };
  });
}

export async function getLinks() {
  return query<SiteLink[]>("getLinks", FALLBACK_LINKS, async (sb) => {
    const res = await sb
      .from("links")
      .select("id, category, title, url, description, operator, source, sort_order, verified")
      .eq("verified", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    return res as { data: SiteLink[] | null; error: { message: string } | null };
  });
}

export async function getResources() {
  return query<Resource[]>("getResources", FALLBACK_RESOURCES, async (sb) => {
    const res = await sb
      .from("resources")
      .select(
        "id, kind, name, description, zone_slug, address, phone, hours, " +
          "capacity, occupancy, status, verified",
      )
      .eq("verified", true)
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    return res as { data: Resource[] | null; error: { message: string } | null };
  });
}
