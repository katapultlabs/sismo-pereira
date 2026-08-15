# Runbook

**Audience:** whoever is operating the site during an incident.

For *what* to publish, read [EDITORIAL.md](./EDITORIAL.md) first. This document is
*how*.

---

## Before you publicise the URL

A checklist, in order. Steps 1 and 2 are currently **not done**.

1. **Provision Supabase.** Until then, nothing writes.
   See [SUPABASE.md](./SUPABASE.md).
2. **Name 2–3 moderators** with rough shift coverage, and grant them the role
   (below). One person cannot cover an incident.
3. Set `NEXT_PUBLIC_CONTACT_EMAIL` to a mailbox somebody actually reads.
4. Add SPF, DKIM, and DMARC records — see
   [INFRASTRUCTURE.md](./INFRASTRUCTURE.md#email-authentication). Without them anyone
   can send mail *as* sismopereira.org, which is uniquely damaging for a site whose
   whole value is being the trustworthy source.
5. Agree who may speak for the project publicly, and where corrections get posted.

---

## Moderating the report queue

**URL:** `/admin` — magic-link sign-in, no passwords.

Each pending report shows category, zone, description, any location hint, and (for
moderators only) the reporter's contact details.

Three actions:

| Action | Use when |
|---|---|
| **Publicar** | You believe it. It becomes publicly visible immediately. |
| **Rechazar** | False, unverifiable, or out of scope. |
| **Duplicado** | Same event as something already published. |

The internal note field is for the next moderator, not the public. Nothing you write
there is ever rendered publicly.

### How to verify quickly

- **Does it contain detail only a witness would have?** A street corner, a time, the
  colour of the equipment on scene. Generic reports that read like a summary of the
  news usually are one.
- **Does it match anything else independent?** Not "twenty people forwarded it" —
  independent.
- **Is there a contact?** For anything consequential, call. Thirty seconds on the
  phone beats an hour of inference.
- **Is it actionable and current?** A blocked road cleared four hours ago is noise.

When you can't verify and can't dismiss, leave it pending and move on. The queue is
allowed to have a tail.

### Granting the moderator role

A person must sign in once (so their `auth.users` row exists), then:

```sql
update profiles set role = 'moderator' where id = '<auth-user-id>';
```

Roles are `admin`, `moderator`, `publisher`, `viewer`. `publisher` is for partner-org
staff and only permits writing rows for their own organization.

---

## Publishing an update

Two paths.

**As a partner organization** — through the API with their key, published live and
attributed automatically. See [PARTNER-API.md](./PARTNER-API.md).

**As the project** — insert into `updates` directly (SQL or the Supabase dashboard)
until a first-party editor exists:

```sql
insert into updates (slug, title, summary, body, severity, services, zone_slugs,
                     source, source_name, source_url, status, pinned, published_at)
values ('restablecimiento-cuba-2026-08-11',
        'Energía restablecida en gran parte de Cuba',
        'EEP reporta normalización del circuito.',
        'Texto completo…',
        'info', '{electricity}', '{cuba}',
        'official', 'Empresa de Energía de Pereira',
        'https://…', 'published', false, now());
```

- `severity`: `info` | `warning` | `critical`. Reserve `critical` for
  life-safety. If everything is critical, nothing is.
- `pinned` puts the item in the strap line high on the home page — above the six
  route tiles, below the two life-safety plates (123 and the medical closures).
  Two or three maximum.

  A pinned row shows **severity, headline, and age, and nothing else**: no summary,
  no source line. The headline has to carry the notice on its own, and it gets about
  two lines on a phone, so write it as a statement rather than a topic —
  "Puente Mosquera cerrado en ambos sentidos", not "Actualización sobre el puente".
  The full card, with summary and source, is in the feed further down the page.

  Pinning does **not** create an alert. If something needs to be on screen for
  everyone before they do anything else, it belongs in a hardcoded component, not in
  `updates` — see Rule 7 in [EDITORIAL.md](./EDITORIAL.md).
- `source_name` and `source_url` are effectively mandatory — see Rule 3 in
  [EDITORIAL.md](./EDITORIAL.md).

## Publishing a service status

The status board reads `current_service_status`, which is the row with the newest
`reported_at` per service and zone. Publishing is an `insert`, never an update —
the history stays intact and the newest row wins:

```sql
insert into service_status
  (service, zone_slug, status, headline, detail, source, org_id, reported_at)
select 'health', 'pereira', 'outage',
       'Titular corto',
       'Detalle…',
       'official', o.id, '2026-08-10T16:47:00Z'
from organizations o where o.slug = 'alcaldia-pereira';
```

**Verify with `current_service_status`, not the insert's return code.** An insert
can succeed and still not reach the board: the seed stamps all seven baseline
`unknown` rows with the moment the database was seeded, so a report whose true
`reported_at` predates that bulk insert is written but never surfaces.

```sql
select service, status, headline, reported_at
from current_service_status where service = 'health';
```

If a stale baseline is winning, move *that placeholder* back to an earlier time.
Do not restamp the real report with `now()` — the card renders `reported_at` as
«Actualizado», and a four-hour-old hospital status shown as current is precisely
the failure Rule 1 exists to prevent.

### Correcting something already published

Publish a new update describing the correction, then set the original to
`status = 'archived'`. Do not delete, and do not silently edit the original text.

---

## Running the electricity reporting drive (`/luz` → `/panel`)

`/luz` collects household reports of whether the power is on. `/panel` is where the
operating utility reads them. Read
[EDITORIAL Rule 4](./EDITORIAL.md#rule-4--contact-details-are-never-published) and the
[decision entry](./DECISIONS.md#collecting-and-handing-over-contact-details) before
touching either — this is the one surface that collects a required phone number and
hands it to a third party.

### Giving utility staff access to `/panel`

There is no separate login. `/panel` uses the same magic-link sign-in as `/admin`, and
access is decided entirely by RLS.

1. The person signs in once at `/admin/login`, so their `auth.users` row exists.
2. Attach them to the organization and confirm the org is verified and scoped:

   ```sql
   update profiles
      set org_id = (select id from organizations where slug = 'energia-pereira'),
          role   = 'viewer'          -- 'publisher' if they should also publish status
    where id = '<auth-user-id>';
   ```

3. The organization must be `verified = true` and must list the service:

   ```sql
   select slug, verified, services from organizations where slug = 'energia-pereira';
   -- services must contain 'electricity', or /panel shows an empty queue
   ```

`role` governs *publishing*, not *seeing*: any profile attached to a verified org whose
`services` cover the service reads those reports. That is deliberate — a control room
needs read-only staff, and `viewer` is the safe default for them.

**The commonest failure is a silent empty panel.** An account with no `org_id`, an org
with `verified = false`, or a `services` array missing `electricity` all produce zero
rows rather than an error, because RLS filters rather than refuses. Check those three
things in that order.

### Opening a new service instrument

`/agua` (and any future twin of `/luz`) ships **closed**: it renders an honest
"not yet taking reports" state and routes people to the moderated community form.
It stays closed until both halves of the gate in
`src/lib/service-instruments.ts` hold:

1. **A verified organization covering the service exists** — for water, Aguas y
   Aguas with `water` in `organizations.services` and `verified = true`. This is
   the same condition RLS uses to let them read the rows.
2. **The launch switch is flipped in code** (`live: true`), and it is flipped
   only after a named person at the operator confirms a team will read
   `/panel?servicio=agua` (or take the CSV). A form that collects phone numbers
   nobody reads is the exact failure
   [EDITORIAL Rule 5](./EDITORIAL.md#rule-5--moderate-before-publishing-always)
   forbids — do not open the instrument to "see if reports come in".

Before flipping the switch: give their staff panel access (previous section,
with `water` in the org's `services`), have them load the panel once, and only
then merge the one-line diff. The `/reportar` triage door updates itself — it
reads the same gate.

### Handing the data over without an account

`/panel/export` returns a CSV of everything the signed-in session may see, scoped by
the same policy. It is the right answer when the utility would rather work in its own
tools than in ours. It contains contact details: send it the way you would send a key,
and do not put it in a shared drive.

### Watching whether it is working

```sql
-- Households reporting, by zone, over the public 12-hour window.
select zone_slug, outage_count, operational_count, total_count, last_reported_at
from service_report_density where service = 'electricity'
order by total_count desc;

-- Raw submission rate, to tell "nobody is reporting" from "the form is broken".
select date_trunc('hour', created_at) as hour, count(*)
from service_reports where created_at > now() - interval '12 hours'
group by 1 order by 1 desc;
```

`service_report_density` counts **households, not submissions** — it keeps the newest
report per phone number. A count that looks lower than the raw row count is the
de-duplication working, not data loss.

### Reports do not change the status board

Nothing on `/luz` touches `service_status`. Ten thousand people reporting no power does
not flip a card on `/servicios`; only the operator's own reporting does. If you want
the board to say the grid is down, publish it as a status from the operator, or as an
update with `source: media`. See
[EDITORIAL Rule 3](./EDITORIAL.md#rule-3--every-claim-carries-its-source-and-its-time).

### Retiring `/luz` and purging what it collected

This drive is scoped to the emergency. When it ends — or if anyone asks for their data
back — there is a deletion path, and someone has to actually run it.

```sql
-- One person's data, on request.
delete from service_reports where contact_phone = '3001234567';

-- Drop contact details but keep the anonymous outage geography for analysis.
update service_reports
   set contact_phone = null, matricula = null, note = null
 where created_at < now() - interval '30 days';

-- Or remove the lot.
truncate service_reports;
```

Taking the page down is a deploy: remove the CTA from the home page and the header
sheet, and either delete `src/app/luz/` or have it render the closing notice. Leaving
a live form collecting phone numbers nobody reads is the Rule 5 failure with a
regulator attached.

---

## Publishing a collection point (`/donar#acopio`)

A drop-off site is a `resources` row with `kind = 'donation_point'`, rendered in the
goods half of `/donar`. It is invisible until `verified = true`, and **the
confirmation bar is Rule 2's, not a lower one**:
a named person at the operating organization, or that organization's own channel.

This matters more here than on any other address the site publishes. Collection-point
appeals are the most forwarded messages in circulation after a quake — they arrive
already stripped of their origin — and a fabricated one is a working method for
stealing donated goods. **A forwarded broadcast is a lead, not a source.**

Announcements that arrive before anyone can check them go into
`supabase/pending/` as `verified = false` inserts, so the wording is preserved
without being published. Nothing in that directory runs automatically — not on
`supabase db reset`, not on deploy. Create it when you need it and delete each
file once its rows are live; the directory is empty most of the time, and a
spent script that still says "run this against production" is worse than none.

```sql
insert into resources
  (kind, name, description, address, hours, phone, status, needs,
   source, source_name, source_url, verified)
values
  ('donation_point',
   'Nombre del punto',
   'Una línea sobre quién lo opera.',
   'Dónde exactamente — la entrada, no sólo el edificio',
   '8:00 a. m. – 4:00 p. m.',
   null,
   'operational',
   array['Agua', 'Gasas', 'Pañales'],
   'official', 'Canal o persona que lo confirmó', 'https://…',
   true);
```

- **`needs` is the reason the page exists.** Array order is display order, so keep
  the operator's own ordering. A point with an empty `needs` renders "pregunta
  antes de llevar algo" — which is honest, and much less useful. Chase the list.
- **`address` should be the drop-off point, not the site.** "Viva Cerritos" tells
  someone which building; "parqueadero de la Clínica Comfamiliar" tells them where
  to stop the car. If you only have the building, leave `address` null rather than
  guessing an entrance.
- **`hours` are not optional in practice.** A collection point opens and closes
  according to the storage space it has, and a wasted trip with a boot full of
  water is the failure this page is trying to prevent.
- **`source` gates a visible badge.** Anything other than `official` renders "No es
  un canal oficial" on the card, the same as `/enlaces`.
- **Confirm that a stranger can get in, not just that the point exists.** Several
  of these sit inside private venues — a members' club, a gated compound, an office
  lobby. "We are collecting donations" in a note to members does not by itself mean
  the public may drive through the gate. Ask explicitly, and if the answer is no,
  don't publish it: sending someone with a boot full of nappies to a barrier is
  Rule 2's failure with a security guard attached.

**Take a point down the moment it stops receiving.** Set `verified = false`; it
vanishes on the next request. A collection point that closed this morning is the
same failure as a shelter that closed this morning, and it is more likely, because
these fill up and shut in hours.

```sql
select name, address, hours, verified, source, source_name
from resources where kind = 'donation_point' order by name;
```

---

## Keeping `/donar` honest

The donation page is **hardcoded**, so every change to it is a deploy — there is no
moderation queue and no database row to edit. Its copy lives in the `donate` block of
`src/lib/i18n.ts` (both languages), and its components in
`src/components/donate-banner.tsx`.

It carries a visible **"Revisado el …"** date. That date is a claim like any other, so:

- **Re-check before you re-date.** Open the campaign, confirm the operator, the
  domain, and the payment routes still match what section 01 says. Only then move the
  date.
- **Move findings between sections as facts change**, rather than quietly deleting
  them. If Vaki publishes an EIN or a disbursement report, that item moves out of
  "Qué todavía no es público" and into "Qué verificamos nosotros" *with a source* — it
  does not simply disappear.
- **Never soften section 03 to make the page read better.** The open questions are
  what make section 01 credible; a page with only good news is an advertisement.
- **The declaration of interest stays** for as long as the operator holds a stake in
  Vaki, at full size and in the body. See
  [EDITORIAL.md](./EDITORIAL.md#rule-10--if-we-amplify-it-we-disclose-our-interest-in-it).

If the campaign closes or the fund stops accepting donations, pull the whole drive in
one deploy — the bar, the blocks, the header button, and the page — rather than
leaving a live "Donar" button pointing at a dead campaign.

---

## Onboarding a partner organization

1. **Verify they are who they say.** An institutional email address and a named
   person. This is the whole security model — an API key issued to the wrong person
   lets them publish official-looking outage data.
2. Confirm the row exists in `organizations` and that its `services` array lists
   exactly what they may publish. An electricity utility with `{electricity}` is
   rejected by the API if it posts water status.
3. Issue the key:

   ```bash
   node --env-file=.env.local scripts/issue-api-key.mjs energia-pereira
   ```

   The plaintext key prints **once** and is stored only as a SHA-256 digest. Issuing a
   key also sets `verified = true`.
4. Send them [PARTNER-API.md](./PARTNER-API.md) and the key **through separate
   channels**.

### Revoking

```sql
update organizations set api_key_hash = null, api_key_last4 = null, verified = false
where slug = '<org-slug>';
```

Their existing published rows stay — archive them separately if the content is in
doubt.

---

## When things break

### The site shows "Mostrando información de respaldo"

The database is unreachable and the site is serving seed content. **The site is up;
the data is stale.** Check Supabase status, then Vercel logs. This banner is working
as designed — see Rule 7 in [EDITORIAL.md](./EDITORIAL.md).

### Reports submit but never appear

Expected — they need moderator approval. If the queue at `/admin` is empty too, check
that the anonymous `INSERT` policy on `reports` still exists.

### A moderator sees "No tienes permisos de moderación"

Their `profiles.role` is not `moderator` or `admin`. RLS is the authority; there is no
application-level override.

### Partner API returns 403

Either the org is not `verified`, or it is posting for a service outside its
`services` array. The response body says which.

### Traffic spike

Vercel absorbs the front end. The likely constraint is Supabase connections. `GET
/api/v1/*` is cached at the edge for 30s and is the cheapest way for others to consume
our data — point aggregators and newsrooms there rather than at the HTML.

---

## Escalation

This site is **not** an emergency service and must never be presented as one. Every
page carries the 123 line, and the submission form leads with it.

If a report indicates immediate danger to life, call **123** yourself. Do not assume
the reporter already did, and do not wait on the moderation workflow.

| Line | Number |
|---|---|
| Emergencias | 123 |
| Bomberos | 119 |
| Cruz Roja | 132 |
| Defensa Civil | 144 |
| Policía | 112 |
