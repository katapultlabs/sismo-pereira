# Supabase: schema, permissions, and provisioning

**Audience:** anyone working on the database, auth, or who-can-see-what.

> **Status: provisioned in production.** `sismopereira.org` reads a live Supabase —
> the "mostrando información de respaldo" banner does not appear there, and the
> organization directory serves rows that exist only in the database.
>
> **Local development is the opposite, and that difference is the trap.** The site
> runs with no `.env.local` at all, so every read falls back to `fallback-data.ts`.
> Editing that file or `seed.sql` changes what *you* see and what a fresh
> `supabase db reset` produces; it publishes nothing. To change the live site, write
> to the database — see [RUNBOOK.md](./RUNBOOK.md#publishing-an-update).

---

## Provisioning

Production has been through these steps. They are kept because they are still what
you follow to stand up a second environment, to rebuild after a loss, or to run a
full local stack. Roughly 30 minutes end to end.

### 1. Create the project

Create a Supabase project in the region closest to Colombia (`us-east-1` is the usual
choice; there is no South America region on all tiers). Note the project ref.

### 2. Apply the schema

```bash
supabase link --project-ref <ref>
supabase db push          # applies supabase/migrations/
```

Then load the seed (zones, organization names, honest `unknown` statuses, the opening
sourced updates):

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

### 3. Set environment variables

In Vercel, for **Production** at minimum:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production   # server-only, bypasses RLS
```

`REPORT_HASH_SALT` is already set in all three environments.

Never prefix the service-role key with `NEXT_PUBLIC_`. It bypasses every policy in
this document.

### 4. Configure auth

Moderator sign-in is magic-link only. In Supabase Auth settings, add the redirect URL:

```
https://sismopereira.org/api/auth/callback
```

### 5. Redeploy and verify

```bash
vercel deploy --prod --yes --scope katapult-8b361435
```

Then confirm the "Mostrando información de respaldo" banner is **gone**, submit a test
report, and check it appears in `/admin` but not on `/reportes`.

### 6. Grant the first moderator

They sign in once, then:

```sql
update profiles set role = 'admin' where id = '<auth-user-id>';
```

---

## Local development

```bash
supabase start      # requires OrbStack/Docker running
supabase db reset   # migrations + seed
```

`supabase/config.toml` is committed, so `supabase start` works without `supabase
init`. Every secret in it is an `env(...)` reference rather than a literal; keep it
that way. The generated `supabase/.gitignore` excludes `.env.keys` and friends —
don't remove it.

If the database container fails to start with *"port is already allocated"*, another
Supabase project is running: `supabase stop --project-id <ref>`, or change
`[db] port` in `config.toml`.

The app runs fine with **no** local Supabase at all; you only need it to work on
writes.

---

## The trust model

Authorization lives in Postgres, not TypeScript. If you want to change who sees what,
change the policy — **do not filter in a component**. A filter in React is a
suggestion; a policy is enforcement.

| Actor | May do |
|---|---|
| **Anonymous** | Read published updates, verified reports, service status, verified resources, and the organization directory (all orgs, each carrying its `verified` flag). **Insert** a report with `status = 'pending'`. |
| **Publisher** (org member) | The above, plus insert/update `service_status` and `updates` **for their own `org_id` only**. |
| **Moderator / Admin** | Everything, including reading raw `reports` rows with contact details, and approving or rejecting them. |

### Views are the public surface

The public never reads base tables directly:

| View | Hides |
|---|---|
| `public_reports` | Every PII column on `reports` — `contact_name`, `contact_phone`, `contact_email`, `submitter_hash`, moderator notes. Only `verified` rows. |
| `public_organizations` | `api_key_hash`, `api_key_last4`, `contact_email`, `contact_phone`. Lists **all** registered orgs, not only `verified` ones — the `verified` column rides along and the page badges it. |
| `current_service_status` | Nothing sensitive — it collapses the status history to the latest row per `(service, zone)`. |

`revoke all on organizations from anon` is explicit in the migration. If you add a
table with sensitive columns, add a view and grant on that instead.

### RLS helper functions

`auth_role()`, `auth_org_id()`, `is_moderator()`, and `can_publish_for(org)` are
`SECURITY DEFINER` with a pinned `search_path`. They must be — a policy on `profiles`
that queries `profiles` would recurse infinitely otherwise.

---

## Schema

### Core tables

| Table | Purpose |
|---|---|
| `zones` | Pereira's 19 comunas, its corregimientos, neighbouring municipalities. Reference data, world-readable. |
| `organizations` | Utilities, telcos, agencies, NGOs, media. Holds `services[]` (publishing scope) and `api_key_hash`. |
| `profiles` | 1:1 with `auth.users`. Carries `role` and `org_id`. Auto-created by the `on_auth_user_created` trigger. |
| `service_status` | Append-only history of `(service, zone)` observations. Never updated in place. |
| `updates` | The newsfeed. `publish_status` is `draft` \| `published` \| `archived`. |
| `reports` | Community submissions plus optional contact details. Moderator-only at the base table. |
| `resources` | Shelters, hospitals, aid and water points, and donation drop-off points. `verified` defaults to `false`. `needs` (`text[]`) is what a drop-off point is asking for; `source` / `source_name` / `source_url` say who told us it exists. |
| `social_mentions` | Aggregation inbox from social platforms. Never public; a moderator promotes an item into `updates`. |

### Enums

Mirrored by hand in `src/lib/types.ts`. Adding a value means touching, at minimum: the
migration, the type union, both language label maps in `src/lib/i18n.ts`, and the
`SERVICES`/`STATUSES` const arrays duplicated in `src/lib/actions.ts` and the API
routes. There is no code generation; the duplication is deliberate but easy to miss.

```
org_type        utility telco government ngo media community health
service_type    electricity water gas internet mobile transport health fuel education banking
status_level    operational degraded outage restoring unknown
severity_level  info warning critical
source_kind     official social private media community
publish_status  draft published archived
report_status   pending verified rejected duplicate
user_role       admin moderator publisher viewer
resource_kind   shelter hospital clinic aid_point water_point food charging fuel
                pet_shelter info_point donation_point
zone_kind       comuna corregimiento municipio
```

### Why `service_status` is append-only

`current_service_status` does a `DISTINCT ON (service, zone_slug) … ORDER BY
reported_at DESC`. Partners post new rows rather than mutating old ones, which gives
a free audit trail: you can always answer "what did the site say at 3pm, and who said
it?" That question matters after an emergency.

### Realtime

`service_status` and `updates` are in the `supabase_realtime` publication, so a
dashboard can subscribe. `getBrowserSupabase()` is the anon client for this.

---

## Things that will bite

- **The service-role client bypasses every policy above.** It exists only for
  partner API-key ingestion, where the caller is a machine with no session. Every
  write after `authenticateOrg()` must be scoped explicitly to `auth.org.id`. Never
  import it into anything reachable from the browser.
- **`supabase-js` infers row types from the `select()` string literal.** Splitting one
  across lines with `+` widens it to `string` and silently breaks inference — keep
  select strings on one line.
- **API keys are unrecoverable by design.** Only the SHA-256 digest is stored. Lost
  key means reissue.
- **Anonymous can `INSERT` on `reports` but never `SELECT`.** If you find yourself
  adding a `SELECT` policy for `anon` there, stop — that is the PII leak this schema
  is shaped to prevent.
- **`20260810230000_links.sql` is not applied in production** (checked 2026-08-11:
  the REST schema exposes no `links` relation). `/enlaces` therefore serves
  `FALLBACK_LINKS` behind a permanent degraded notice, which inverts the usual rule:
  for that one page, editing `src/lib/fallback-data.ts` and deploying **is** how
  content reaches readers, and `supabase/seed.sql` is the copy that does nothing.
  That inversion lasts exactly until the migration lands.
- **Applying the links migration without seeding rows in the same session blanks
  `/enlaces`.** `query()` in `src/lib/data.ts` falls back only when `data === null`;
  an empty table returns `[]`, which is not null, so the page renders zero links and
  *no* degraded notice — silently dropping the Cruz Roja missing-persons channel,
  the highest-stakes link on the site. Run `supabase db push` and the `links` insert
  from `seed.sql` together, then load `/enlaces` before walking away.
