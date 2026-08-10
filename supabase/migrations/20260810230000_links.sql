-- =============================================================================
-- Links — a curated directory of other sites worth sending people to.
--
-- Why this is a table and not a hardcoded list: the highest-value links change
-- during an incident (a registry opens, a donation channel closes), and a
-- moderator must be able to add one without a deploy.
--
-- Editorial note: an outbound link is a CLAIM — "this site exists, it does what
-- we say, and X runs it". So it carries the same apparatus as everything else
-- we publish:
--   * `operator` names who actually runs the destination (required, not null);
--   * `source` distinguishes an official channel from a citizen-run one, which
--     is the single most important thing to get right for missing-persons
--     sites, where a community registry must never be dressed up as official;
--   * `verified` gates publication, same as `resources`.
-- =============================================================================

-- Declaration order is display order — Postgres sorts enums by it, and
-- `missing_persons` leads deliberately: it is the most urgent reason someone
-- lands on this page.
create type link_category as enum (
  'missing_persons',
  'official',
  'seismic',
  'aid',
  'donations',
  'health',
  'transport',
  'media'
);

create table links (
  id          uuid primary key default gen_random_uuid(),
  category    link_category not null,
  title       text not null,
  -- https only. A crisis audience on a hostile network should never be sent
  -- somewhere over plaintext, and it also rules out `javascript:` entirely.
  url         text not null unique check (url ~ '^https://'),
  description text,
  -- Who runs the destination. Not nullable on purpose: if we cannot say who
  -- operates a site, we have not verified it enough to send anyone there.
  operator    text not null,
  source      source_kind not null default 'official',
  org_id      uuid references organizations (id) on delete set null,
  -- Ordering within a category; ties break on title.
  sort_order  integer not null default 100,
  verified    boolean not null default false,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index links_public_idx on links (category, sort_order) where verified;

alter table links enable row level security;

-- Same shape as `resources`: verified rows are public, moderators see and
-- write everything. Unlike resources, there is no per-org publishing path —
-- a partner does not get to add outbound links to its own site.
create policy links_public_read on links
  for select using (verified or is_moderator());
create policy links_moderator_write on links
  for all using (is_moderator()) with check (is_moderator());

grant select on links to anon, authenticated;

create trigger links_touch before update on links
  for each row execute function touch_updated_at();
