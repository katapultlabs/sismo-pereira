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
  verified: boolean;
}
