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

### Submitter IPs are never stored

**Decision:** `submitReport` keeps a salted SHA-256 prefix for abuse triage only.

**Why:** enough signal to spot repeat abuse, no identifying data to leak or be
compelled to hand over.

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
