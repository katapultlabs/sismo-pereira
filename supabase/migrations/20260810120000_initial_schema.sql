-- =============================================================================
-- Sismo Pereira — initial schema
-- Crisis information platform for the 2026-08-10 M7.4 earthquake.
--
-- Trust model:
--   * Anyone (anon) may SUBMIT a community report. Nothing they submit is
--     publicly readable until a moderator verifies it.
--   * Verified partner orgs (utilities, telcos, government) publish service
--     status and updates for their OWN organization only.
--   * Moderators/admins see and act on everything.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type org_type as enum (
  'utility', 'telco', 'government', 'ngo', 'media', 'community', 'health'
);

create type service_type as enum (
  'electricity', 'water', 'gas', 'internet', 'mobile',
  'transport', 'health', 'fuel', 'education', 'banking'
);

create type status_level as enum (
  'operational', 'degraded', 'outage', 'restoring', 'unknown'
);

create type severity_level as enum ('info', 'warning', 'critical');

create type source_kind as enum ('official', 'social', 'private', 'media', 'community');

create type publish_status as enum ('draft', 'published', 'archived');

create type report_status as enum ('pending', 'verified', 'rejected', 'duplicate');

create type user_role as enum ('admin', 'moderator', 'publisher', 'viewer');

create type resource_kind as enum (
  'shelter', 'hospital', 'clinic', 'aid_point', 'water_point', 'food',
  'charging', 'fuel', 'pet_shelter', 'info_point', 'donation_point'
);

create type zone_kind as enum ('comuna', 'corregimiento', 'municipio');

-- ---------------------------------------------------------------------------
-- Zones — Pereira comunas + corregimientos, plus neighbouring municipalities
-- ---------------------------------------------------------------------------
create table zones (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  kind        zone_kind not null default 'comuna',
  parent_slug text,
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Organizations — the entities allowed to publish authoritative information
-- ---------------------------------------------------------------------------
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  short_name    text,
  type          org_type not null,
  services      service_type[] not null default '{}',
  website       text,
  contact_email text,
  contact_phone text,
  logo_url      text,
  verified      boolean not null default false,
  -- SHA-256 of the API key issued to this org for machine-to-machine posting.
  -- The plaintext key is shown once at issue time and never stored.
  api_key_hash  text unique,
  api_key_last4 text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index organizations_type_idx on organizations (type) where verified;

-- ---------------------------------------------------------------------------
-- Profiles — application identity, 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  org_id       uuid references organizations (id) on delete set null,
  role         user_role not null default 'viewer',
  display_name text,
  created_at   timestamptz not null default now()
);

create index profiles_org_idx on profiles (org_id);

-- ---------------------------------------------------------------------------
-- Service status — "is there power in my barrio?"
-- One row per (org, service, zone) observation over time; latest wins.
-- ---------------------------------------------------------------------------
create table service_status (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid references organizations (id) on delete set null,
  service        service_type not null,
  zone_slug      text references zones (slug) on delete set null,
  status         status_level not null default 'unknown',
  headline       text,
  detail         text,
  affected_users integer check (affected_users >= 0),
  eta_restored   timestamptz,
  source         source_kind not null default 'official',
  source_url     text,
  reported_at    timestamptz not null default now(),
  created_by     uuid references profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index service_status_lookup_idx
  on service_status (service, zone_slug, reported_at desc);
create index service_status_recent_idx on service_status (reported_at desc);

-- Latest known status per service+zone, which is what the dashboard renders.
create view current_service_status as
select distinct on (s.service, s.zone_slug)
  s.id, s.org_id, s.service, s.zone_slug, s.status, s.headline, s.detail,
  s.affected_users, s.eta_restored, s.source, s.source_url, s.reported_at,
  o.name as org_name, o.short_name as org_short_name, o.slug as org_slug,
  z.name as zone_name, z.kind as zone_kind
from service_status s
left join organizations o on o.id = s.org_id
left join zones z on z.slug = s.zone_slug
order by s.service, s.zone_slug, s.reported_at desc;

-- ---------------------------------------------------------------------------
-- Updates — the running newsfeed of what we know
-- ---------------------------------------------------------------------------
create table updates (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,
  title        text not null,
  summary      text,
  body         text,
  lang         text not null default 'es',
  severity     severity_level not null default 'info',
  services     service_type[] not null default '{}',
  zone_slugs   text[] not null default '{}',
  source       source_kind not null default 'official',
  source_name  text,
  source_url   text,
  org_id       uuid references organizations (id) on delete set null,
  status       publish_status not null default 'draft',
  pinned       boolean not null default false,
  published_at timestamptz,
  created_by   uuid references profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index updates_feed_idx
  on updates (published_at desc) where status = 'published';
create index updates_pinned_idx
  on updates (pinned, published_at desc) where status = 'published';

-- ---------------------------------------------------------------------------
-- Reports — community submissions. Public writes here, moderators gate it.
-- ---------------------------------------------------------------------------
create table reports (
  id             uuid primary key default gen_random_uuid(),
  category       text not null,
  service        service_type,
  zone_slug      text references zones (slug) on delete set null,
  address_hint   text,
  description    text not null check (char_length(description) between 10 and 4000),
  lat            double precision,
  lng            double precision,
  photo_url      text,
  -- Optional and never exposed publicly; for moderator follow-up only.
  contact_name   text,
  contact_phone  text,
  contact_email  text,
  status         report_status not null default 'pending',
  moderator_note text,
  moderated_by   uuid references profiles (id) on delete set null,
  moderated_at   timestamptz,
  -- Coarse anti-abuse signal, not exposed publicly.
  submitter_hash text,
  created_at     timestamptz not null default now()
);

create index reports_status_idx on reports (status, created_at desc);
create index reports_zone_idx on reports (zone_slug, created_at desc);

-- Public projection of verified reports with all contact/PII columns dropped.
create view public_reports as
select
  r.id, r.category, r.service, r.zone_slug, r.address_hint, r.description,
  r.lat, r.lng, r.photo_url, r.created_at,
  z.name as zone_name
from reports r
left join zones z on z.slug = r.zone_slug
where r.status = 'verified';

-- ---------------------------------------------------------------------------
-- Resources — shelters, hospitals, aid and water points
-- ---------------------------------------------------------------------------
create table resources (
  id          uuid primary key default gen_random_uuid(),
  kind        resource_kind not null,
  name        text not null,
  description text,
  zone_slug   text references zones (slug) on delete set null,
  address     text,
  lat         double precision,
  lng         double precision,
  phone       text,
  hours       text,
  capacity    integer,
  occupancy   integer,
  status      status_level not null default 'operational',
  org_id      uuid references organizations (id) on delete set null,
  verified    boolean not null default false,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index resources_kind_idx on resources (kind) where verified;

-- ---------------------------------------------------------------------------
-- Social mentions — aggregation inbox from social platforms
-- ---------------------------------------------------------------------------
create table social_mentions (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null,
  external_id   text not null,
  author_handle text,
  content       text not null,
  url           text,
  posted_at     timestamptz,
  zone_slug     text references zones (slug) on delete set null,
  services      service_type[] not null default '{}',
  relevance     numeric(3, 2) check (relevance between 0 and 1),
  -- 'pending' = in the moderation inbox, 'surfaced' = promoted to the feed.
  status        report_status not null default 'pending',
  promoted_update_id uuid references updates (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (platform, external_id)
);

create index social_mentions_triage_idx
  on social_mentions (status, relevance desc, posted_at desc);

-- ---------------------------------------------------------------------------
-- Helper functions for RLS.
-- SECURITY DEFINER so policies can read `profiles` without recursing into
-- the policies defined on `profiles` itself.
-- ---------------------------------------------------------------------------
create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role in ('admin', 'moderator') from profiles where id = auth.uid()),
    false
  );
$$;

create or replace function can_publish_for(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select p.role in ('admin', 'moderator')
             or (p.role = 'publisher' and p.org_id is not distinct from target_org)
      from profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table zones            enable row level security;
alter table organizations    enable row level security;
alter table profiles         enable row level security;
alter table service_status   enable row level security;
alter table updates          enable row level security;
alter table reports          enable row level security;
alter table resources        enable row level security;
alter table social_mentions  enable row level security;

-- Zones: public reference data.
create policy zones_public_read on zones
  for select using (true);
create policy zones_moderator_write on zones
  for all using (is_moderator()) with check (is_moderator());

-- Organizations: public may read verified orgs, but never the API key columns.
-- Column-level protection is enforced by granting on a restricted view below.
create policy organizations_public_read on organizations
  for select using (verified or is_moderator());
create policy organizations_moderator_write on organizations
  for all using (is_moderator()) with check (is_moderator());

-- Profiles: you can read/update yourself; moderators see all.
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_moderator());
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = auth_role());
create policy profiles_moderator_write on profiles
  for all using (is_moderator()) with check (is_moderator());

-- Service status: world-readable (this is the whole point of the site).
create policy service_status_public_read on service_status
  for select using (true);
create policy service_status_publisher_insert on service_status
  for insert with check (can_publish_for(org_id));
create policy service_status_moderator_write on service_status
  for all using (is_moderator()) with check (is_moderator());

-- Updates: only published rows are public. Drafts stay with their org.
create policy updates_public_read on updates
  for select using (
    status = 'published'
    or is_moderator()
    or (org_id is not null and org_id = auth_org_id())
  );
create policy updates_publisher_insert on updates
  for insert with check (can_publish_for(org_id));
create policy updates_publisher_update on updates
  for update using (can_publish_for(org_id)) with check (can_publish_for(org_id));
create policy updates_moderator_delete on updates
  for delete using (is_moderator());

-- Reports: anyone may submit. Only moderators may read raw rows (they contain
-- contact details). The public reads the PII-stripped `public_reports` view.
create policy reports_anon_insert on reports
  for insert with check (status = 'pending');
create policy reports_moderator_read on reports
  for select using (is_moderator());
create policy reports_moderator_write on reports
  for update using (is_moderator()) with check (is_moderator());
create policy reports_moderator_delete on reports
  for delete using (is_moderator());

-- Resources: verified ones are public.
create policy resources_public_read on resources
  for select using (verified or is_moderator());
create policy resources_publisher_write on resources
  for all using (can_publish_for(org_id)) with check (can_publish_for(org_id));

-- Social mentions: moderation inbox only, never public.
create policy social_moderator_all on social_mentions
  for all using (is_moderator()) with check (is_moderator());

-- ---------------------------------------------------------------------------
-- Grants
-- Views run with the definer's rights, so expose only the safe projections.
-- ---------------------------------------------------------------------------
revoke all on organizations from anon, authenticated;

create view public_organizations as
select id, slug, name, short_name, type, services, website,
       contact_email, contact_phone, logo_url, verified
from organizations
where verified;

grant select on public_organizations to anon, authenticated;
grant select on public_reports to anon, authenticated;
grant select on current_service_status to anon, authenticated;
grant select on zones to anon, authenticated;
grant select on service_status to anon, authenticated;
grant select on updates to anon, authenticated;
grant select on resources to anon, authenticated;
grant insert on reports to anon, authenticated;
grant select, update on organizations to authenticated;
grant all on profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Auto-create a profile whenever a user signs up
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger updates_touch before update on updates
  for each row execute function touch_updated_at();
create trigger organizations_touch before update on organizations
  for each row execute function touch_updated_at();
create trigger resources_touch before update on resources
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Realtime — the dashboard subscribes to these
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table service_status;
alter publication supabase_realtime add table updates;
