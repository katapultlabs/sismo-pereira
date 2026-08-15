# AquíAyuda Pereira

Crisis information platform built in response to the **M7.4 earthquake of
10 August 2026**, whose epicentre was in Chocó, roughly 55 km west of Pereira.
Launched as *Sismo Pereira*; rebranded **AquíAyuda** on 2026-08-15 to join a
multi-city help network. Canonical home is **https://aquiayuda.co**
(`aquiayuda.com` redirects there); the launch domain `sismopereira.org` still
serves the site.

The goal is narrow and specific: **close the information vacuum**. In the hours
after a quake, the scarcest resource is not aid — it is trustworthy answers to
small questions. *Is there water in Cuba? Is the Matecaña open? Is that video
from today?* This site exists to hold those answers, with a source and a
timestamp attached to every one.

---

## What it does

**Three ways information gets in:**

1. **Utilities and telcos publish directly.** Verified organizations (EEP, Aguas
   y Aguas, Efigas, Claro, Movistar, Tigo, WOM, Megabús…) push service status
   through a REST API with an API key, or through the web UI. Everything they
   publish is attributed to them.
2. **The public submits reports.** Anyone can report structural damage, a
   blocked road, an outage, or an offer of help. Nothing appears publicly until
   a moderator verifies it.
3. **Social and private sources get aggregated** into a moderation inbox
   (`social_mentions`) rather than straight onto the page.

**One way information gets out:** a status board, a sourced update feed, a
verified community-report feed, and an emergency-resources page — all in Spanish
and English, and all readable as JSON at `/api/v1/*` so newsrooms and other
responders can mirror it instead of scraping.

---

## Editorial rules baked into the code

These are design constraints, not preferences. They're written down because
under time pressure they're the first things to get quietly dropped.

- **Unknown is a first-class status.** Services seed as `unknown`, never as a
  guess. A plausible-but-invented outage is worse than a blank — people make
  travel and evacuation decisions on this.
- **No unverified addresses.** Shelters and aid points appear only when an
  organization confirms them. Sending someone across a damaged city at night to
  a place that doesn't exist is this site's worst failure mode.
- **Every claim carries its source and time.** Both are rendered on every card.
- **Contact details are never published.** Reporters may leave a phone number
  for verification; it's visible to moderators only and never leaves the
  `reports` table.
- **The site survives its own infrastructure.** If Supabase is unreachable, the
  data layer falls back to seed content and shows a visible "showing fallback
  information" banner rather than a 500.

The full version, with the judgment calls worked through, is in
**[docs/EDITORIAL.md](./docs/EDITORIAL.md)** — read it before changing anything the
site displays.

---

## Documentation

| Document | For |
|---|---|
| [docs/EDITORIAL.md](./docs/EDITORIAL.md) | What we publish and refuse to publish. The most important document here. |
| [docs/RUNBOOK.md](./docs/RUNBOOK.md) | Operating during an incident: moderation, publishing, partner onboarding. |
| [docs/PARTNER-API.md](./docs/PARTNER-API.md) | The API contract. Self-contained — safe to send to a partner. |
| [docs/SUPABASE.md](./docs/SUPABASE.md) | Schema, the RLS trust model, and how the database was provisioned. |
| [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) | Vercel, DNS, the domain, and failure modes already hit. |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Why things are this way, and what we chose not to build. |

Coding agents should start at [CLAUDE.md](./CLAUDE.md).

> **Current state:** the site is live and **production reads a live Supabase** — the
> fallback banner does not appear there. Local development is the opposite: it runs
> with no `.env.local` and every read falls back to seed content. That difference is
> the trap — editing `seed.sql` or `src/lib/fallback-data.ts` publishes nothing. To
> change the live site, write to the database:
> [docs/RUNBOOK.md](./docs/RUNBOOK.md#publishing-an-update).

---

## Stack

| | |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack, React 19.2) |
| UI | shadcn/ui on **Base UI** primitives, Tailwind CSS v4 |
| Data | Supabase (Postgres + Auth + Realtime), RLS-enforced |
| Hosting | Vercel |

Note: Base UI components use a `render` prop, **not** Radix's `asChild`.

---

## Local development

```bash
pnpm install
cp .env.example .env.local   # optional — the site runs without Supabase
pnpm dev
```

Visit http://localhost:3000. There is one URL per page — no `/es` or `/en`
prefix. The language follows the visitor's browser locale (Spanish for anything
ambiguous) and a toggle in the header overrides it, remembered in a cookie.

### Database

```bash
supabase start
supabase db reset            # applies migrations + seed
```

Migrations live in `supabase/migrations/`, seed data in `supabase/seed.sql`.

---

## Trust and access model

Enforced by Postgres RLS, not by application code:

| Actor | Can do |
|---|---|
| Anonymous | Read published updates, verified reports, service status, verified resources. **Insert** a pending report. |
| Publisher (org member) | Everything above, plus publish `service_status` and `updates` **for their own organization only**. |
| Moderator / Admin | Everything, plus read raw reports (including contact details) and approve/reject them. |

Raw `reports` rows are never readable by the public — the site reads the
`public_reports` view, which drops every PII column.

---

## Partner API

Utilities, telcos, and agencies publish through a REST API with an API key.
Everything they publish is attributed to their organization, and an org may only
post for services it is registered for.

```bash
curl -X POST https://sismopereira.org/api/v1/status \
  -H "Authorization: Bearer $SISMO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"service":"electricity","zone_slug":"cuba","status":"restoring"}'
```

`GET /api/v1/status` and `GET /api/v1/updates` are open, CORS-enabled, and cached
30s — please mirror rather than scrape.

**Full contract: [docs/PARTNER-API.md](./docs/PARTNER-API.md)** — self-contained and
safe to send to a partner organization.

Issue a key with:

```bash
node --env-file=.env.local scripts/issue-api-key.mjs energia-pereira
```

---

## Moderation

`/admin` — magic-link sign-in, no passwords. A moderator sees the pending report
queue with contact details, and publishes, rejects, or marks duplicates.

Day-to-day operation, including how to verify a report and how to onboard a partner,
is in **[docs/RUNBOOK.md](./docs/RUNBOOK.md)**.

---

## Project layout

```
src/
  app/
    (pages)            # one URL per page; language resolved per request
    api/v1/            # partner ingestion + public JSON
  components/          # site chrome, cards, forms
  lib/
    data.ts            # all reads; falls back to seed on failure
    i18n.ts            # dictionaries + enum labels + formatting
    lang.ts            # getLang(): cookie -> Accept-Language -> es
    lang-actions.ts    # setLanguage() server action for the toggle
    api-auth.ts        # partner API-key auth
  proxy.ts             # Accept-Language -> x-lang; /es,/en legacy redirects
supabase/
  migrations/          # schema + RLS
  seed.sql
```

---

## Contributing

This was built fast, in a real emergency. Corrections to the data model, the
zone list, or the Spanish copy are especially welcome — the people best placed
to catch errors are the ones in Pereira.

**How work reaches production — the whole process:**

```bash
git switch -c fix-water-zone     # branch off main
# …work…
pnpm build                       # the only gate. It has to pass.
git switch main && git merge fix-water-zone && git push
```

`main` is production: pushing it deploys. **No pull requests, no CI, no review
queue** — you review your own work, merge your own branch, and ship. Push a branch
first if you want a Vercel preview URL to check on a phone or share before it goes
live. Don't force-push `main`.

Read [docs/EDITORIAL.md](./docs/EDITORIAL.md) before changing anything the site
displays — with no review gate, those rules are the control. The reasoning behind
keeping the process this thin, and what would make us add to it, is in
[docs/DECISIONS.md](./docs/DECISIONS.md#no-prs-no-ci-gate-main-deploys).
