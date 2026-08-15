# Decisions

Why things are the way they are — including what we deliberately did **not** build.

Entries are append-only. If a decision is reversed, add a new entry rather than
editing the old one; the reasoning that turned out to be wrong is worth keeping.

---

## Editorial

### Unknown is a status, not a gap

**Decision:** service state we have not confirmed renders "Sin confirmación oficial",
never an inference, and seed/demo data uses `unknown` throughout.

**Why:** people make travel and shelter decisions from this page. A plausible-but-wrong
outage is worse than a blank, because a blank sends them looking for a real answer.
Restoration after a quake is patchy and fast, so a stale red misleads as badly as a
stale green.

**Cost:** the dashboard looks empty at launch, which reads as "unfinished" to anyone
who does not know the rule. Accepted — that is why the notice explaining it is
rendered inline.

### No unverified addresses, ever

**Decision:** `resources` rows are invisible until `verified = true`;
`FALLBACK_RESOURCES` is an empty array.

**Why:** the worst failure this site can produce is sending a family across a damaged
city at night to a shelter that does not exist.

### Partners publish live, not into a queue

**Decision:** `POST /api/v1/updates` defaults to `publish: true`.

**Why:** during an incident, a queue a moderator must drain is a queue that goes
unread. Attribution and timestamps are the control instead — it is under the
partner's name, and moderators can archive after the fact.

**Trade-off:** a compromised API key can publish official-looking content immediately.
Mitigated by verifying organizations before issuing a key, and by scope enforcement.

### Community reports are gated; partner content is not

**Decision:** anonymous submissions are invisible until a moderator approves them.

**Why:** open submissions in a disaster attract genuine reports, panic, and a small
number of bad actors, in that order. The gate is the only thing separating the first
from the rest.

**Obligation this creates:** if moderation cannot be staffed, the form should come
down rather than collect unread reports.

### Collecting and handing over contact details

**Decision (2026-08-11):** `/luz` requires a phone number, captures location at
household precision, and exists to hand both to the Empresa de Energía de Pereira. No
consent checkbox, no SMS verification, no data processing agreement, no privacy review
before launch. We collect now and hand over as we go.

**Why:** EEP is locked out of its systems and its building. Its only channel is a call
centre that is saturated, which means it is restoring a grid it cannot see. A crowd
signal is the only instrument available, and it is worth more in the next 48 hours than
it will be in a week. The project has direct access to EEP's CEO and executives, so the
hand-off is a real path rather than a hope.

**Why the phone is required, given it suppresses reports:** it is what upgrades a
report into a callback an operator can dispatch on, and it is the identity key that
lets the public aggregate count *households* instead of submissions. Without it the
number on the page is inflated by every re-submission and by anyone who wants to
inflate it.

**Risk accepted, explicitly:** this is personal data collected under Ley 1581 de 2012
without prior express authorization, shared with a third party without a written
agreement, from unverified phone numbers. The call was made by the project owner, who
chose forgiveness over permission for the duration of the emergency. Recording it here
is the point — a risk that is written down is one that can be revisited on a normal
Tuesday, and this one should be.

**What was NOT given up:** individual rows stay off the public site. The public reads
zone-level household counts. Publishing pins would expose which houses are dark and
empty, which harms the reporters without making the page more useful — that is a
different question from the regulatory risk above, and it was not part of the decision.

**Revisit when:** the emergency phase ends, EEP is back inside its own systems, or
anyone asks for their data back. A deletion procedure is in
[RUNBOOK.md](./RUNBOOK.md#retiring-luz-and-purging-what-it-collected).

---

## Product scope

### No missing-persons registry

**Decision:** the `missing_person` report category exists so people can tell a
moderator, but we do not publish names or run a search registry. Reporters are pointed
at Cruz Roja's official system.

**Why:** real legal and ethical exposure around publishing names of the missing, and
Cruz Roja already operates the authoritative registry. Fragmenting it across a
community site actively harms the people it claims to help.

**Consequence:** pointing outward *is* our answer, so the pointer has to be real.
That is what `/enlaces` is for — see below.

### A links directory, rather than more of our own data

**Decision:** `/enlaces` is a curated directory of other people's sites, backed by a
`links` table with the same `verified` gate as `resources`. Every row names its
`operator` (not nullable) and its `source`, and the page prints each destination's
bare domain.

**Why:** the honest answer to several questions this site refuses to answer itself —
missing persons above all — is somebody else's site. Without a place to put those
pointers, "we don't do that" is where the reader's journey ends. A table rather than a
hardcoded list because the useful links change mid-incident and a moderator must be
able to add one without a deploy.

**Why `operator` is required:** an outbound link asserts who runs the destination. If
we can't name them, we haven't verified it enough to send anyone there. It also lets
the UI mark a citizen-run registry as *not an official channel* instead of letting it
sit unqualified next to a government one.

**Mirrored into `FALLBACK_LINKS`** like the rest of the seed content. A checked URL is
reference data, not operational data, so unlike `FALLBACK_RESOURCES` it is safe to
ship — and if our database is down, the address of someone who can actually help is
the last thing that should vanish with it.

**Consequence:** the inline header nav now starts at `lg` rather than `md`. Six items
plus the right-hand controls need ~980px; at 768 they left the wordmark 9px to
truncate into. Tablets get the existing sheet, which holds all six in a column.

### A donation drive, hardcoded, funnelled through one page

**Decision:** the Vaki emergency fund is featured site-wide — a strip under the
masthead on every route, a plate on `/` and `/recursos`, a row above the footer
columns, and a `Donar` button in the header. All of them link **inward** to
[`/donar`](../src/app/donar/page.tsx), which is the only page that links out to the
campaign.

**Why hardcoded, when `/enlaces` exists:** a `links` row appears on exactly one page,
and it disappears the moment Supabase does. This is the one outbound destination that
has to survive a degraded read — an appeal that vanishes during the aftershock is an
appeal nobody sees. The `links` row exists too (`donations` category), so the campaign
also sits in the directory next to its alternatives, but the site-wide treatment is
components, not data. See the note in CLAUDE.md: editing `seed.sql` publishes nothing.

**Why one exit point rather than direct outbound links:** it costs a click, and it buys
the only place where the verification, the open questions, and the operator's declared
investment stake in Vaki are guaranteed to be on screen *before* anyone leaves. The
alternative — a donation link on every page and a disclosure nowhere — is not a
trade this site can make. See [EDITORIAL.md](./EDITORIAL.md#rule-10--if-we-amplify-it-we-disclose-our-interest-in-it).

**Why no superlatives**, when the operator believes them: "the most trustworthy
option" cannot be sourced, and Rule 3 does not stop applying because the claim is
about a partner. The page makes the strongest *checkable* case instead — an
established platform with a public track record, the campaign on the platform's own
domain rather than a lookalike, a named US entity, Stripe checkout — and lists what is
not public (no EIN, no disbursement report yet, no fee disclosure). A donor who checks
our claims finds them true, which is the only durable version of persuasion this site
can offer.

**Consequence:** the masthead row is now full. It is capped at `max-w-6xl`, so its
space does not grow with the viewport; `Donar` appears from `sm`, `Reportar` moved to
`xl` and became an outline button, and the "Boletín de situación" tagline was dropped
from the wordmark (it survives in the footer). Measured, not guessed: with the tagline
present the wordmark truncated to "SISMO PER…" at every width where it rendered.

### Giving is one page, asking one question

**Decision:** [`/donar`](../src/app/donar/page.tsx) covers money *and* goods. Its
fold is the question "¿cómo quieres ayudar?" and two doors — dinero, cosas — and
nothing else. The verification dossier that used to occupy that space sits behind a
`<details>` labelled "¿Por qué deberías confiar en esto?".

**What we tried first, and why it was wrong.** Drop-off points originally shipped as
their own route, `/acopio`, on the reasoning that a collection point answers the
opposite question from a shelter: not "where do I go for help" but "where do I take
what I have". That distinction is real, and it is the right reason to keep
`donation_point` out of the `/recursos` grid — but it is the wrong reason to build a
second give page. From the reader's side there is one intent, "quiero donar", and
whether they hold cash or a box of gauze is a *detail of that intent*, not a
different journey. Routing by which table column differs is modelling the schema, not
the person. `/acopio` never reached production; it was folded back in one commit
later, so no redirect exists and none is needed.

**Why the dossier collapsed.** `/donar` had grown to ten stacked sections — a
four-card verification block, three campaign claims, three open questions, a
disclosure, and two pointers — roughly 1,400 words of apparatus in front of a button.
Every piece of it was written for a good reason and the sum was still wrong: a reader
who has decided to give was made to read an argument first. Collapsing is not
softening. Inside the expander the findings, the claims, and the gaps remain three
visibly different containers, because merging them into one confident block is the
Rule 3 failure this site exists to avoid.

**What stayed in the open, and is not negotiable.** The declaration of interest —
the site operator's investment stake in Vaki — renders in the body at full size,
between the donate plate and the trust panel. Rule 10 requires it not be a footnote,
and a disclosure behind a disclosure is a footnote with extra steps. It was also
never the thing making the page heavy: it is one short paragraph.

**Native `<details>`, not the Base UI accordion.** The panel has to open with no
JavaScript. Someone reads this on a degraded connection during an aftershock, which
is the same argument as Rule 7, and it is why `src/components/ui/accordion.tsx` is
still unused.

**Why the needs list outranks the address.** This is the part that is easy to get
backwards. Publishing "Viva Cerritos, 8 am–4 pm" and stopping there is the classic
disaster-logistics failure: it produces a car park of donated clothing nobody asked
for while the gauze runs out. Sorting unsolicited goods, not receiving them, is the
bottleneck at a collection point. So `needs` is a `text[]` rendered as a checklist at
body size above the metadata, in the operator's own ordering, and an empty list
renders "pregunta antes de llevar algo" rather than a silence that reads as "anything
welcome".

**What we deliberately did not build.** No structured categories for `needs` — the
two real appeals arrived grouped ("aseo personal", "primeros auxilios", "alimentos"),
and flattening them lost nothing a reader standing in a supermarket needs. A `jsonb`
shape with group labels is more schema to keep in sync with two dictionaries for a
gain nobody could name. No home-page tile either: the route board is full at six and a
seventh breaks the grid, and `Donar` is already in the masthead from `sm`. `/recursos`
links into the goods half as `/donar#acopio`.

**The gate is stricter here than it looks.** Rule 2 already forbids an unverified
address, and collection points are the worst case for it: the announcements are the
most-forwarded objects in circulation after a quake, they arrive stripped of origin,
and a fabricated one is a working method for stealing donated goods. Rows arrive
`verified = false`. Announcements that cannot be checked yet wait in
`supabase/pending/`, which nothing runs automatically — the wording is preserved
without being published.

### The home page is a hub, not a bulletin

**Decision:** `/` opens with actions, in a fixed order — two life-safety plates, then
pinned notices as a compressed strap line, then six route tiles. The full-height hero
it replaced (a `7xl` headline, a lede, two CTAs, and the event readout as a `20rem`
sidebar) is gone; the masthead survives at roughly half the height.

**Why:** measured, not guessed. On a 390×844 phone *nothing actionable was above the
fold at all*, and on a 1196px laptop you got the headline and the first pinned card.
The page spent its most valuable space telling a reader in Pereira that there had
been an earthquake, which is the one thing they already knew. Someone arriving
mid-aftershock is asking "what do I do now".

**Why this order.** It is the whole argument of the page:

1. **The two plates lead** because they are *standing instructions* — call 123, and
   these four hospital doors are shut. True on every visit, and rendered from
   hardcoded constants, so they survive a degraded read (Rule 7).
2. **Pinned notices are second** because they are curated and time-sensitive, which
   ranks below "call 123" but above navigation. They are compressed to ruled rows:
   three pins as full `UpdateCard`s cost ~540px and pushed everything else off the
   first screen. The cards remain in the feed below, which is still the full record.
3. **The six routes are third**, because choosing where to go is what you do after
   you have dealt with anything on fire.

**Every tile carries a live readout** — services down and unconfirmed, emergency
lines, verified reports. This is the difference between a hub and a nav menu: a tile
that only names a destination makes the reader open the door to find out what is
behind it. The counts are honest by construction — the reports tile reads with the
same limit `/reportes` renders, so the number is exactly what the reader will find,
never an estimate.

**Tiles are named for what the reader does** ("Busca a una persona"), never for a
part of the site ("Enlaces"). A tile that names a section is a decision handed back
to someone who is scared and scrolling fast.

**Why no numbering:** priority is carried by plate size and chroma instead. `01/02/03`
markers would claim a sequence, and nobody works through these in order. The numbered
sections on the page remain the bulletin's own records — the status board and the
update feed.

**Why only two coloured things:** the plates are the only chroma the board adds; the
six tiles stay achromatic. Three competing red things would spend the reader's alarm
budget on navigation, and the four status hues still need it.

**Consequence:** the board is now a fixed-size budget, like the masthead row. Six
tiles fit a `lg:grid-cols-3` board in two clean rows; a seventh means removing one,
not tightening the gap. The board also made two anchors load-bearing —
`#centros-medicos` on `/recursos` and `#personas-desaparecidas` on `/enlaces` — and
removed the hero's two buttons, since the board carries both routes as plates.

**Deliberately not on the board: a donate tile.** Donations already have a header
button, the site-wide strip, and a plate further down `/`. A fourth touchpoint above
the fold is over-amplification, and Rule 10 asks us to be careful with exactly that.

### No map yet

**Decision:** `reports` and `resources` carry `lat`/`lng`, but nothing renders them.

**Why:** damage and aid are inherently spatial and a map is clearly valuable — but it
is only valuable once there is verified data to plot, which requires Supabase and
moderators first. Building the map before the data would be building the demo.

### Interface is bilingual; content is not translated

**Decision:** UI strings exist in `es` and `en`; update titles and status headlines
render in whatever language they were written in.

**Why:** machine-translating a utility's official wording during an emergency
introduces exactly the drift the editorial rules exist to prevent. Expecting partners
to author bilingual copy mid-incident is unrealistic.

**Consequence:** an English reader sees English chrome around Spanish content. That is
intended.

---

### Rebrand: AquíAyuda

**Decision (2026-08-15):** the site joins a multi-city help network and takes its
brand: the volt-yellow/black/white identity and AA map-pin monogram from the
"AyudasAquí" design brief (PDF, draft). We render the name **inverted — AquíAyuda —**
because the acquired domains are `aquiayuda.co` / `aquiayuda.com` (shorter, and the
partners are re-cutting the brand to match); the brief's own filename still says
"AYUDAS AQUI". The wordmark is `AquíAyuda` bold + `Pereira` muted, keeping the brief's
city-lines model (Pereira/Cali/Manizales as pins AP/AC/AM) open without building it.

**How the brand met "chroma is signal":** volt yellow became the *one* saturated
chrome colour, with three hard rules — never a service state, always ink text on it
(volt on white can never pass 4.5:1), always an ink hairline around a volt fill
(measured: the dark theme's donate slabs are `bg-foreground` ≈ white, and volt L0.94
on white L0.955 has no silhouette). `--ember` was retinted from humanitarian amber
(h48) into the yellow family (h98/h102) so the landing's text-weight accents joined
the brand instead of fighting it. All of it is gated: `check-contrast` grew a
`brand-contrast`/`brand` pair, 56/56 pairings pass in both themes.

**The domain cutover (same day, second pass):** `aquiayuda.co` was wired and made
canonical hours after the reskin — repo renamed to `katapultlabs/aquiayuda`, all
four hostnames attached to the Vercel project (`.com` and both `www`s 308 to the
`.co` apex), Cloudflare zones carrying the standard two DNS-only records, and
`NEXT_PUBLIC_SITE_URL` flipped to `https://aquiayuda.co`. **`sismopereira.org`
deliberately still serves the site directly rather than redirecting**: every link
shared during the emergency's first week points there, and a redirect during the
response adds a failure mode for no reader benefit. Turning it into a 308 → .co is
post-emergency housekeeping; canonical tags already consolidate search onto .co.

**Deliberately not done in this pass:**
- **The type change.** The brief sets a normal-width grotesque; the site keeps
  condensed Archivo. The 2026-08-13 landing is composed around condensation (locked
  `nowrap` hero lines, a 240px rail) and widening every heading ~16% breaks that
  composition silently. Type moves with the IA rework, when the layouts are
  recomposed anyway.
- **City pins (AP/AC/AM/AB).** One city, one line, no invented network directory.

**Consequence:** the epicentre sigil (red square + ripple) is gone from masthead,
footer and favicon; the icon pipeline (`icon.svg` → `render-icons.mjs`) now draws the
pin, with the geometry echoed a third time in `brand-mark.tsx`.

## Technical

### Reads degrade; writes fail loudly

**Decision:** every read goes through `query()` and falls back to seed content on any
failure. `submitReport` does the opposite and returns an error rather than a false
success.

**Why:** the site is most useful exactly when our infrastructure is least reliable, so
a 500 is unacceptable for reading. But someone may be reporting a person trapped in
rubble — a false "report received" is unforgivable where a false blank is merely
annoying.

### Authorization lives in Postgres, not TypeScript

**Decision:** RLS policies are the authority. `moderation.ts` deliberately uses the
RLS-scoped client rather than the service role, so a non-moderator session simply
updates zero rows. The public reads views, not base tables.

**Why:** a filter in a component is a suggestion. A policy is enforcement, and it
holds even if someone adds a new page and forgets the check.

### Ship without a database

**Decision:** the entire site renders from `fallback-data.ts` with no Supabase
configured, showing a visible degraded banner.

**Why:** it produced a live, useful URL on day one, before any provisioning decision
had to be made. The same machinery then doubles as the outage path.

**Cost:** two sources of truth for seed content (`supabase/seed.sql` and
`src/lib/fallback-data.ts`) that must be kept in sync by hand.

### No i18n library

**Decision:** hand-written dictionaries in `src/lib/i18n.ts`, with
`type Dictionary = typeof es` so TypeScript catches any key missing from `en`.

**Why:** two languages, one product surface, no pluralisation complexity worth a
dependency. The type trick gives the main safety property a library would.

### Locale by request, not by URL

**Decision:** no `/es` or `/en` prefixes. One URL per page; language resolves from the
`lang` cookie, then `Accept-Language`, then Spanish. Retired prefixed URLs 308-redirect
and set the cookie to the language the old link asked for.

**Why:** a link shared into a WhatsApp group should render in each recipient's
language, not the sender's.

**Deliberate detail:** unknown languages, wildcards, and q-value ties resolve to
Spanish. Crawlers request `en-US`, and this site must not be indexed in English for an
audience in Pereira.

**Cost:** no shareable "this page in English" URL, and one canonical URL per page for
search engines rather than one per language.

### shadcn/ui on Base UI rather than Radix

**Decision:** `npx shadcn init --base base` (Base UI primitives).

**Why:** requested at the outset.

**Consequence that bites:** composition uses `render={<Link … />}`, **not** Radix's
`asChild`. Most shadcn examples online show `asChild` and will not work here.

### Body text supports `**bold**` and nothing else

**Decision:** `renderEmphasis()` handles bold; there is no Markdown or HTML pipeline.

**Why:** update bodies can arrive from partner submissions, and a full HTML renderer on
a page people are trusting in an emergency is an injection surface we do not need.

### `service_status` is append-only

**Decision:** partners post new rows; `current_service_status` collapses to the latest
per `(service, zone)`.

**Why:** a free audit trail. "What did the site say at 3pm, and who said it?" is a
question that matters after an emergency.

### Map tiles: MapLibre GL + OpenFreeMap, loaded on demand

**Decision:** the location picker on `/luz` uses MapLibre GL JS against OpenFreeMap's
public vector tiles. No API key, no quota, no account to provision, nothing to bill.

**Why not a keyed provider** (Mapbox, MapTiler, Stadia): every one of them needs an
account, a key in the environment, and a credit card that becomes a single point of
failure the first time this site gets linked from a national newspaper. Provisioning
that was slower than shipping the form.

**Why the map is not on the critical path:** MapLibre is ~250 KB of JavaScript and
needs WebGL, which is a real cost on the low-end Android someone is holding on a dying
battery. So it loads **only** when a reporter taps "ajustar en el mapa". The default
path — device GPS fix, or a zone from the dropdown — never downloads it, and the form
submits fine if the map never loads at all.

**Known weakness:** OpenFreeMap is run by one person as a free service, and we have no
contract with it. If it degrades, the fix is a Protomaps PMTiles extract of Risaralda
on Vercel Blob: same MapLibre code, one URL change, and it removes the third party
entirely. Deliberately not built yet — it is a ~100 MB artifact and a build step, for a
failure mode that costs us a pin-drag and nothing else.

### Submitter IPs are never stored

**Decision:** `submitReport` keeps a salted SHA-256 prefix for abuse triage only.

**Why:** enough signal to spot repeat abuse, no identifying data to leak or be
compelled to hand over.

---

### Analytics lives in its own PostHog organisation

**Decision:** the site reports to the **Sismo Pereira** project (ID `553635`) in a
**Sismo Pereira** PostHog organisation of its own — not to Katapult's.

**Why:** **PostHog's free plan allows one project per organisation.** Katapult's
single slot belongs to the Katapult website and platform. Putting this site there
would have consumed it, and a second project would then have required a card on file
(which unlocks six). A separate organisation costs nothing, carries its own free
event allowance, and — because moving a project between organisations is not
self-serve — is the form that can actually be handed over if stewardship of
sismopereira.org ever passes to a Colombian partner.

The cost is a second organisation to switch between in the PostHog UI, and a member
list that has to be maintained separately from the Vercel team. That was judged the
cheaper of the two problems.

**Note for whoever reads this next:** an organisation's *first* project arrives named
"Default project" and looks disposable. It is not necessarily unclaimed — an empty
project is often one somebody has created and not yet pointed anything at. Renaming
it is how you take someone else's slot without noticing.

---

### Analytics measures the site, and never the people who use it

**Decision:** pageviews and autocapture on the public bulletin; nothing at all from
`/panel` or `/admin`; no session replay; no person profiles; no stored IPs; query
strings stripped from every captured URL.

**Why:** the site collects phone numbers under a promise
([above](#collecting-and-handing-over-contact-details)), and an analytics SDK is
exactly the kind of thing that quietly breaks such a promise. Three of these are
guarding against a specific, checked mechanism rather than a vague worry:

- **`/panel` and `/admin` are dropped in `before_send`, not merely skipped at init.**
  PostHog autocapture records the `href` of every anchor it sees, and those two pages
  render reporter phone numbers as `tel:` links. Dropping at send time also covers a
  client-side navigation *into* a control room, where the SDK is already loaded and
  running. It does **not** capture what anyone types — input values are never
  autocaptured — so the public forms are safe as they stand.
- **Session replay is off in the project settings as well as in the client.** The
  client flag is a statement of intent; the project setting is the authority.
- **`person_profiles: "never"`.** Nobody signs in to the bulletin, so there is no
  profile worth building and none is created.

IPs are discarded by PostHog *after* GeoIP and bot detection run, so the city
breakdown survives without the site holding an address.

**What we chose not to do:** cookieless mode. It would have removed the last argument
for a consent banner, but it strips the IP *before* enrichment — costing both the
geographic breakdown and bot filtering — and rotates its identity salt daily, which
inflates weekly and monthly unique counts. Trading accurate numbers for a banner the
site does not currently show was the wrong way round for a project whose editorial
rules are about not publishing figures it cannot stand behind. Revisit if a banner
ever appears.

**Also not done:** a reverse proxy through `next.config.ts` rewrites. It is PostHog's
recommended defence against ad blockers, but it requires
`skipTrailingSlashRedirect: true` — a site-wide change that stops Next redirecting
`/servicios/` to `/servicios`, i.e. an SEO change made for an analytics reason — and
it needs `src/proxy.ts`'s catch-all matcher amended, or the matcher swallows the
ingestion path and the SDK silently sends nothing while still *looking* connected.
This audience is overwhelmingly mobile, where blocking is rare, so the loss is small
and the two new failure modes are not.

---

### The analytics SDK loads after the page is interactive

**Decision:** `src/instrumentation-client.ts` reaches PostHog through a dynamic
`import()` rather than a static one, and `track()` in `src/lib/analytics.ts` does the
same.

**Why:** `instrumentation-client.ts` runs before React hydrates, so a static import
puts the SDK in front of the page becoming usable. Measured on the production build:
posthog-js is **233 KB raw / ~72 KB gzipped**, and with the static import it was
pulled into a chunk the home page loads directly; with the dynamic import it lands in
a chunk that appears nowhere in the initial HTML and is fetched afterwards. Same
bytes eventually, but not ahead of the fold on a low-end phone on one bar — the same
trade `luz-report-form.tsx` already makes for MapLibre.

Verify it the same way if this is ever refactored: build, then check that the chunk
containing the SDK is absent from `curl`'s output for `/`.

---

## Process

### No PRs, no CI gate; `main` deploys

**Decision:** branch off `main`, run `pnpm build`, merge your own branch, push. Pushing
`main` deploys. No pull requests, no required reviewers, no branch protection, no CI
workflow. Everyone here reviews their own work and ships it.

**Why:** the contributors are a handful of people, mostly working locally and often in
the same room. A PR you approve yourself is not review — it is a form to fill in, and
during an incident it is a form standing between a wrong water status and its
correction. The safety properties that actually hold on this project are not
procedural: `pnpm build` catches the type and lint failures, reads degrade instead of
500ing, and RLS enforces authorization in Postgres regardless of who merged what.

**Cost, stated plainly:** nothing stops a bad commit reaching production. The mitigation
is rollback speed rather than prevention — promoting the previous deployment is one
click. And the failure we actually fear is publishing something false, which a reviewer
skimming a diff would not reliably catch either; [EDITORIAL.md](./EDITORIAL.md) is the
control for that, not a gate.

**Revisit when any of these becomes true:**

- Supabase is provisioned and migrations run against real data. A bad migration is not
  rollback-able the way a deploy is, and it is the first thing here that will deserve a
  second pair of eyes.
- Contributors outside the core group start sending changes.
- We break production twice in a way `pnpm build` would not have caught.

Until then, added process is not caution — it is overhead charged to an emergency site.

---

## Reversed or superseded

### The landing was locked to dark in both themes → it follows the theme

The 2026-08-13 redesign shipped `/` on the night palette regardless of the theme
setting, enforced three ways: a hardcoded `dark` class on the landing wrapper,
`body:has([data-landing])` added to the dark token block so the header and footer
cascaded into it, and the theme control removed from the landing (the horizontal
masthead is `lg:hidden` on `/`, and the mobile sheet's theme row was gated out).

The stated reason was that the landing is "charcoal in both themes and so has nothing
to toggle". The real reason was the artwork: two of the three hero treatments only
composited on a dark ground — `mix-blend-screen` at 6% opacity is invisible on a pale
card, and the closures card leant on `shadow-black/40`. Locking the page dark was the
cheap way to ship the art.

That is the wrong trade. Dark mode on this site is a *functional* accommodation —
people read it during a blackout, on battery, at night — and the corollary is that the
day palette is equally functional for everyone else. Making the one page most readers
ever see immune to the switch means the setting silently does nothing on the page it
matters most on, and there is no way to discover that.

Reversed on 2026-08-13. What it cost: the blend modes are gone (the art is drawn from
`--down` and `--ember` strokes, which follow the theme for free), and the closures
card's shadow is theme-split. The `--ember` light value already existed and already
passed the contrast gate; it had simply never been rendered.

**The trap this leaves behind:** `scripts/check-contrast.mjs` finds the dark token
block by searching for the dark class selector followed by ` {` and taking the *first*
match. Writing that sequence in a comment points the gate at prose, which extracts no
tokens and fails all 27 dark pairings at once. This cost one red build during the
reversal, which is why the comment above the block now describes the sequence instead
of quoting it.

### 3px "stamped" radius → 8px

`--radius` was `0.1875rem` on the argument that a tight corner is load-bearing: raising
it "reads as a generic card UI again." The redesign raised it to 8px on the landing
only, via a `[data-landing]` override.

Promoted site-wide on 2026-08-13, and the original argument does not survive contact.
What keeps this from reading as generic card UI is the achromatic chrome, the hairline
rules, the mono readouts and the condensed display face — the corner was not carrying
it. A site running 8px on its landing and 3px everywhere else, with the same pill
badges and the same footer on both, reads as two designs rather than one.

`rounded-sm` is 70 of the ~110 `rounded-*` uses in the tree, so it is the token that
sets the tone; it now takes `--radius` directly rather than half of it.

### Stamped rectangular status badges → soft pills

Same redesign, same reasoning, and it travels further than the landing: `StatusBadge`
renders on `/servicios` and `/donar` too. Status is still encoded three ways — colour,
icon and text — so the change is cosmetic in the way that matters. The pill carries
`whitespace-nowrap`, because the status card header is a `justify-between` row and
"sin confirmar" otherwise breaks across two lines next to a long service name.

### Carousels on the landing's two boards → carousel on mobile, grid on desktop

The redesign wrapped both the six route tiles and the seven service status cards in
`StatusCarousel`, which showed three slides at a time at every width. On a desktop
viewport that put four of the seven service statuses — and half the routes — behind a
horizontal swipe.

Reverted to a grid at `lg` and above on 2026-08-13, carousel retained below it. The
board exists to answer "is there water, is the hospital open" at a glance; an outage a
reader has to swipe to discover is an outage they do not see. On a phone the carousel
genuinely beats a seven-deep stack, so it stays there. Both forms need no JavaScript:
the grid is CSS, and the track is a plain scrollable row before hydration.

### Life safety as a corner widget on desktop → a fixed 123 plate

The redesign hides the horizontal masthead on `/` at `lg` in favour of the rail, which
also removed the 123 button it carries. `HeroSafety` rendered only the medical-closures
card, and 123 survived as a 12px mono row in the rail's phone directory — while the
hero's one large centred call to action was **Donar**. That inverts design principle 3
("no appeal for money or attention sits above 'call 123'").

Fixed on 2026-08-13 by adding a compact alarm-red 123 plate above the closures card in
the fixed bottom-right stack. Being fixed, it is now the one action on the page that
never scrolls away, which the donate CTA does — so the ordering holds at every scroll
position rather than only at the top.

The accepted cost: the two-card stack occludes the bottom of the right-hand column on
`lg`. That overlap pre-dates this change (the closures card alone did it) and life
safety is the one thing allowed to occlude.

### A 1.9MB hero image → the same drawing, computed

The redesign's hero art shipped as `public/seismic-dark.svg`: a 1024×1536 PNG encoded
base64 inside an SVG wrapper, 1.9MB on disk and **1.42MB gzipped**, referenced three
times on the landing. Against a product principle the same branch introduced — "the
page must be legible on a cracked screen over 2G" — that asset *was* the page.

Replaced on 2026-08-13 by `SeismicField` in `src/components/landing-art.tsx`, which was
already written, already in the branch, and entirely unimported. It draws the same
isoseismal rings from fixed maths (not `Math.random()`, so server and client markup
match — the same constraint `Seismograph` follows) at effectively zero transfer cost,
and its strokes take `--down` and `--ember`, which is what let the landing follow the
theme at all. `public/seismic-hero.svg` (131KB, unreferenced) went with it.


### "No map yet" → a map, because the data now exists

The original entry said `lat`/`lng` were carried but unrendered, because "building the
map before the data would be building the demo." That reasoning held exactly as long as
there was no data to plot.

`/luz` produces the data — household-level reports of whether the power is on, arriving
continuously. So the map ships on 2026-08-11, in two forms with different rules:

- **The reporter's map** (public) places a single pin: their own, or one they drag when
  reporting for someone else. It plots nothing it was not just handed.
- **The operator's map** (`/panel`, authenticated) plots every report for that
  organization's services, which is the entire purpose of the exercise.

There is still **no public map of reports**, and that is not an unfinished edge — see
the PII entry above.

### `/es` and `/en` route prefixes → removed

Originally shipped as a `src/app/[lang]/` tree with `/` redirecting to `/es`. Replaced
by per-request locale resolution (above) on 2026-08-10.

Two bugs surfaced during the change, both worth remembering:

1. `getLang()` initially read only the `x-lang` header. The proxy fixes that header
   *before* a server action runs, so the toggle rendered one click behind. It now
   reads the `lang` cookie first.
2. `LanguageToggle` initially assigned `document.cookie` directly, which React
   Compiler's `react-hooks/immutability` rule rejects. It now calls a server action —
   better anyway, since the cookie write and revalidation share one round trip.

Neither was caught by types or by `pnpm build`. Both were caught by clicking the
toggle.

### `public_organizations` filtered to verified orgs → now lists all of them

The view was defined `where verified`, so the organization directory could only ever
show orgs someone had already confirmed. But no org *starts* verified, and verifying
one is a human step that happens later — so the moment the site read from Postgres
instead of `fallback-data.ts`, `/organizaciones` rendered a bare heading with nothing
under it.

Caught on 2026-08-10 while provisioning the database, by diffing the live view against
`FALLBACK_ORGS` — which has always listed all sixteen with `verified: false`. The
fallback and the database are supposed to agree; the filter was the half that was
wrong, because the page already renders a "pending verification" badge and the
directory is a statement of identity, not endorsement.

`contact_email` and `contact_phone` came out of the view in the same migration. No
code read them — `Organization` in `src/lib/types.ts` has no such fields — so widening
the view without dropping them would have published contact details for organizations
nobody had verified.

The general lesson: a seed that renders correctly through the fallback path can still
render wrong through the database path. Check both.

### Placeholder contact email → removed

The partners page briefly fell back to `hola@sismopereira.org`, an address nobody
monitored. It now links to the public repository instead (commit `eca5dd3`).
Publishing a convincing fiction is the exact failure the editorial rules forbid, and it
slipped in as a "sensible default".

### Status colour tokens → contrast corrected

The first palette used near-white `*-foreground` values rendered on `*-muted` tinted
surfaces, making the "Crítico" badge and hero pill nearly illegible. Roles were split
into `*-contrast` (text on solid fill) and `*-foreground` (text on tinted surface) in
commit `9e9d22c`. On an emergency site, a status label you cannot read is a defect,
not a polish item.
