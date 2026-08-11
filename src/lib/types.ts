/**
 * Domain types. These mirror the enums in
 * `supabase/migrations/20260810120000_initial_schema.sql` — keep them in sync.
 */

export type ServiceType =
  | "electricity"
  | "water"
  | "gas"
  | "internet"
  | "mobile"
  | "transport"
  | "health"
  | "fuel"
  | "education"
  | "banking";

export type StatusLevel =
  | "operational"
  | "degraded"
  | "outage"
  | "restoring"
  | "unknown";

export type SeverityLevel = "info" | "warning" | "critical";

export type SourceKind = "official" | "social" | "private" | "media" | "community";

export type ReportStatus = "pending" | "verified" | "rejected" | "duplicate";

export type OrgType =
  | "utility"
  | "telco"
  | "government"
  | "ngo"
  | "media"
  | "community"
  | "health";

export type ResourceKind =
  | "shelter"
  | "hospital"
  | "clinic"
  | "aid_point"
  | "water_point"
  | "food"
  | "charging"
  | "fuel"
  | "pet_shelter"
  | "info_point"
  | "donation_point";

export type ZoneKind = "comuna" | "corregimiento" | "municipio";

/** How a service report's coordinates were obtained. A dragged pin is a weaker
 *  claim than a device fix, and the operator needs to be able to tell. */
export type LocationSource = "gps" | "map" | "zone";

/** Roughly when the service went out, in the buckets people actually know. */
export type OutageSince = "since_quake" | "today" | "last_hour" | "unknown";

/**
 * What a resident may say about a service. A narrowing of `StatusLevel`:
 * `restoring` is an operator's word, not a resident's, and is enforced out at
 * the database by a check constraint.
 */
export type ReportedStatus = Extract<
  StatusLevel,
  "outage" | "degraded" | "operational" | "unknown"
>;

/** Declaration order is display order, matching the Postgres enum. */
export type LinkCategory =
  | "missing_persons"
  | "official"
  | "seismic"
  | "aid"
  | "donations"
  | "health"
  | "transport"
  | "media";

export interface Zone {
  slug: string;
  name: string;
  kind: ZoneKind;
}

export interface ServiceStatus {
  id: string;
  service: ServiceType;
  zone_slug: string | null;
  zone_name: string | null;
  status: StatusLevel;
  headline: string | null;
  detail: string | null;
  affected_users: number | null;
  eta_restored: string | null;
  source: SourceKind;
  source_url: string | null;
  reported_at: string;
  org_name: string | null;
  org_short_name: string | null;
  org_slug: string | null;
}

export interface Update {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  severity: SeverityLevel;
  services: ServiceType[];
  zone_slugs: string[];
  source: SourceKind;
  source_name: string | null;
  source_url: string | null;
  pinned: boolean;
  published_at: string | null;
}

export interface PublicReport {
  id: string;
  category: string;
  service: ServiceType | null;
  zone_slug: string | null;
  zone_name: string | null;
  address_hint: string | null;
  description: string;
  photo_url: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  type: OrgType;
  services: ServiceType[];
  website: string | null;
  logo_url: string | null;
  verified: boolean;
}

/**
 * An outbound link to a site we do not operate.
 *
 * `operator` and `source` are not decoration: they are how a reader tells an
 * official registry from a citizen-run one before clicking. Neither is
 * optional in the UI — see `src/app/enlaces/page.tsx`.
 */
export interface SiteLink {
  id: string;
  category: LinkCategory;
  title: string;
  url: string;
  description: string | null;
  operator: string;
  source: SourceKind;
  sort_order: number;
  verified: boolean;
}

/**
 * The public projection of `service_reports` — the *only* one.
 *
 * Counts, never locations. Individual rows carry a phone number and a
 * house-accurate GPS fix; publishing them as pins would identify households.
 * Mirrors the `service_report_density` view, which aggregates over a rolling
 * 12-hour window.
 */
export interface ServiceReportDensity {
  service: ServiceType;
  zone_slug: string | null;
  zone_name: string | null;
  zone_kind: ZoneKind | null;
  outage_count: number;
  degraded_count: number;
  operational_count: number;
  hazard_count: number;
  total_count: number;
  last_reported_at: string;
}

/**
 * A precise report row. Readable only by moderators and by staff of the
 * verified organization that operates the reported service — see the RLS in
 * `supabase/migrations/20260811090000_service_reports.sql`. Never render this
 * on a public page.
 */
export interface ServiceReport {
  id: string;
  service: ServiceType;
  status: ReportedStatus;
  zone_slug: string | null;
  lat: number | null;
  lng: number | null;
  location_accuracy_m: number | null;
  location_source: LocationSource | null;
  address_hint: string | null;
  matricula: string | null;
  contact_phone: string | null;
  on_behalf: boolean;
  hazard: boolean;
  since: OutageSince;
  note: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  kind: ResourceKind;
  name: string;
  description: string | null;
  zone_slug: string | null;
  address: string | null;
  phone: string | null;
  hours: string | null;
  capacity: number | null;
  occupancy: number | null;
  status: StatusLevel;
  /**
   * What to bring. Only a `donation_point` normally carries one, and an empty
   * array is the honest state — it means the operator has not published a
   * list, not that anything is welcome. Display order is array order.
   */
  needs: string[];
  /** Rule 3: a place carries its source exactly as a status card does. */
  source: SourceKind;
  source_name: string | null;
  source_url: string | null;
  verified: boolean;
  updated_at: string;
}
