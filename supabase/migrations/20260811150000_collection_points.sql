-- ---------------------------------------------------------------------------
-- Collection points: what to bring, and who told us
--
-- `resource_kind` already had `donation_point`, so a drop-off site has always
-- been representable. What was missing is the half of the answer people
-- actually act on: *what to take there*. A collection point that says "Viva
-- Cerritos, 8am–4pm" and nothing else produces a car boot of donated clothing
-- nobody asked for, while the gauze runs out.
--
-- Three additions, all on `resources` rather than a new table — a drop-off
-- point is a place with an address and opening hours, which is exactly what
-- that table already models. A parallel table would duplicate the `verified`
-- gate, the RLS, and the org attribution, and then drift from them.
--
--   needs        the checklist, one item per element, in the order the
--                organization asked for it
--   source_name  who told us — Rule 3 applies to a place exactly as it
--                applies to a status card
--   source_url   the announcement, where one exists
--   source       official / social / media / community, same enum the rest
--                of the site uses
--
-- Grants: no `revoke` dance here. Unlike the `service_reports` case, this is
-- ALTER on a table that already grants table-wide SELECT to anon and
-- authenticated, and whose rows are gated by the `resources_public_read`
-- policy on `verified`. New columns inherit that grant, which is what we
-- want: every column added here is public-by-design, and none of it is PII.
-- ---------------------------------------------------------------------------

alter table resources
  add column needs       text[]      not null default '{}',
  add column source      source_kind not null default 'community',
  add column source_name text,
  add column source_url  text;

comment on column resources.needs is
  'What to bring, one item per element. Display order is array order. Empty '
  'means the operator has not published a list — render nothing, never a guess.';

comment on column resources.source_name is
  'Who told us this place exists. Rule 2: a forwarded screenshot is not a '
  'source, and `verified` stays false until an official channel confirms it.';

-- `/acopio` reads verified donation points in one query; the partial index
-- mirrors `resources_kind_idx` and keeps that path off a sequential scan as
-- the table grows.
create index resources_donation_idx
  on resources (name)
  where verified and kind = 'donation_point';
