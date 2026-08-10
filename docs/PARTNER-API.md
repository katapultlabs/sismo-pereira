# Partner API

**For utilities, telecom operators, public agencies, and relief organizations
publishing to Sismo Pereira.**

This document is self-contained — it can be sent to someone outside the project.

**Base URL:** `https://sismopereira.org/api/v1`

---

## What this gives you

A place to publish the status of your service that is public, timestamped, attributed
to your organization, and readable by anyone — including other responders, newsrooms,
and community bots — without them phoning your operations centre.

You keep control of your own data: everything you publish appears under your
organization's name, and only your organization can write it.

---

## Getting a key

Contact the project (see the *Organizaciones* page on the site). We verify that you
represent the organization, then issue a key that looks like `sp_…`.

The key is shown **once**. We store only a SHA-256 digest and cannot recover it — if
it is lost, we issue a new one.

Treat it like a password. Anyone holding it can publish under your name.

---

## Authentication

```
Authorization: Bearer sp_xxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

| Response | Meaning |
|---|---|
| `401` | Missing or invalid key. |
| `403` | Your organization is not verified yet, or you posted for a service you are not registered for. |
| `422` | The payload failed validation; the body lists the offending fields. |
| `503` | Our ingestion backend is unavailable. Retry with backoff. |

---

## `POST /status` — publish service status

The most important endpoint. Answers "is there power in this neighbourhood?"

```bash
curl -X POST https://sismopereira.org/api/v1/status \
  -H "Authorization: Bearer $SISMO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "electricity",
    "zone_slug": "cuba",
    "status": "restoring",
    "headline": "Cuadrillas trabajando en el circuito",
    "detail": "Se estima normalización progresiva durante la tarde.",
    "affected_users": 4200,
    "eta_restored": "2026-08-11T22:00:00-05:00"
  }'
```

### Fields

| Field | Type | Notes |
|---|---|---|
| `service` | enum | **Required.** `electricity` `water` `gas` `internet` `mobile` `transport` `health` `fuel` `education` `banking` |
| `zone_slug` | string | Defaults to `pereira` (whole municipality). See [Zones](#zones). |
| `status` | enum | **Required.** `operational` `degraded` `outage` `restoring` `unknown` |
| `headline` | string | Short line shown on the card. Max 200 chars. |
| `detail` | string | Longer explanation. Max 4000 chars. |
| `affected_users` | integer | Optional. |
| `eta_restored` | ISO 8601 | Include the offset: `-05:00`. |
| `source_url` | URL | Link to your own announcement, if any. |
| `reported_at` | ISO 8601 | Defaults to now. Use it when backfilling. |

### Batching

Send up to **200** entries in one call — useful for pushing a whole grid at once
during an incident, on a strained network:

```json
{
  "entries": [
    { "service": "electricity", "zone_slug": "cuba",          "status": "restoring" },
    { "service": "electricity", "zone_slug": "villa-santana", "status": "outage"    },
    { "service": "electricity", "zone_slug": "centro",        "status": "operational" }
  ]
}
```

### How to think about status

Each `(service, zone)` keeps a **history**; the newest row is what the site shows. So
you do not update or delete — you post the new state and it supersedes the old one.

- Post when state **changes**, not on a timer. A stale `outage` is as harmful as a
  stale `operational`.
- Prefer per-zone rows over one municipality-wide row once you know the detail.
  Restoration is patchy, and "Pereira: outage" keeps people in the dark about their
  own street.
- Use `unknown` honestly. It renders as "Sin confirmación oficial" and is a legitimate
  answer — we would rather show that than an inference.

### Scope enforcement

You may only publish for services listed against your organization. A water utility
posting `electricity` gets a `403`. This protects you as much as us: nobody else can
publish contradicting status for your service either.

---

## `POST /updates` — publish a newsfeed item

```json
{
  "title": "Servicio restablecido en gran parte de Cuba",
  "summary": "Se normalizó el suministro a las 4:10 p. m.",
  "body": "Texto completo. Se admite **negrita**.",
  "lang": "es",
  "severity": "info",
  "services": ["electricity"],
  "zone_slugs": ["cuba"],
  "source_url": "https://…",
  "publish": true
}
```

| Field | Notes |
|---|---|
| `title` | **Required.** 5–200 chars. |
| `severity` | `info` (default) · `warning` · `critical`. Reserve `critical` for life-safety. |
| `lang` | `es` (default) or `en`. Write in the language you actually publish in; we do not machine-translate. |
| `publish` | Defaults to `true` — live immediately, under your name. Set `false` to stage a draft. |

`body` supports `**bold**` only. It is deliberately not Markdown or HTML: partner
submissions render on a page people are trusting in an emergency, and a full HTML
pipeline would be an injection surface.

---

## Reading our data — no key needed

```
GET /api/v1/status
GET /api/v1/updates?limit=50
```

Open, CORS-enabled, cached 30s at the edge. **Please mirror rather than scrape the
HTML** — this endpoint is stable and cheap for both of us.

```json
{
  "ok": true,
  "degraded": false,
  "generated_at": "2026-08-11T15:04:05.000Z",
  "count": 7,
  "data": [ { "service": "electricity", "zone_slug": "cuba", "status": "restoring", … } ]
}
```

`degraded: true` means we are serving fallback content because our own database is
unreachable — treat that payload as potentially stale.

---

## Zones

`zone_slug` accepts Pereira's 19 comunas, its corregimientos, `pereira` for the whole
municipality, and neighbouring municipalities.

```
centro · villa-santana · rio-otun · san-joaquin · cuba · el-oso · perla-del-otun
consota · el-rocio · el-poblado · san-nicolas · olimpica · ferrocarril · universidad
boston · jardin · villavicencio · oriente · del-cafe

altagracia · arabia · caimalito · cerritos · combia-alta · combia-baja · la-bella
la-estrella · morelia · puerto-caldas · tribunas-corcega

pereira · dosquebradas · la-virginia · santa-rosa
```

Current list: `GET /api/v1/status` returns zone names alongside each row, or ask us
and we will add one.

---

## Practical notes

- **Retry on `5xx` with backoff.** Do not retry `4xx` — fix the payload.
- **Clocks matter.** Send timezone-aware timestamps. Colombia is `-05:00` year round.
- **Nothing is rate-limited today**, but batch anyway; it is kinder to the network
  during an incident.
- **Test against a real incident shape** before you need it. Post an `unknown` row for
  a zone, confirm it appears, then move on.

Questions, or a zone you need added: see the *Organizaciones* page on the site.
