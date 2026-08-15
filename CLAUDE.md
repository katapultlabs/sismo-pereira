# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A crisis information site built after the M7.4 earthquake of 2026-08-10 in
Pereira, Risaralda — its only coverage area so far, with more places intended.
Live at https://aquiayuda.co; the launch domain sismopereira.org and
every other hostname 308-redirect there. Rebranded **AquíAyuda** on 2026-08-15
([why the name is inverted from the brief](./docs/DECISIONS.md#rebrand-aquíayuda)).
The brand names no city — the wordmark is `AquíAyuda` alone, and the *content*
(hero title, meta description, zone labels) states the coverage area
([why](./docs/DECISIONS.md#rebrand-aquíayuda)). Don't reattach "Pereira" to the
chrome, and don't generalize Pereira out of the content while it is the only
place the site actually covers.

**Read [`docs/EDITORIAL.md`](./docs/EDITORIAL.md) before changing anything the site
displays.** Its rules — unknown is a first-class status, no unverified addresses,
every claim carries its source, contact details are never published, the site survives
its own infrastructure — are enforced in code and schema. Treat them as invariants,
not preferences. The most common way to damage this project is to make it look more
complete by inventing data.

| Doc | For |
|---|---|
| [PRODUCT.md](./PRODUCT.md) | Register, audience, brand personality, design principles |
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

### Household service reports (`/luz`, `/agua` → `/panel`)

A separate collection instrument from everything above, added for the electricity
utility after it lost access to its own telemetry. Residents report whether they have
a service; the operating utility reads the precise rows. The rig is per-service
(`ServiceReportForm` + the `luz`/`agua` dictionary twins), and `/panel` switches
consoles with `?servicio=agua` — navigation only, RLS decides what each account sees.

**An instrument only collects while someone reads it.** `/agua` is built but gated:
the form renders only when the launch switch in `src/lib/service-instruments.ts` is
on AND a *verified* org covering the service exists in the live database — otherwise
it renders the honest closed state and routes to the community form. The switch is a
code constant on purpose (opening a dead drop should be a reviewed diff), it is
enforced again inside `submitServiceReport`, and it only flips after the operator
confirms a team will read the panel — the Rule 5 obligation. Activation steps are in
[RUNBOOK.md](./docs/RUNBOOK.md#opening-a-new-service-instrument).

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
- **Chroma is signal, amended once by the 2026-08-15 AquíAyuda reskin.** The chrome is
  neutral — white "paper" by day, true black by night — and the only saturated colours
  are the four status hues plus **`--brand`**, the AA pin's volt yellow
  (`oklch(0.94 0.2 106)`, ~`#fef204`). Brand volt is *chrome only*: the pin mark, every
  donate CTA, and the campaign strip. Its rules: never encode a service state with it,
  text on it is always `--brand-contrast` ink (volt text on a pale ground can never
  pass AA), and every volt fill carries `border border-brand-contrast/25` — in dark
  mode the donate slabs are `bg-foreground` (near-white), and a volt fill on a white
  ground has no silhouette without the hairline. It is hue-separated from `--warn`
  (h70, orange) on purpose; keep that separation.
  The **text-weight accent** is `--ember`, retinted by the reskin into the brand's
  yellow family (dark mustard by day, bright signal yellow by night) — it is what
  carries "brand yellow" wherever ink-weight text is needed: section eyebrows, the
  seismic artwork, the clock's carrier light. **Never encode a service state with
  it**, and never add a third accent — both are gated by `pnpm check:contrast` in
  both themes.
- **The site icon is the AA pin, and it is generated.** `src/app/icon.svg` is the
  source of truth; `pnpm icons` redraws `favicon.ico` (16/32/48) and `apple-icon.png`
  from geometry duplicated in `scripts/render-icons.mjs`, and the same 32-unit
  geometry is echoed at component scale in `src/components/brand-mark.tsx` — change
  one and you must change the others, the way `seed.sql` and `fallback-data.ts` are
  paired. Two things are deliberate. The plate is **ink in both themes** (a white
  plate vanishes against a light browser tab strip; only *which* ink follows the
  theme), and the **16px entry is a separate, simpler cut** — the "AA" monogram's
  ~1.8-unit strokes get under a pixel of ink each at that size and turn to noise, so
  the small variant drops the letters and grows the pin. Judge any change with
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
- `--radius` is `0.5rem` and `rounded-sm` takes it directly (it is 70 of the ~110
  `rounded-*` uses, so it sets the tone). This was `0.1875rem` with a note calling the
  tight corner load-bearing; the 2026-08-13 redesign raised it and the note did not
  survive — what keeps this off generic-card-UI is the neutral chrome, hairline
  rules, mono readouts and condensed display face
  ([why](./docs/DECISIONS.md#3px-stamped-radius--8px)).
- **Dark mode is real, mounted (`ThemeProvider`, `defaultTheme="system"`), and every
  page follows it — including `/`.** It is not decorative: people read this at night,
  during a blackout, on battery. Check both themes when adding a surface, and never
  pin a page to one of them. The landing shipped hardcoded to the night palette in
  both themes for one release, which silently disabled the theme switch on the page
  most readers ever see
  ([why](./docs/DECISIONS.md#the-landing-was-locked-to-dark-in-both-themes--it-follows-the-theme)).
  In practice this bites through **artwork**, not tokens: `mix-blend-screen` keeps a
  source's light pixels and vanishes on bone paper, `mix-blend-multiply` does the
  reverse, and a `shadow-black/40` that lifts a card off ink reads as a bruise on
  paper. Prefer art drawn from tokens (`SeismicField`) over an imported asset, which
  can only ever be right in one theme.
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
- **The home page is an editorial landing with two layouts, and its order is
  load-bearing.** From `lg` it is a sticky left rail (wordmark → five numbered routes →
  emergency-line directory → Reportar → Donar) beside a full-bleed wall (pinned ticker
  + clock/theme/language → hero panel → `/luz` drive → `ActionRoutes` → report CTA →
  status board → donate → figures → update feed). Below `lg` the rail becomes a 2-up
  plate grid under the hero, followed by `HeroSafetyMobile`. The horizontal masthead is
  `lg:hidden` on `/` only, because the rail replaces it — which is why the rail has to
  carry the theme and language controls itself.
  Pinned notices are a ticker rather than cards because three `UpdateCard`s cost ~540px
  and pushed everything actionable off a phone screen. Don't reorder without
  re-measuring on a 390px viewport.
  ([why](./docs/DECISIONS.md#the-home-page-is-a-hub-not-a-bulletin))
- **Life safety must outrank the donate CTA at every scroll position, not just at the
  top.** On `lg` that is `HeroSafety`: a fixed bottom-right stack with the alarm-red
  123 plate above the closures card. It is fixed precisely because the hero's donate
  button scrolls away and 123 must not. Below `lg`, `HeroSafetyMobile` carries both in
  the flow. Removing the 123 plate because "the header has one" is the specific
  regression that shipped once — the header is hidden on this route
  ([why](./docs/DECISIONS.md#life-safety-as-a-corner-widget-on-desktop--a-fixed-123-plate)).
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
- **`StatusCarousel` is a carousel below `lg` and a `grid-cols-3` grid at `lg` and
  above** — the route board, the status board and the update feed all run through it.
  Do not make it a carousel at all widths: that hides four of the seven service
  statuses behind a horizontal swipe on a desktop screen, which is the opposite of
  what a status board is for
  ([why](./docs/DECISIONS.md#carousels-on-the-landings-two-boards--carousel-on-mobile-grid-on-desktop)).
  It takes `lang` because the prev/next buttons need real accessible names; they read
  the arrow glyph otherwise.
- **The masthead row is full.** It is capped at `max-w-6xl` (1152px), so its space
  does **not** grow with the viewport — a control that fits at 1600 fits at 1280 and
  no better. The three actions are ranked and appear at different breakpoints: 123
  (always), Donar (`sm`), Reportar (`xl`, outline). The "Boletín de situación"
  tagline was removed from the wordmark to make room; it still runs in the footer.
  Adding anything here means removing something, not finding space.

## Things that will bite

- **`check:contrast` finds the dark token block by string search, and takes the first
  match.** It looks for the dark class selector followed by a space and `{`. Write that
  sequence anywhere earlier in `globals.css` — including inside a comment explaining
  this very rule — and the gate parses a comment body, extracts no tokens, and fails
  all 27 dark pairings at once with a message that looks like a palette regression.
  This has now cost two red builds. Describe the sequence; don't quote it.
- **An unused module is invisible to `pnpm lint`.** ESLint flags unused *variables*,
  not unused *files*, so a component nobody imports ships silently — the 2026-08-13
  branch carried `landing-art.tsx` (269 lines), `local-clock.tsx` and a 131KB SVG that
  nothing referenced, alongside a 1.9MB one that everything did. Before merging a large
  feature branch, grep each new file's exports for a consumer.
- **Check what an "SVG" actually contains before shipping it.** `seismic-dark.svg` was
  a 1024×1536 PNG base64'd inside an SVG wrapper: 1.9MB, and 1.42MB *gzipped*, because
  already-compressed pixels do not compress twice. It passed every gate — build, lint,
  types — and would have put more weight on the landing than the rest of the site
  combined. `ls -lh public/` is the whole check.

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
- **Five anchors are load-bearing and nothing type-checks them.** The home page's
  route tiles link to `/recursos#centros-medicos` (the `MedicalClosures` block) and
  `/enlaces#personas-desaparecidas` (the `missing_persons` category section — the
  `/reportar` triage's missing-person door targets it too); `/donar` carries
  `#dinero` and `#acopio`, which its own two choice plates target and which
  `/recursos` links into as `/donar#acopio`; and `/reportar#formulario` is where
  the triage's "otra cosa" door and `/agua`'s closed state both land. All five ids
  carry `scroll-mt-20` to clear the sticky masthead. Rename or drop one and the
  link silently degrades to "top of page" — a build passes, a browser says
  nothing, and someone looking for a missing person lands on the wrong block. The
  `/donar` pair fails more softly (you land on the right page, wrong section) but
  it is the same bug.
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
