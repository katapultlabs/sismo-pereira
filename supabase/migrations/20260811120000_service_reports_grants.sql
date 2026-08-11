-- =============================================================================
-- Service reports — restore the intended column grants.
--
-- Supabase ships default privileges that grant ALL on new tables in `public`
-- to `anon` and `authenticated`. Those defaults fire on `create table` and sit
-- *alongside* the narrow column grants in
-- `20260811090000_service_reports.sql` — which means those narrow grants
-- restricted nothing, because the blanket grant already covered every column.
--
-- The initial schema knew this. It opens with
-- `revoke all on organizations from anon, authenticated` for exactly this
-- reason. The service_reports migration did not, so on a real Supabase project
-- the model documented there — "RLS decides which rows, grants decide which
-- columns" — was only half true.
--
-- **No PII was ever exposed.** RLS is enabled, and `service_reports_org_read`
-- calls `can_see_service_reports(service)`, which is false for an anonymous
-- session, so an anon SELECT returned zero rows whatever the privilege said.
-- Likewise `service_reports_anon_insert` carries
-- `with check (not flagged and acknowledged_at is null)`, so a blanket INSERT
-- privilege still could not forge triage state.
--
-- **What was actually wrong:** any signed-in member of the operating
-- organization could UPDATE columns beyond the three triage fields — including
-- `status`, `note` and `contact_phone`. That is the difference between
-- acknowledging a report and rewriting what a resident said, and the console
-- is supposed to be structurally incapable of the second.
--
-- Found by checking `has_column_privilege` against production rather than
-- trusting the local result: a plain Postgres container has no Supabase default
-- privileges, so the local check passed for the wrong reason. Grants are one of
-- the few things that genuinely cannot be verified anywhere but on Supabase.
-- =============================================================================

revoke all on public.service_reports from anon, authenticated;

-- Anyone may file a report, and may write only what a reporter supplies.
grant insert (
  service, status, zone_slug, lat, lng, location_accuracy_m, location_source,
  address_hint, matricula, contact_phone, on_behalf, hazard, since, note,
  consent_share, submitter_hash
) on public.service_reports to anon, authenticated;

-- Operators and moderators read whole rows; RLS decides which rows.
grant select on public.service_reports to authenticated;

-- Triage, and only triage. This is the grant the blanket default was defeating.
grant update (acknowledged_at, acknowledged_by, flagged)
  on public.service_reports to authenticated;

-- Without this, `service_reports_moderator_delete` is a policy with no
-- privilege behind it. RLS narrows this to moderators.
grant delete on public.service_reports to authenticated;

-- The public aggregate stays readable by everyone; it carries no PII.
grant select on public.service_report_density to anon, authenticated;
