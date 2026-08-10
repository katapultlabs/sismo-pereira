# Sismo Pereira

Crisis information platform built in response to the **M7.4 earthquake of
10 August 2026**, whose epicentre was in Chocó, roughly 55 km west of Pereira.

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

Visit http://localhost:3000 — `/` redirects to `/es`, and `/en` is the English
tree.

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

Base URL: `https://<your-domain>/api/v1`

### Authentication

```
Authorization: Bearer sp_xxxxxxxxxxxxxxxxxxxx
```

Keys are stored only as SHA-256 digests. Issue one with:

```bash
node --env-file=.env.local scripts/issue-api-key.mjs energia-pereira
```

The plaintext key is printed **once**. Issuing a key marks the organization
verified.

### `POST /api/v1/status`

Publish service status. Single entry or a batch of up to 200.

```bash
curl -X POST https://<domain>/api/v1/status \
  -H "Authorization: Bearer $SISMO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "electricity",
    "zone_slug": "cuba",
    "status": "restoring",
    "headline": "Cuadrillas trabajando en el circuito",
    "affected_users": 4200,
    "eta_restored": "2026-08-10T22:00:00-05:00"
  }'
```

Batch form: `{ "entries": [ {...}, {...} ] }`

| Field | Type | Notes |
|---|---|---|
| `service` | enum | `electricity` `water` `gas` `internet` `mobile` `transport` `health` `fuel` `education` `banking` |
| `zone_slug` | string | Defaults to `pereira` (whole municipality). See `zones`. |
| `status` | enum | `operational` `degraded` `outage` `restoring` `unknown` |
| `headline` | string? | Short line shown on the card |
| `detail` | string? | Longer explanation |
| `affected_users` | int? | |
| `eta_restored` | ISO 8601? | |
| `source_url` | URL? | |

An organization may only post for services it's registered for — an electricity
utility cannot publish water status.

### `POST /api/v1/updates`

Publish a newsfeed item, attributed to your organization.

```json
{
  "title": "Servicio restablecido en Villa Santana",
  "summary": "Se normalizó el suministro a las 4:10 p. m.",
  "severity": "info",
  "services": ["electricity"],
  "zone_slugs": ["villa-santana"],
  "publish": true
}
```

### Public reads

`GET /api/v1/status` and `GET /api/v1/updates?limit=50` are open, CORS-enabled,
and cached for 30s. No key required — please mirror rather than scrape.

---

## Moderation

`/es/admin` — magic-link sign-in, no passwords. A moderator sees the pending
report queue with contact details, and publishes, rejects, or marks duplicates.

Grant the role in SQL after the person has signed in once:

```sql
update profiles set role = 'moderator' where id = '<auth-user-id>';
```

---

## Project layout

```
src/
  app/
    [lang]/            # single route tree; /es and /en
    api/v1/            # partner ingestion + public JSON
  components/          # site chrome, cards, forms
  lib/
    data.ts            # all reads; falls back to seed on failure
    i18n.ts            # dictionaries + enum labels + formatting
    api-auth.ts        # partner API-key auth
  proxy.ts             # locale redirect + x-lang header
supabase/
  migrations/          # schema + RLS
  seed.sql
```

---

## Contributing

This was built fast, in a real emergency. Corrections to the data model, the
zone list, or the Spanish copy are especially welcome — the people best placed
to catch errors are the ones in Pereira.
