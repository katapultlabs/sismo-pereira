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
| [docs/WHATSAPP.md](./docs/WHATSAPP.md) | The WhatsApp line: inbound routing, the 24 h window, broadcasts |
| [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) | Vercel, DNS, deploy gotchas |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Why things are this way, and what we chose not to build |

## Commands

```bash
pnpm dev                      # next dev (Turbopack)
pnpm build                    # always run this to verify
pnpm lint                     # eslint — React Compiler rules are on, and they bite
pnpm exec tsc --noEmit        # typecheck alone; faster than a build
pnpm check:contrast           # WCAG AA gate on every colour pairing in globals.css

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
That is a property of local development. **Production is provisioned**: it has a live
Supabase, and the site reads the database there, not `fallback-data.ts`.

That distinction is the trap. Editing `src/lib/fallback-data.ts` and `supabase/seed.sql`
changes what a *developer* sees and what a fresh `supabase db reset` produces — it does
**not** change production, where those constants are never reached. `seed.sql` never
runs against production. Shipping content by editing the seed looks completely correct
locally, passes `pnpm build`, deploys green, and changes nothing on the live site.

To actually publish content, write to the live database — see
[docs/RUNBOOK.md](./docs/RUNBOOK.md#publishing-an-update). Only hardcoded components
(the emergency lines, `MedicalClosures`) reach production through a deploy.

## Shipping

`main` is production; pushing it deploys. **Do not open pull requests** — this project
has no PR flow, no CI, and no review gate
([why](./docs/DECISIONS.md#no-prs-no-ci-gate-main-deploys)). Work on a branch, get
`pnpm build` passing, merge to `main`, push. Use a git worktree when working alongside
someone else's change; `.claude/worktrees/` is gitignored.

Because nothing reviews a change before it is live, `pnpm build` and
[docs/EDITORIAL.md](./docs/EDITORIAL.md) carry the weight a reviewer otherwise would.
Never force-push `main`. Deploy commands and rollback are in
[docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md#branches-and-deploying).

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

### The WhatsApp line

`src/lib/whatsapp/*` plus `/api/webhooks/whatsapp` and `/admin/whatsapp`. Full
detail in [docs/WHATSAPP.md](./docs/WHATSAPP.md); the load-bearing parts:

- **Inbound free text becomes a `reports` row with `status = 'pending'`.**
  WhatsApp is a second front door onto the moderation queue, never a bypass
  around it. `category` is always `other` — a moderator categorises it.
- **The keyword router matches the whole message, exactly.** `agua` gets the
  water bulletin; `no hay agua en la 30` gets filed for a human. Never make
  that matching fuzzy or substring-based, and never put a model on the reply
  path — the reasoning is in
  [docs/WHATSAPP.md](./docs/WHATSAPP.md#why-there-is-no-chatbot).
- **Replies are rendered from `src/lib/data.ts`**, the same helpers the pages
  use, so a WhatsApp answer and the site cannot disagree.
- The webhook uses `getServiceSupabase()` for the same reason `api/v1/*` does:
  the caller is Meta, with no session. `src/lib/whatsapp/store.ts` must never
  be reachable from the browser.
- `whatsapp_threads` is declared `security_invoker` **on purpose** — it carries
  phone numbers and must inherit RLS instead of bypassing it the way
  `public_reports` deliberately does.

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

A `link_category` is the same drill plus `LINK_CATEGORIES` in `i18n.ts`, which the
links page iterates so a live query and the offline fallback order identically —
adding one to the enum without adding it there silently hides that category.

## UI conventions

- shadcn/ui on **Base UI** (`@base-ui/react`), not Radix. Composition uses
  `render={<Link … />}`, **not** `asChild` — most shadcn examples online show `asChild`
  and will not work here. Tailwind v4, CSS-first config in `src/app/globals.css`; there
  is no `tailwind.config`.
- **Chroma is signal.** The chrome is deliberately achromatic — warm bone "paper" by
  day, cold instrument "ink" by night — so the only saturated colour anywhere is a
  service status. Do not add a saturated brand colour: it would compete with the four
  status hues for the same attention. The one exception is the small square epicentre
  mark in the masthead and footer, which is a shape rather than a state.
- Status colours are semantic tokens: `ok` / `warn` / `down` / `fixing`. Each has
  `-muted` (tinted surface), `-foreground` (text **on** that tint), and `-contrast`
  (text **on** the solid fill). Mixing those two roles up is what caused the
  illegible-badge bug in commit `9e9d22c`. Never use `green-500`/`red-500` for status.
  Every pairing is now gated at 4.5:1 by `pnpm check:contrast` — **run it after
  touching any token in `globals.css`.** It caught a fresh regression the day it was
  written, so it is a script rather than an eye.
- Type carries the expression, so there are three faces with distinct jobs:
  `font-heading` (Archivo, condensed via the `wdth` axis — use the `display-condensed`
  utility), `font-sans` (Source Sans 3, all body copy), and `font-mono` (IBM Plex Mono
  — timestamps, magnitudes, phone numbers, anything read as an instrument value).
  `label-signage` is the uppercase mono micro-label used for every section eyebrow and
  form label. Prefer these utilities over ad-hoc type stacks.
- `SectionHeading` is the bulletin's section rule. Reuse it rather than hand-rolling a
  heading — repeating it is what makes the pages read as one document.
- `--radius` is `0.1875rem`, and the tight radius is load-bearing: rounding it up makes
  the site read as a generic card UI again.
- Dark mode is real and mounted (`ThemeProvider`, `defaultTheme="system"`). It is not
  decorative — people read this at night, during a blackout, on battery. Check both
  themes when adding a surface.
- Status is always encoded three ways — colour, icon, and text — so it survives colour
  blindness, greyscale, and a cracked screen. Preserve that when adding indicators.
- Route segments are Spanish (`/servicios`, `/reportes`, `/recursos`, `/enlaces`,
  `/reportar`, `/organizaciones`, `/donar`, `/actualizaciones/[slug]`); code
  identifiers are English.
- The inline header nav starts at `lg`, not `md` — six items plus the 123 button and
  the language/theme controls do not fit at 768. Adding a seventh means reworking the
  bar, not tightening the gap.
- **The masthead row is full.** It is capped at `max-w-6xl` (1152px), so its space
  does **not** grow with the viewport — a control that fits at 1600 fits at 1280 and
  no better. The three actions are ranked and appear at different breakpoints: 123
  (always), Donar (`sm`), Reportar (`xl`, outline). The "Boletín de situación"
  tagline was removed from the wordmark to make room; it still runs in the footer.
  Adding anything here means removing something, not finding space.

## Things that will bite

- **Never invent data to fill a gap** — no status, address, phone number, timestamp,
  or placeholder email. Render the honest empty state. This has already slipped in
  once as a "sensible default" (commit `eca5dd3`, `NEXT_PUBLIC_CONTACT_EMAIL` on the
  **organizaciones page** — the footer does not use it).
- **A seeded `unknown` can outrank a real report.** `current_service_status` is
  `distinct on (service, zone_slug) order by reported_at desc` — newest
  `reported_at` wins, and the seed stamps all seven baseline rows with the moment
  the database was seeded. Publishing a report whose true `reported_at` is *older*
  than that bulk insert therefore inserts fine, returns `201`, and changes nothing
  on the board. This bit the PMU hospital status: the mayor spoke at 16:47Z, the
  database was seeded at 20:29Z, and the placeholder won.
  **Do not "fix" it by stamping the report with `now()`** — the card renders
  `reported_at` as «Actualizado», so that publishes a four-hour-old hospital status
  as fresh, which is the stale-green failure [EDITORIAL](./docs/EDITORIAL.md#rule-1--unknown-is-a-first-class-status)
  exists to prevent. Correct the placeholder's artifact timestamp instead, and check
  `current_service_status` — not the `insert` status code — to confirm a publish.
- **The WhatsApp number is ProCarmelita's, and a Meta app has exactly one
  webhook URL.** Repointing it at this project breaks ProCarmelita's login
  OTPs. The webhook already filters on `metadata.phone_number_id`, so a second
  number on the same Business Account is the safe shape — see
  [docs/WHATSAPP.md](./docs/WHATSAPP.md#credentials-this-is-procarmelitas-phone-number).
  Message limits and sender reputation are shared either way, which is why
  broadcasting is opt-in, template-only, and rate-limited.
- **A new table is invisible to `service_role` until you `GRANT` it.**
  `supabase/config.toml` leaves `auto_expose_new_tables` unset — the new cloud
  default — so entities created afterwards are not reachable through the Data
  API roles without an explicit grant, `service_role` included. The migration
  still applies cleanly; it fails at *runtime* with `42501` on every
  service-role write. Anything reachable from `/api/webhooks/*` or `/api/v1/*`
  needs `grant ... to service_role` in the same migration.
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
