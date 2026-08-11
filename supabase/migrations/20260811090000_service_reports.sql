-- =============================================================================
-- Service reports — first-person, household-level reports of whether a utility
-- is actually working, collected so an operator that has lost access to its own
-- telemetry can see where its network is down.
--
-- Built for the Empresa de Energía de Pereira after the 2026-08-10 quake: they
-- are locked out of their systems and their building, and a saturated call
-- centre is the only channel they have left.
--
-- Trust model — this table is NOT the status board:
--
--   * `service_status` is what an OPERATOR told us. `service_reports` is what
--     residents told us. Neither feeds the other, and density here must never
--     flip a card on /servicios — see docs/EDITORIAL.md Rule 3. Twenty people
--     reporting no power is a signal worth showing an operator; it is not the
--     operator's statement, and the site must not launder it into one.
--
--   * Individual rows are NEVER public. A row carries a phone number and a GPS
--     fix accurate to a house, which together identify a household. The public
--     reads `service_report_density`, which aggregates to the zone and drops
--     every identifying column at the database level, not in a component.
--
--   * The operator whose service is reported reads the precise rows, scoped by
--     `organizations.services` — the same scope that already governs what they
--     may publish through the partner API. An electricity utility cannot read
--     water reports.
--
--   * Sharing a reporter's phone and location with that operator is a purpose
--     this site did not previously serve, so it is consented to explicitly at
--     submission (`consent_share`) rather than assumed. See docs/EDITORIAL.md
--     Rule 4 and the retention procedure in docs/RUNBOOK.md.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- How the coordinates on a report were obtained. This is a data-quality signal
-- the operator needs before dispatching a crew: a device GPS fix and a pin the
-- reporter dragged across town on behalf of a relative are not the same claim.
create type location_source as enum ('gps', 'map', 'zone');

-- Roughly when the service went out. Free-text dates from a phone keyboard in
-- an emergency are unusable; these four buckets are what people actually know.
-- The operationally important distinction is `since_quake` (original fault)
-- versus `today` / `last_hour` (came back and failed again).
create type outage_since as enum ('since_quake', 'today', 'last_hour', 'unknown');

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create table service_reports (
  id           uuid primary key default gen_random_uuid(),

  -- Keyed on service from the start so water and gas inherit this rig without
  -- a second table. The /luz route only ever writes 'electricity'.
  service      service_type not null default 'electricity',

  -- Reuses `status_level` so the console speaks the same vocabulary as the
  -- status board. `restoring` is an operator's word, not a resident's, and the
  -- form never offers it.
  status       status_level not null
               check (status in ('outage', 'degraded', 'operational', 'unknown')),

  zone_slug    text references zones (slug) on delete set null,

  lat                 double precision check (lat between -90 and 90),
  lng                 double precision check (lng between -180 and 180),
  location_accuracy_m double precision check (location_accuracy_m >= 0),
  location_source     location_source,

  address_hint text check (char_length(address_hint) <= 200),

  -- Utility account number from the bill. Optional, never public: it resolves a
  -- report to an exact meter, which is the difference between "somewhere in
  -- Cuba" and a work order.
  matricula    text check (char_length(matricula) <= 40),

  -- Optional and never public. The only thing that upgrades a report into a
  -- callback the operator can act on.
  contact_phone text check (char_length(contact_phone) <= 40),

  -- Someone reporting for a relative who cannot report themselves. Tells the
  -- operator not to expect the phone to answer at the pin.
  on_behalf    boolean not null default false,

  -- A downed line, a leaning pole, arcing. Life-safety, routed loudly in the
  -- console rather than sitting in a queue. The form tells these reporters to
  -- call 123 first and does not pretend to be a dispatch channel.
  hazard       boolean not null default false,

  since        outage_since not null default 'unknown',

  note         text check (char_length(note) <= 600),

  -- Explicit authorization to share phone and location with the operator of
  -- this service. Not defaulted true: the consent is the point.
  consent_share boolean not null default false,

  -- Operator triage. Column-level grants below are what keep an org from
  -- editing anything else on the row.
  acknowledged_at timestamptz,
  acknowledged_by uuid references profiles (id) on delete set null,

  -- Abuse marker. Flagged rows drop out of the public aggregate.
  flagged      boolean not null default false,

  -- Coarse, non-reversible submitter fingerprint for abuse triage only; the
  -- raw IP is never stored. Same treatment as `reports.submitter_hash`.
  submitter_hash text,

  created_at   timestamptz not null default now()
);

-- The console's primary read: newest first, one service at a time.
create index service_reports_console_idx
  on service_reports (service, created_at desc) where not flagged;

-- Zone rollups for the public aggregate.
create index service_reports_zone_idx
  on service_reports (service, zone_slug, created_at desc) where not flagged;

-- Hazards are pulled out on their own, ahead of everything else.
create index service_reports_hazard_idx
  on service_reports (created_at desc) where hazard and not flagged;

-- ---------------------------------------------------------------------------
-- Public aggregate
--
-- The only projection of this table the public may read. It counts; it does not
-- locate. No coordinates, no phone, no matrícula, no free text, no timestamps
-- finer than the newest report in the zone.
--
-- It counts HOUSEHOLDS, not submissions. One reporter refreshing the form ten
-- times is one household, and their newest report is the one that counts —
-- `distinct on … order by created_at desc`, the same idiom as
-- `current_service_status`. Counting rows instead would mean "312 reportes",
-- a number inflated by every re-submission and by anyone spamming it. "312
-- hogares" is a number an operator can plan around.
--
-- The identity key is the phone number, which /luz requires. It falls back to
-- the submitter hash and finally to the row id so a service that does not
-- require a phone still aggregates sanely rather than collapsing to one row.
--
-- Rolling 12-hour window on purpose. Restoration after a quake is patchy and
-- fast, so a day-old "sin luz" is not evidence that a zone is dark now — it is
-- exactly the stale-red failure Rule 1 exists to prevent. The UI says the
-- window out loud.
-- ---------------------------------------------------------------------------
create view service_report_density as
with recent as (
  select distinct on (
    r.service,
    coalesce(r.contact_phone, r.submitter_hash, r.id::text)
  )
    r.service,
    r.zone_slug,
    r.status,
    r.created_at
  from service_reports r
  where not r.flagged
    and r.created_at > now() - interval '12 hours'
  order by
    r.service,
    coalesce(r.contact_phone, r.submitter_hash, r.id::text),
    r.created_at desc
),
-- Hazards are counted over the whole window rather than only the newest report
-- per household: a downed cable does not stop being a downed cable because the
-- same person later reported their power came back.
hazards as (
  select
    r.service,
    r.zone_slug,
    count(distinct coalesce(r.contact_phone, r.submitter_hash, r.id::text))
      as hazard_count
  from service_reports r
  where not r.flagged
    and r.hazard
    and r.created_at > now() - interval '12 hours'
  group by r.service, r.zone_slug
)
select
  recent.service,
  recent.zone_slug,
  z.name as zone_name,
  z.kind as zone_kind,
  count(*) filter (where recent.status = 'outage')      as outage_count,
  count(*) filter (where recent.status = 'degraded')    as degraded_count,
  count(*) filter (where recent.status = 'operational') as operational_count,
  coalesce(max(h.hazard_count), 0)::bigint              as hazard_count,
  count(*)                                              as total_count,
  max(recent.created_at)                                as last_reported_at
from recent
left join zones z on z.slug = recent.zone_slug
left join hazards h
  on h.service = recent.service
 and h.zone_slug is not distinct from recent.zone_slug
group by recent.service, recent.zone_slug, z.name, z.kind;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table service_reports enable row level security;

/*
 * Who may read the precise, PII-bearing rows for a given service.
 *
 * Moderators and admins, plus any profile attached to a VERIFIED organization
 * whose `services` array lists that service. Membership of a verified org is
 * the gate, not role: a utility needs read-only staff in its control room as
 * well as publishers, and role governs writing, not seeing.
 *
 * SECURITY DEFINER so the policy can read `profiles` without recursing into
 * the policies on `profiles` itself — same reason as the helpers in the
 * initial schema.
 */
create or replace function can_see_service_reports(target service_type)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select p.role in ('admin', 'moderator')
             or (o.id is not null and o.verified and target = any(o.services))
      from profiles p
      left join organizations o on o.id = p.org_id
      where p.id = auth.uid()
    ),
    false
  );
$$;

-- Anyone may file a report. Nothing they file is publicly readable as a row.
create policy service_reports_anon_insert on service_reports
  for insert with check (not flagged and acknowledged_at is null);

-- Precise rows: moderators, and the operator of that service.
create policy service_reports_org_read on service_reports
  for select using (can_see_service_reports(service));

-- Triage. The column grants below are what restrict this to the triage fields:
-- RLS decides which rows, grants decide which columns.
create policy service_reports_org_update on service_reports
  for update using (can_see_service_reports(service))
  with check (can_see_service_reports(service));

create policy service_reports_moderator_delete on service_reports
  for delete using (is_moderator());

-- ---------------------------------------------------------------------------
-- Grants
--
-- Insert is granted per column so an anonymous submitter cannot write triage
-- state, and update is granted per column so an operator can acknowledge a
-- report but never rewrite what the resident said.
-- ---------------------------------------------------------------------------
grant insert (
  service, status, zone_slug, lat, lng, location_accuracy_m, location_source,
  address_hint, matricula, contact_phone, on_behalf, hazard, since, note,
  consent_share, submitter_hash
) on service_reports to anon, authenticated;

grant select on service_reports to authenticated;
grant update (acknowledged_at, acknowledged_by, flagged)
  on service_reports to authenticated;

grant select on service_report_density to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime — the operator console subscribes to this.
-- Realtime applies RLS to authenticated subscribers, so an anonymous browser
-- session receives nothing.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table service_reports;
