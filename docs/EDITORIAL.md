# Editorial rules

**Audience:** moderators, anyone writing content, anyone reviewing a pull request
that touches what the site displays.

This is the most important document in the repository. Everything else is
replaceable; this is the thing that makes the site worth trusting.

---

## The premise

After an earthquake, the scarcest resource is not aid. It is **trustworthy answers to
small questions**. *Is there water in Cuba? Is the Matecaña open? Is that video from
today or from Armenia in 1999?*

Rumour fills that vacuum within hours, and rumour is not merely useless — it moves
people. It sends them to shelters that do not exist, keeps them out of buildings that
are safe, and floods emergency lines with calls about things that never happened.

So the site has exactly one job: **be the boring, correct, timestamped answer.** Every
rule below follows from that.

---

## Rule 1 — "Unknown" is a first-class status

A service whose state we have not confirmed shows **"Sin confirmación oficial"**, not
a guess, not a blank, and not last-known-good.

This is enforced in code. `status_level` includes `unknown`, the seed data sets every
service to it, and the UI renders an explicit notice:

> Los servicios marcados como «sin confirmar» aún no tienen un reporte verificado del
> operador. **No asumas que están funcionando ni que están caídos.**

### Why this matters more than it looks

The tempting failure is to make the dashboard look "complete" by inferring. If EEP
announced a citywide outage two hours ago, it is tempting to mark every comuna red.
Don't. Restoration is patchy and fast; a stale red is as harmful as a stale green.
Somebody deciding whether to drive across town to check on their mother deserves to
know we don't know.

**In practice:** never seed, demo, or "fill in" operational data. When you need
example content for a screenshot, use `unknown`. `FALLBACK_RESOURCES` is deliberately
an empty array for exactly this reason.

---

## Rule 2 — Never publish an unverified address

Shelters, aid points, water points, and medical posts appear **only** when an
organization confirms them. `resources.verified` defaults to `false` and the public
query filters on it.

This is the site's worst possible failure. Sending a family across a damaged city, at
night, with children, to a shelter that closed this morning or never existed is worse
than telling them nothing — because telling them nothing leaves them looking for a
real answer.

The empty state says so plainly:

> Todavía no tenemos albergues ni puntos de ayuda verificados. Publicamos una dirección
> solo cuando una organización la confirma — enviar a alguien a un lugar que no existe
> es peor que no dar información.

**What counts as confirmation:** a named person at the operating organization, or an
official channel of that organization. A screenshot forwarded through three WhatsApp
groups does not count, however plausible.

---

## Rule 3 — Every claim carries its source and its time

Both are rendered on every status card and every update. `source_kind` distinguishes
`official`, `media`, `social`, `private`, and `community`, and `source_url` links out
wherever one exists.

Readers are entitled to route around us. If someone wants to check *El Tiempo*
directly, the link is right there. A site that asks to be trusted without showing its
work is asking for the wrong thing.

**Timestamps are Bogotá time** (`America/Bogota`), formatted with `Intl`. Relative
times ("hace 2 h") sit next to absolute ones in the `title` attribute, because "2
hours ago" is useless in a screenshot someone shares tomorrow.

---

## Rule 4 — Contact details are never published

A reporter may leave a name, phone, or email so a moderator can verify with them. That
data:

- is visible **only** to moderators, in the queue;
- never appears on the public site — the public reads the `public_reports` view, which
  drops every PII column at the database level, not in a component;
- is not exported, aggregated, or used for anything but verifying that one report.

The submitter's IP is **never stored**. `submitReport` keeps a salted SHA-256 prefix
(`REPORT_HASH_SALT`) purely so repeat abuse can be spotted; it is not reversible and
not linked to identity.

**If you are moderating:** you will sometimes see a phone number attached to a report
about a missing person or a trapped neighbour. Use it to verify, then leave it alone.
Do not paste it into the update text.

---

## Rule 5 — Moderate before publishing, always

Anonymous submissions insert with `status = 'pending'` and are invisible until a
moderator marks them `verified`. The RLS policy allows anonymous `INSERT` only, never
`SELECT`, on the base table.

During a disaster, open submissions attract three things in roughly this order:
genuine reports, panic, and a small number of people acting in bad faith. The
moderation gate is the only thing separating the first from the other two.

**This implies an obligation.** A queue nobody drains is worse than no submission form
at all, because the form implies somebody is reading. If you cannot staff moderation,
take the form down rather than let it collect unread reports. See
[RUNBOOK.md](./RUNBOOK.md).

---

## Rule 6 — Spanish is the source of truth

The audience is in Pereira. Spanish copy is written first and is authoritative;
English is a translation for diaspora, international responders, and press.

The interface is bilingual and follows the reader's system locale, but **content**
(update titles, status headlines) renders in the language it was written in. An
English reader may see English chrome around Spanish content. That is correct and
honest — machine-translating a utility's official wording during an emergency would
introduce exactly the kind of drift this document exists to prevent.

Anything ambiguous — an unknown `Accept-Language`, a crawler, a missing header —
resolves to Spanish deliberately.

---

## Rule 7 — The site must survive its own infrastructure

Every read goes through `query()` in `src/lib/data.ts`, which falls back to seed
content if Supabase is missing, erroring, or slow, and flags the page as `degraded` so
it renders a visible banner.

During an aftershock, our database is at its least reliable exactly when the site is
at its most useful. A 500 page is not an acceptable answer.

Writes behave the **opposite** way: `submitReport` fails loudly rather than pretending
a report was filed. Someone may be reporting a person trapped in rubble; a false
confirmation is unforgivable where a false blank is merely annoying.

---

## Rule 8 — Don't fabricate anything to fill a gap

No placeholder emails, no example phone numbers, no lorem-ipsum shelters, no invented
`affected_users` counts to make a card look populated.

This has already bitten once: the partner page originally fell back to a
plausible-looking `hola@sismopereira.org` that nobody monitored. It now renders a link
to the public repository instead, because a real link is better than a convincing
fiction (commit `eca5dd3`).

If a field is empty, render nothing, or render the honest empty state.

---

## Judgment calls

Real situations that don't resolve cleanly from the rules above.

### A utility tweets an outage but hasn't posted to our API

Publish it as an **update** with `source: media` (or `social`), the operator named,
and a link to the tweet. Do **not** flip the `service_status` card — that channel is
reserved for the operator's own reporting. The distinction is the whole point: the
status board says "the operator told us", the feed says "we saw this".

### Twenty people report the same blocked road

Verify one, mark the rest `duplicate`. Volume is not corroboration — twenty people
forwarding the same rumour looks identical to twenty independent witnesses. Look for
detail that only a witness would have.

### A report names a missing person

We do not run a missing-persons registry — see
[DECISIONS.md](./DECISIONS.md#no-missing-persons-registry). Point the reporter at Cruz
Roja's official system. Do not publish the name.

### Something we published turns out to be wrong

Correct it visibly. Publish a new update that says what was wrong and what is now
known, and archive the original rather than silently deleting it (`publish_status`
includes `archived`). A site that quietly rewrites its history is not one you can
trust twice.

### A partner publishes something that looks wrong

Partners publish live by design — a queue a moderator must drain is a queue that goes
unread during an incident. Attribution protects both sides: it is under their name and
timestamped. If it is wrong, contact them and archive it; don't edit their words.

---

## The one-line version

**When in doubt, say less, and say when you learned it.**
