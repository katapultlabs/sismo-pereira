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
- `pinned` holds an item at the top of the home page. Two or three maximum.
- `source_name` and `source_url` are effectively mandatory — see Rule 3 in
  [EDITORIAL.md](./EDITORIAL.md).

### Correcting something already published

Publish a new update describing the correction, then set the original to
`status = 'archived'`. Do not delete, and do not silently edit the original text.

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
