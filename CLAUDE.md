# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A crisis information site for Pereira, Risaralda, built after the M7.4 earthquake of
2026-08-10. Read `README.md` first — it documents the partner API contract and the
editorial rules in full. The rules there ("unknown is a first-class status", "no
unverified addresses", "contact details are never published", "the site survives its
own infrastructure") are enforced in code and schema; treat them as invariants, not
preferences.

## Commands

```bash
pnpm dev                      # next dev (Turbopack)
pnpm build                    # always run this to verify — see the global rules
pnpm lint                     # eslint (flat config, eslint-config-next)
npx tsc --noEmit              # typecheck alone; faster than a build

supabase start                # local Postgres + Auth
supabase db reset             # apply migrations/ then seed.sql

node --env-file=.env.local scripts/issue-api-key.mjs <org-slug>
```

There is no test suite. Verification is `pnpm build` plus exercising the route.

The site runs with **no** `.env.local` at all — every read falls back to seed content.
Report submission, moderation, and partner ingestion need Supabase.

## Architecture

### Reads never fail

Every database read goes through the `query()` helper in `src/lib/data.ts`, which
returns `{ data, degraded }` and swaps in a constant from `src/lib/fallback-data.ts`
whenever Supabase is missing, errors, or returns null. Pages render `<DegradedNotice>`
when any of their queries came back degraded. **Do not add a read that bypasses this
helper or that can throw** — a 500 during an aftershock is the failure mode the whole
data layer is built to avoid. Writes are the opposite: `submitReport` fails loudly
rather than pretending a report was filed.

### Three Supabase clients, three trust levels

`src/lib/supabase/server.ts` and `client.ts` export all of them, and each returns
`null` (never throws) when unconfigured:

- `getServerSupabase()` — request-scoped, cookie-backed, **RLS applies as the
  signed-in user**. Default for reads and for moderation. `moderation.ts`
  deliberately uses this so the `reports_moderator_write` policy is the authority:
  a non-moderator session simply updates zero rows.
- `getServiceSupabase()` — **service role, bypasses RLS**. Only for partner API-key
  ingestion (`src/app/api/v1/*`), where the caller is a machine with no RLS session.
  Every write after `authenticateOrg()` must be scoped explicitly to `auth.org.id`.
  Never import into anything reachable from the browser.
- `getBrowserSupabase()` — anon client for realtime subscriptions.

Authorization lives in `supabase/migrations/*.sql`, not in TypeScript. The public
reads views (`public_reports`, `public_organizations`, `current_service_status`), not
base tables — `public_reports` is what drops the PII columns from `reports`. If you
change who may see what, change the policy; don't filter in a component.

### Partner ingestion

`src/lib/api-auth.ts` authenticates `Authorization: Bearer sp_…` against the SHA-256
digest in `organizations.api_key_hash` (plaintext is never stored). Route handlers
then enforce scope: an org may only publish for services listed in its `services`
column, so an electricity utility cannot post water status. Payloads are Zod schemas
accepting a single entry or `{ entries: [...] }` up to 200. `GET` on the same routes
is public, CORS-open, `s-maxage=30`.

### Language

Bilingual es/en with **no translation library**. `src/lib/i18n.ts` holds a hand-written
`es` dictionary, `type Dictionary = typeof es`, an `en` object typed against it, and
enum label maps (`SERVICE_LABELS`, `STATUS_LABELS`, `RESOURCE_LABELS`,
`CATEGORY_LABELS`) plus `Intl`-based formatters. Adding a UI string means adding it to
both dictionaries; TypeScript catches a missing `en` key.

`src/proxy.ts` (Next.js 16 renamed `middleware` → `proxy`; it always runs on Node)
resolves the active language and publishes it as an `x-lang` request header. The
**root** layout reads that header to set `<html lang>` — a nested layout cannot reach
the root element, and getting it wrong makes screen readers pronounce Spanish with an
English voice.

> **In flight as of this writing:** the `/es` and `/en` URL prefixes are being removed
> in favour of one URL per page with the language resolved per-request (cookie →
> `Accept-Language` → Spanish). `src/app/[lang]/` has been flattened into `src/app/`,
> `src/lib/lang.ts` (`getLang()`) is the new accessor, and `localePath()` is gone from
> `i18n.ts`. The tree does **not** typecheck yet: several pages and components still
> import `localePath` and still declare `PageProps<"/[lang]/…">`, `proxy.ts` still
> redirects `/` to `/es`, `revalidatePath` calls still use `/[lang]/…`, and the README
> still documents the prefixed URLs. Run `npx tsc --noEmit` before assuming a failure
> is yours.

### Types

`src/lib/types.ts` mirrors the Postgres enums in the migration by hand. Adding a
service, status level, or resource kind means touching, at minimum: the migration, the
type union, the label maps in `i18n.ts` for both languages, and the `SERVICES`/
`STATUSES` const arrays duplicated in `src/lib/actions.ts` and the API routes.

## UI conventions

- shadcn/ui on **Base UI** (`@base-ui/react`), not Radix. Composition uses a
  `render={<Link … />}` prop, **not** `asChild`. Tailwind v4 (CSS-first config in
  `src/app/globals.css`; there is no `tailwind.config`).
- Status colors are semantic tokens, not palette names: `ok` / `warn` / `down` /
  `fixing`, each with `-muted`, `-foreground`, `-contrast` variants. Use these rather
  than `green-500`/`red-500` — the contrast pairings were fixed deliberately (commit
  `9e9d22c`).
- Status is always encoded three ways — color, icon, and text — so it survives color
  blindness, greyscale, and a cracked screen. Preserve that when adding indicators.
- Route segments are Spanish (`/servicios`, `/reportes`, `/recursos`, `/reportar`,
  `/organizaciones`, `/actualizaciones/[slug]`); code identifiers are English.

## Things that will bite

- Spanish copy is the source of truth and the audience is in Pereira. Never invent a
  status, address, phone number, or timestamp to fill a gap — render "sin confirmar".
- `NEXT_PUBLIC_CONTACT_EMAIL` may be empty; the footer must render nothing rather than
  a placeholder address (commit `eca5dd3`).
- `AGENTS.md` is rewritten by `next dev`. Commit it with your work instead of trying
  to revert it.
