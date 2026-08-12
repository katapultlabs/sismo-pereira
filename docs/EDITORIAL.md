# Editorial rules

**Audience:** moderators, anyone writing content, anyone shipping a change that
touches what the site displays.

Nobody else will review that change before it goes live — see
[DECISIONS.md](./DECISIONS.md#no-prs-no-ci-gate-main-deploys). These rules are the
review.

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

"Published" is the operative word, and it is the part of this rule that does not bend.
Contact details never appear on the public site. The public reads `public_reports` and
`service_report_density`, which drop every identifying column at the database level,
not in a component.

Everything else about this rule changed on 2026-08-11, deliberately — see
[DECISIONS.md](./DECISIONS.md#collecting-and-handing-over-contact-details).

### What we collect, and who gets it

Two different things now live under this rule.

**Community reports** (`/reportar`) work as they always did. Name, phone, and email are
optional, visible only to moderators in the queue, and used only to verify that one
report.

**Service reports** (`/luz`) are a collection instrument built for an operator. A phone
number is **required**, location is captured at household precision, and the entire
point is to hand that data to the utility that operates the service — currently the
Empresa de Energía de Pereira, whose own telemetry is unreachable. Staff of the
verified organization operating a service read those rows directly, scoped by
`organizations.services` in RLS.

We do this **without a consent gate, without SMS verification, and without a data
processing agreement**, as an accepted risk for the duration of this emergency. That is
a decision taken with eyes open, not an oversight, and it is written down so it can be
revisited rather than discovered. The submission page states plainly what happens to
the number; it does not ask permission.

### What still holds

- **Nothing individual is public.** Not the phone, not the matrícula, not the
  coordinates, not the free-text note. The public sees household counts per zone.
  A public map of pins reading "nobody has power here" is a map of empty houses, and
  we do not publish one.
- **Scope is enforced in Postgres.** An electricity utility cannot read water reports.
  If you change who may see what, change the policy — don't filter in a component.
- **The submitter's IP is never stored.** Both submission paths keep a salted SHA-256
  prefix (`REPORT_HASH_SALT`) purely so repeat abuse can be spotted; it is not
  reversible and not linked to identity.

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

## Rule 9 — An outbound link is a claim

`/enlaces` sends people to sites we do not control, which makes each row a
statement: *this site exists, it does what we say, and X operates it.* So a link
carries the same apparatus as anything else we publish.

`links.operator` is **not nullable**. If we cannot say who runs a destination, we
have not checked it well enough to send anyone there. `links.source` separates an
official channel from a citizen-run one, and the UI renders a non-official
source as an explicit **"No es un canal oficial"** badge rather than leaving the
reader to infer it.

**Verify the destination by hand before adding a row.** Open it, confirm the
operator, confirm it does what the description says. A forwarded URL is not a
source, and `verified` defaults to `false`.

### Why the domain is printed on the card

Every row shows its bare hostname in mono, next to the operator. Lookalike
domains and donation scams follow disasters reliably, and a reader who can
compare `colombiatebusca.com` against what loads in the address bar can catch
one we haven't. It also survives a screenshot, which is how most of these links
actually travel.

The page says out loud that verifying an operator is not the same as vouching
for a page's contents. We checked who runs it on the day we added it. That is
the whole claim, and the notice at the top of the page says so.

---

## Rule 10 — If we amplify it, we disclose our interest in it

Rule 9 governs a row in a list. This rule governs the harder case: when the
site stops merely listing a destination and starts **recommending** one.

[`/donar`](../src/app/donar/page.tsx) recommends a specific donation campaign,
and every donate CTA on the site routes through it rather than straight out.
That is deliberate — it is the one page where a reader can see, before leaving,
what we verified, what is only the campaign's claim, and who we are to be
saying so.

Three things are non-negotiable on any page that recommends rather than lists:

1. **Our findings and their claims are visibly separate.** `/donar` renders
   them in three different containers — verified findings as bordered cards
   with a source line, the campaign's own assertions as quoted blocks, open
   questions as dashed boxes. A reader skimming must be able to tell which is
   which without reading the headings. Merging them into one confident block
   is the failure this whole document exists to prevent.
2. **A financial or personal interest is declared on the page itself**, in the
   body, not a footnote — the site operator holds an investment stake in Vaki,
   and `/donar` says so at full size. A reader who learns it somewhere else
   has been misled by omission, and that costs more credibility than any
   recommendation can buy back.

   **This is the one thing on `/donar` that may not be collapsed.** The
   verification dossier — findings, claims, gaps — now sits behind a
   `<details>` labelled "¿Por qué deberías confiar en esto?", because a page
   that argues before it acts serves nobody. That was a legitimate trade.
   Putting the declaration of interest in there too would not be: a disclosure
   behind a disclosure is a footnote with extra steps, which is exactly what
   this clause forbids. It renders between the donate plate and the trust
   panel, so someone who never expands anything has still read it.

   Note that collapsing the dossier does not weaken requirement 1. Inside the
   panel the three containers are still three containers.
3. **It is never the only option offered.** `/donar` closes by pointing at
   `/enlaces`, where the official channels sit. A donation page with exactly
   one destination is an advertisement.

### No superlatives

We do not publish "the most trustworthy option", "funds routed the best
possible way", or any similar claim, however sincerely believed — they cannot
be sourced, and Rule 3 applies to a recommendation exactly as it applies to a
status card. The sourced version is also simply more persuasive: "raised USD
$11M from ~500,000 people, on its own domain, processed by Stripe" survives a
sceptical reader, and "most trustworthy" does not.

**Say what is missing, too.** `/donar` states that the EIN is unpublished, that
no disbursement report exists yet, and that fees are not disclosed. None of
those means anything is wrong. Listing them is what makes the verified column
worth reading — and it is the same instinct as Rule 1: the honest gap beats
the confident guess.

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
Roja's official system, which is the first entry on
[`/enlaces`](../src/app/enlaces/page.tsx). Do not publish the name.

That page also lists a **citizen-run** registry, badged as not an official
channel. Both belong there: the official system is authoritative and the
community one is where people are actually posting. Ordering the official
channel first, and labelling the other, is what keeps offering both honest.

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
