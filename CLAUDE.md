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

## Gardening

When the maintainer asks for **"gardening"** (or "document gardening"), it means:
go over the documentation in light of what just changed and leave it in a state that
makes the next collaboration cheaper — updating what is now wrong, writing what is
now missing, and **deleting what no longer earns its place**. Deleting is part of the
job; a doc nobody trusts costs more than no doc.

It is a real pass over the tree, not a changelog entry for the work just done. In
practice:

1. **Hunt staleness first, and verify before rewriting.** Claims about state — what
   is provisioned, what is pending, what is not built yet — rot fastest and mislead
   hardest. Check them against reality (`curl` production, read the code, run the
   query) rather than against memory. A stale "not provisioned yet" in a README sent
   the reader straight into the `seed.sql` trap for several commits.
2. **Grep the whole tree for the fact you just changed**, not just the file you
   remember. That same claim was wrong in three files at once.
3. **Put each thing where its reader will look**: invariants and traps in this file,
   reasoning in [DECISIONS.md](./docs/DECISIONS.md), operator steps in
   [RUNBOOK.md](./docs/RUNBOOK.md), publishing rules in
   [EDITORIAL.md](./docs/EDITORIAL.md). Duplicating prose across them guarantees
   they drift apart; link instead.
4. **Record the measurement, not just the conclusion.** "Three pins cost ~540px and
   pushed the board off a phone screen" survives a rewrite; "keep pins short" does
   not, because the next person cannot tell whether it still applies.
5. **Write down what was deliberately *not* done**, and why. Half of
   [DECISIONS.md](./docs/DECISIONS.md) is that, and it is the half that stops work
   being redone.

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

### Household service reports (`/luz` → `/panel`)

A separate collection instrument from everything above, added for the electricity
utility after it lost access to its own telemetry. Residents report whether they have
power; the operating utility reads the precise rows.

**It is not the status board and must never feed it.** `service_status` is what an
operator told us; `service_reports` is what residents told us. Twenty thousand reports
do not flip a card on `/servicios` — see [EDITORIAL Rule 3](./docs/EDITORIAL.md).

Three things about it are load-bearing:

- **A phone number is required, and it goes to the utility.** That is a deliberate
  departure from how `/reportar` treats contact details, taken as an accepted risk —
  [why](./docs/DECISIONS.md#collecting-and-handing-over-contact-details). Individual
  rows still never reach a public page.
- **The public reads `service_report_density` only**, which counts *households*, not
  submissions: `distinct on (phone) … order by created_at desc`, over a rolling 12-hour
  window. Counting rows instead would publish a number inflated by every
  re-submission. Never expose the base table to `anon`.
- **Access is RLS, not roles.** `can_see_service_reports(service)` admits moderators
  plus any profile attached to a *verified* org whose `services` cover that service.
  A silently empty `/panel` is almost always a missing `org_id`, `verified = false`, or
  a `services` array without the service — RLS filters rather than refuses.

`/panel` reads through `src/lib/panel-data.ts`, **not** `query()` in `data.ts`. That
helper degrades to seed content on failure, which is right for a public page and wrong
for a control room: a dispatcher shown fallback data would send crews against fiction.

### Giving is one page (`/donar`)

**`/donar` asks one question — "¿cómo quieres ayudar?" — and answers it with two
doors: dinero and cosas.** Money and drop-off points are the same intent, and
splitting them across two routes models the schema rather than the reader. There is
no `/acopio`; `#dinero` and `#acopio` are sections of `/donar`.

Its fold order is load-bearing: heading → two choice plates → nothing else. What
sits below is money (CTA, declaration of interest, collapsed trust panel), then
goods, then the alternatives pointer.

- **The declaration of interest stays in the body, at full size, and outside the
  expander.** Rule 10 requires it not be a footnote, and a disclosure hidden behind
  a disclosure is a footnote with extra steps. It renders between the donate plate
  and the trust panel, so a reader who never expands anything has still read it.
  It is written **about the site, not about a person** — the conflict is a property
  of the recommendation, and naming an individual spends the reader's attention on
  working out who that is. Grammar only: do not let "depersonalise" become "shorten".
- **A verified / not-verified pair sits above the dossier**, one solid card and one
  dashed, and the dashed one is the same weight as the solid one. Setting the gap in
  fine print would be the merged-confident-block failure done with typography.
- **Section `03` is the Buenaventura fundraiser** (`#buenaventura`), below both
  doors. It is the weakest destination on the site — a personal GoFundMe reached
  through a personal connection — so it carries the *most* apparatus: not-official
  badge, named organizer, sourced reason, verified/not-verified, and how the link
  reached us. Publish the canonical `gofundme.com` URL, never a `gofund.me`
  shortener: Rule 9 prints the bare domain precisely so it can be compared with the
  address bar.
- **The trust dossier is collapsed, not softened.** Findings, campaign claims, and
  gaps stay three visibly different containers *inside* `<details>` — bordered
  cards with a source line, quoted blocks, dashed boxes. Collapsing them into one
  confident block is the Rule 3 failure; collapsing them behind one summary is not.
- **Both expanders are native `<details>`, not the Base UI accordion.** They must
  open with no JavaScript: someone reads this on a degraded connection during an
  aftershock, and `accordion.tsx` is unused for this reason.
- **The choice plates carry live readouts**, same rule as the home page's route
  tiles. The goods door prints the number of *verified* points on the other side,
  including "Aún sin puntos confirmados" when that is the honest answer.

Drop-off sites are `resources` rows with `kind = 'donation_point'` — not a separate
table, because a drop-off point is a place with an address, hours and a `verified`
gate, which is what that table already models.

`getResources()` **excludes** `donation_point` and `getCollectionPoints()` returns
only it, so a point has exactly one home. Adding it back to the `/recursos` grid
gives the same row two renderings that will drift.

- **The needs list is the point, not the address.** `resources.needs` is a `text[]`
  rendered in array order. A collection point published as a name and an opening
  time is the standard logistics failure — it produces a car park of donated
  clothing nobody asked for while the gauze runs out. An empty `needs` renders
  "ask before bringing anything", never an implication that anything is welcome.
- **`resources` now carries `source`, `source_name` and `source_url`** so a place
  states who told us, the same as a status card (Rule 3). A non-`official` source
  renders the same "No es un canal oficial" badge `/enlaces` uses.
- **Rule 2 is the whole gate.** Collection-point announcements are the most
  forwarded and least verifiable objects in circulation after a quake, and a fake
  one is a working method for stealing donated goods. Rows arrive `verified =
  false` and are invisible until an official channel confirms them. Unconfirmed
  submissions wait in `supabase/pending/`, which nothing runs automatically.

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

`location_source` and `outage_since` follow the same rule, plus their `*_OPTIONS`
arrays in `i18n.ts` (declaration order is display order) and the `LOCATION_SOURCES` /
`OUTAGE_SINCE` const arrays in `src/lib/actions.ts`. `ReportedStatus` is deliberately
an `Extract<>` of `StatusLevel` rather than its own enum — the database enforces the
same narrowing with a check constraint, because `restoring` is an operator's word and
a resident is never offered it.

## UI conventions

- shadcn/ui on **Base UI** (`@base-ui/react`), not Radix. Composition uses
  `render={<Link … />}`, **not** `asChild` — most shadcn examples online show `asChild`
  and will not work here. Tailwind v4, CSS-first config in `src/app/globals.css`; there
  is no `tailwind.config`.
- **Chroma is signal.** The chrome is deliberately achromatic — warm bone "paper" by
  day, cold instrument "ink" by night — so the only saturated colour anywhere is a
  service status. Do not add a saturated brand colour: it would compete with the four
  status hues for the same attention. Two exceptions, both deliberate: the small
  square epicentre mark in the masthead, footer and site icon (a shape, not a state),
  and `--donate`.
- **`--donate` is the one hue that is not a status, and it is bounded.** Every donate
  surface used to be inverted near-black, which on a bone page read as a funeral
  notice — the wrong invitation for the only thing here that asks a stranger for
  money. The mulberry is legitimate *because of its bounds*, so preserve them if you
  touch it: **hue 318** is the furthest point from all four status hues (27 / 70 /
  149 / 250 — widest gap is 250→27, midpoint ~318), and **chroma stays near half a
  status** (0.098 light, 0.105 dark vs 0.145–0.215). Warming it toward clay or
  terracotta walks it into `warn`/`down` territory and it starts reading as a muted
  alert. Note it does **not** invert at night like a status does: a status chip lifts
  to L 0.62–0.8, and a full-width slab at that lightness was the brightest thing on
  the screen during a blackout, so `--donate` goes *darker* (L 0.44) and keeps light
  text ([why](./docs/DECISIONS.md#giving-gets-the-one-hue-that-is-not-a-status)).
  Donate CTAs use `bg-donate-contrast`, never `bg-background` — the latter is
  near-black under the dark theme.
- **The site icon is that same mark, and it is generated.** `src/app/icon.svg` is the
  source of truth; `pnpm icons` redraws `favicon.ico` (16/32/48) and `apple-icon.png`
  from geometry duplicated in `scripts/render-icons.mjs` — change the SVG and you must
  change the script, the way `seed.sql` and `fallback-data.ts` are paired. Two things
  are deliberate. The plate is **ink in both themes** (a bone plate vanishes against a
  light browser tab strip; only *which* ink follows the theme), and the **16px entry is
  a separate, simpler cut** — the outer ring's 12 ticks get ~1.3px of ink each at that
  size and turn to grey noise, so the small variant drops them. Judge any change with
  `pnpm icons src/app <preview-dir>`, which writes nearest-neighbour blow-ups; a
  favicon inspected at 256px is not inspected.
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
  `/reportar`, `/luz`, `/organizaciones`, `/donar`,
  `/actualizaciones/[slug]`); code identifiers are English. `/admin` and `/panel` are internal and **Spanish-only** —
  the bilingual machinery is for the public bulletin, not for a control room in
  Pereira.
- The inline header nav starts at `lg`, not `md` — six items plus the 123 button and
  the language/theme controls do not fit at 768. Adding a seventh means reworking the
  bar, not tightening the gap.
- **The home page is an action hub, and its fold order is load-bearing.** `/` runs
  masthead → `EmergencyPlates` → `PinnedAlerts` → the `/luz` drive → `ActionRoutes` →
  status board → donate → update feed. The two plates lead because they are standing
  instructions
  rendered from hardcoded constants (they survive a degraded read); pinned notices
  are compressed to a strap line rather than cards because three `UpdateCard`s cost
  ~540px and pushed everything actionable off a phone screen. Don't reorder these
  without re-measuring on a 390px viewport — the previous hero passed every check
  and still left nothing actionable above the fold.
  ([why](./docs/DECISIONS.md#the-home-page-is-a-hub-not-a-bulletin))
- **A route tile must carry a live readout**, and must be named for what the reader
  does ("Busca a una persona"), not for a part of the site ("Enlaces"). A tile with
  no readout is a nav link wearing a card. Any count shown must be the number the
  reader actually finds on the far side — the reports tile reads with the same limit
  `/reportes` renders, deliberately.
- **The route board is full at six.** Two rows of `lg:grid-cols-3`. A seventh means
  removing one, same as the masthead. The plates are the only chroma the board adds;
  the six tiles stay achromatic so they don't compete with the four status hues.
  The `/luz` drive sits *above* the board as its own plate for this reason — it is a
  time-boxed campaign asking for a contribution, not a standing route, and as tile
  seven it would both break the grid and read as a peer of `/organizaciones`.
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
- **Four anchors are load-bearing and nothing type-checks them.** The home page's
  route tiles link to `/recursos#centros-medicos` (the `MedicalClosures` block) and
  `/enlaces#personas-desaparecidas` (the `missing_persons` category section);
  `/donar` carries `#dinero` and `#acopio`, which its own two choice plates target
  and which `/recursos` links into as `/donar#acopio`. All four ids carry
  `scroll-mt-20` to clear the sticky masthead. Rename or drop one and the link
  silently degrades to "top of page" — a build passes, a browser says nothing, and
  someone looking for a missing person lands on the wrong block. The `/donar` pair
  fails more softly (you land on the right page, wrong section) but it is the same
  bug.
- **`supabase-js` infers row types from the `select()` string literal.** Splitting one
  across lines with `+` widens it to `string` and breaks inference. Keep select strings
  on one line.
- **A new table in `public` is granted to `anon` and `authenticated` before you say
  anything.** Supabase ships default privileges that grant ALL on every new table in
  that schema, so a narrow `grant insert (col, col)` restricts *nothing* — the blanket
  grant already covers every column. Any migration creating a table must
  `revoke all on <table> from anon, authenticated` first and then grant back, the way
  the initial schema does for `organizations`. `service_reports` shipped without the
  revoke and it took a `20260811120000` follow-up to fix
  ([what it cost](./supabase/migrations/20260811120000_service_reports_grants.sql)).
  **This cannot be caught locally against a plain Postgres**, which has no such
  defaults — the local check passes for the wrong reason. Verify grants with
  `has_column_privilege(...)` against the actual project. RLS is unaffected by any of
  this and kept the PII closed throughout, which is the argument for having both.
- **A new internal route is invisible to analytics only if you say so.**
  `PRIVATE_PREFIXES` in `src/lib/analytics.ts` lists `/panel` and `/admin`, and
  PostHog's `before_send` drops everything from them. Autocapture records the `href`
  of every anchor it sees, and those pages render reporter phone numbers as `tel:`
  links — so any new route that displays resident data has to be added to that array
  or it starts shipping phone numbers to an analytics server. Nothing type-checks
  this. (Typed input values are never autocaptured, so the public forms are fine;
  it is rendered `href`s and link text that leak.)
- **`supabase db push` against production will currently break `/enlaces`.**
  `20260810230000_links.sql` is not applied in production — the `links` table does
  not exist there — so the page degrades to `FALLBACK_LINKS`, which is why Cruz Roja
  and the citizen registry still render. That migration **creates the table and
  inserts nothing.** Applying it therefore makes the query *succeed with zero rows*,
  which stops it degrading, which swaps the fallback list for "Todavía no hay
  enlaces publicados" — silently deleting the missing-persons links from the live
  site. A build passes and nothing errors. Before pushing, run
  `supabase migration list --linked`; if `20260810230000` shows a blank `remote`,
  either hold the file back (move it out of `supabase/migrations/`, push, move it
  back — this is how `20260811150000` was applied on 2026-08-12) or seed the table
  in the same transaction.
- **Exported `SUPABASE_*` variables silently override the CLI's keychain login.**
  A shell with `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` or
  `SUPABASE_PROJECT_ID` set will authenticate as whatever account that token belongs
  to. The symptom is not an error: `supabase projects list` simply returns *a
  different account's projects*, and `sismo-pereira` is absent, which reads as "no
  access to production" rather than "wrong identity". `unset` all three before any
  `supabase` command that touches production.
- **Seed content exists twice** — `supabase/seed.sql` and `src/lib/fallback-data.ts` —
  and they are kept in sync by hand. Change one, change the other.
- **React Compiler lint rules are enforced.** Mutating anything outside a component
  (e.g. assigning `document.cookie`) fails `pnpm lint` even though it builds. Use a
  server action.
- **`AGENTS.md` is rewritten by `next dev`.** Commit it with your work rather than
  trying to revert it.
