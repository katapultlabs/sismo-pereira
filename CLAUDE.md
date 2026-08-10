# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A crisis information site for Pereira, Risaralda, built after the M7.4 earthquake of
2026-08-10. Live at https://sismopereira.org.

**Read [`docs/EDITORIAL.md`](./docs/EDITORIAL.md) before changing anything the site
displays.** Its rules — unknown is a first-class status, no unverified addresses,
every claim carries its source, contact details are never published, the site survives
its own infrastructure — are enforced in code and schema. Treat them as invariants,
not preferences. The most common way to damage this project is to make it look more
complete by inventing data.

| Doc | For |
|---|---|
| [docs/EDITORIAL.md](./docs/EDITORIAL.md) | What we publish and refuse to publish |
| [docs/RUNBOOK.md](./docs/RUNBOOK.md) | Operating it: moderation, publishing, partners |
| [docs/SUPABASE.md](./docs/SUPABASE.md) | Schema, RLS trust model, provisioning |
| [docs/PARTNER-API.md](./docs/PARTNER-API.md) | The external API contract |
| [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) | Vercel, DNS, deploy gotchas |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Why things are this way, and what we chose not to build |

## Commands

```bash
pnpm dev                      # next dev (Turbopack)
pnpm build                    # always run this to verify
pnpm lint                     # eslint — React Compiler rules are on, and they bite
pnpm exec tsc --noEmit        # typecheck alone; faster than a build

supabase start                # local Postgres + Auth; needs OrbStack running
supabase db reset             # apply migrations/ then seed.sql

node --env-file=.env.local scripts/issue-api-key.mjs <org-slug>
```

There is no test suite. Verification is `pnpm build` plus exercising the route in a
browser — see the language bugs in [docs/DECISIONS.md](./docs/DECISIONS.md#reversed-or-superseded),
both of which passed types and build and were only visible on click.

`supabase/config.toml` is committed (secrets are `env(...)` references — keep them
that way), so `supabase start` needs no `supabase init`.

**The site runs with no `.env.local` at all** — every read falls back to seed content.
Supabase is currently **not provisioned in production** either; report submission,
moderation, and partner ingestion are inert until it is.

## Architecture

### Reads never fail; writes fail loudly

Every database read goes through `query()` in `src/lib/data.ts`, which returns
`{ data, degraded }` and swaps in a constant from `src/lib/fallback-data.ts` whenever
Supabase is missing, errors, or returns null. Pages render `<DegradedNotice>` when any
query came back degraded.

**Do not add a read that bypasses this helper or that can throw.** A 500 during an
aftershock is the failure mode the whole data layer exists to avoid.

Writes are deliberately the opposite: `submitReport` returns an error rather than
pretending a report was filed.

### Three Supabase clients, three trust levels

All return `null` (never throw) when unconfigured:

- `getServerSupabase()` — request-scoped, cookie-backed, **RLS applies as the
  signed-in user**. Default for reads and for moderation. `moderation.ts` uses this
  deliberately so `reports_moderator_write` is the authority: a non-moderator session
  simply updates zero rows.
- `getServiceSupabase()` — **service role, bypasses RLS**. Only for partner API-key
  ingestion (`src/app/api/v1/*`), where the caller is a machine with no session. Every
  write after `authenticateOrg()` must be scoped explicitly to `auth.org.id`. Never
  import into anything reachable from the browser.
- `getBrowserSupabase()` — anon client, for realtime subscriptions.

Authorization lives in `supabase/migrations/*.sql`, not TypeScript. The public reads
**views** (`public_reports`, `public_organizations`, `current_service_status`), not
base tables — `public_reports` is what drops the PII columns. If you change who may
see what, change the policy; don't filter in a component.

### Partner ingestion

`src/lib/api-auth.ts` authenticates `Authorization: Bearer sp_…` against the SHA-256
digest in `organizations.api_key_hash` (plaintext is never stored). Route handlers then
enforce scope: an org may only publish for services listed in its `services` column, so
an electricity utility cannot post water status. Payloads are Zod schemas accepting a
single entry or `{ entries: [...] }` up to 200. `GET` on the same routes is public,
CORS-open, `s-maxage=30`.

### Language

Bilingual es/en with **no translation library**. `src/lib/i18n.ts` holds a hand-written
`es` dictionary, `type Dictionary = typeof es`, an `en` object typed against it, enum
label maps, and `Intl` formatters. Adding a UI string means adding it to both;
TypeScript catches a missing `en` key.

**There are no `/es` or `/en` URL prefixes.** One URL per page. `src/lib/lang.ts`
exports `getLang()` — the single accessor. No component takes a language from route
params.

Resolution is **`lang` cookie → `Accept-Language` → Spanish**:

- `src/proxy.ts` (Next 16 renamed `middleware` → `proxy`; always Node) parses
  `Accept-Language` honouring q-values and publishes **only that** as `x-lang`.
  Unknown languages and ties fall to Spanish on purpose — crawlers send `en-US` and
  this site must not be indexed in English for a Spanish audience.
- `getLang()` reads the cookie **first**, then `x-lang`. It must: `setLanguage()`
  writes the cookie inside a server action, and `x-lang` was already fixed by the
  proxy before that action ran. Reading the header alone leaves the toggle one click
  behind. **This was a real bug — don't reintroduce it.**

The **root** layout reads `getLang()` to set `<html lang>`; a nested layout cannot
reach the root element, and getting it wrong makes screen readers pronounce Spanish
with an English voice.

`proxy.ts` 308-redirects retired `/es/*` and `/en/*` URLs and sets the cookie to the
language the old link asked for.

### Types

`src/lib/types.ts` mirrors the Postgres enums **by hand**. Adding a service, status
level, or resource kind means touching, at minimum: the migration, the type union, the
label maps in `i18n.ts` for both languages, and the `SERVICES`/`STATUSES` const arrays
duplicated in `src/lib/actions.ts` and the API routes.

## UI conventions

- shadcn/ui on **Base UI** (`@base-ui/react`), not Radix. Composition uses
  `render={<Link … />}`, **not** `asChild` — most shadcn examples online show `asChild`
  and will not work here. Tailwind v4, CSS-first config in `src/app/globals.css`; there
  is no `tailwind.config`.
- Status colours are semantic tokens: `ok` / `warn` / `down` / `fixing`. Each has
  `-muted` (tinted surface), `-foreground` (text **on** that tint), and `-contrast`
  (text **on** the solid fill). Mixing those two roles up is what caused the
  illegible-badge bug in commit `9e9d22c`. Never use `green-500`/`red-500` for status.
- Status is always encoded three ways — colour, icon, and text — so it survives colour
  blindness, greyscale, and a cracked screen. Preserve that when adding indicators.
- Route segments are Spanish (`/servicios`, `/reportes`, `/recursos`, `/reportar`,
  `/organizaciones`, `/actualizaciones/[slug]`); code identifiers are English.

## Things that will bite

- **Never invent data to fill a gap** — no status, address, phone number, timestamp,
  or placeholder email. Render the honest empty state. This has already slipped in
  once as a "sensible default" (commit `eca5dd3`, `NEXT_PUBLIC_CONTACT_EMAIL` on the
  **organizaciones page** — the footer does not use it).
- **`supabase-js` infers row types from the `select()` string literal.** Splitting one
  across lines with `+` widens it to `string` and breaks inference. Keep select strings
  on one line.
- **Seed content exists twice** — `supabase/seed.sql` and `src/lib/fallback-data.ts` —
  and they are kept in sync by hand. Change one, change the other.
- **React Compiler lint rules are enforced.** Mutating anything outside a component
  (e.g. assigning `document.cookie`) fails `pnpm lint` even though it builds. Use a
  server action.
- **`AGENTS.md` is rewritten by `next dev`.** Commit it with your work rather than
  trying to revert it.
