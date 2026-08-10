-- ---------------------------------------------------------------------------
-- The organizations directory lists every registered organization, verified
-- or not.
--
-- `public_organizations` was filtered `where verified`, but no organization
-- starts out verified — verification means a named person at that organization
-- confirmed they represent it (docs/EDITORIAL.md), which happens after the
-- fact. The result was an empty directory under a dangling "Organizaciones
-- registradas" heading.
--
-- The page already renders an explicit "pending verification" badge for
-- unverified orgs, and src/lib/fallback-data.ts already lists all sixteen with
-- `verified: false`. This brings the database surface back in line with the
-- fallback the site serves when Supabase is unreachable — the two are meant to
-- agree.
--
-- Note this publishes *identity*, not *endorsement*: the `verified` column
-- still rides along, and the badge is what tells a reader whether anyone has
-- confirmed the organization.
--
-- `contact_email` and `contact_phone` are dropped from the view at the same
-- time. Nothing reads them — `Organization` in src/lib/types.ts has no such
-- fields and the only consumer (`getOrganizations` in src/lib/data.ts) selects
-- nine columns by name — so they were unused public surface. Exposing contact
-- details for organizations nobody has verified is what EDITORIAL rule 4
-- exists to prevent.
-- ---------------------------------------------------------------------------

drop view if exists public_organizations;

create view public_organizations as
select id, slug, name, short_name, type, services, website, logo_url, verified
from organizations;

-- Recreating the view drops its grants with it; anon still has no grant on the
-- `organizations` base table, so this view remains the only public path to it.
grant select on public_organizations to anon, authenticated;
