# WhatsApp channel

**Audience:** anyone wiring up, operating, or changing the WhatsApp integration.

WhatsApp is how Pereira actually communicates. A web form reaches people who
already found the site; a WhatsApp number reaches the person forwarding a
photo of a cracked wall to their family group. This channel exists to put that
person's message in front of a moderator, and to answer the handful of
questions the site already answers, in the app they are already in.

Read [EDITORIAL.md](./EDITORIAL.md) first. Everything below is an
implementation of those rules, not an exception to them.

---

## What it does

**Inbound.** Someone messages the number. The message is stored, and then:

* a recognised keyword (`ESTADO`, `AGUA`, `ALBERGUES`, …) is answered from the
  same `src/lib/data.ts` helpers the website renders from, so a reply and the
  site can never disagree;
* anything else is filed into the **existing** `reports` queue with
  `status = 'pending'`, and the sender is told a moderator will review it.

**Outbound.** A moderator can reply in free text inside WhatsApp's 24-hour
window, and can broadcast an already-published update to people who explicitly
opted in with `ALERTAS`.

That is the whole product surface. It is deliberately small — see
[Why there is no chatbot](#why-there-is-no-chatbot).

---

## Credentials: this is ProCarmelita's phone number

The integration reuses the Meta WhatsApp Business account already verified for
**ProCarmelita** (`/Users/togume/Projects/ProCarmelita/procarmelita.com`). That
was the point: Meta's business verification and template review take days, and
an earthquake response does not have days.

It also means **this project does not own the number**, and three consequences
follow from that. They are the most important thing in this document.

### 1. A Meta app has one webhook URL

Meta delivers `messages` webhooks to a single callback URL per app. ProCarmelita
already points that URL at its own `/api/webhooks/whatsapp`. Repointing it at
`sismopereira.org` would silently break ProCarmelita's OTP and admin messaging.

Three ways out, best first:

| Option | What you do | Trade-off |
|---|---|---|
| **A — second phone number on the same WABA** *(recommended)* | Add a new number to the existing WhatsApp Business Account, and a second Meta app subscribed to that WABA whose callback URL is ours. | Inherits the existing business verification, so no re-review. Each project gets its own number, own app secret, own audience. Costs a phone line. |
| **B — second app, shared number** | Subscribe a second Meta app to the same WABA via `POST /{waba-id}/subscribed_apps`, pointing at us. | No new phone line, but **both projects receive every message**, and one number serves two unrelated audiences. Multi-app subscription must be confirmed to work on this WABA before relying on it. |
| **C — relay from ProCarmelita** | ProCarmelita's webhook forwards the raw body and the `x-hub-signature-256` header verbatim to our endpoint. | Works today with no Meta changes, because both apps share an app secret so our signature check passes on the forwarded bytes. But ProCarmelita's uptime becomes ours, and it needs a code change in that repo. |

**Whichever you pick, the routing guard is already in place.** The webhook
compares `value.metadata.phone_number_id` against
`WHATSAPP_CLOUD_PHONE_NUMBER_ID` and ignores anything addressed to a different
number — so option A is safe by construction and option C cannot leak
ProCarmelita's traffic into the earthquake moderation queue.

Under option B the two projects share one number and the guard cannot help,
because there is only one `phone_number_id`. Do not ship B without deciding
what a ProCarmelita resident asking about their water bill should see when the
sismo bot answers them.

### 2. Reputation is shared

Meta rates the number's quality from user blocks and reports. A broadcast that
annoys people degrades the *same* number ProCarmelita depends on for login
OTPs. That is why broadcasting is opt-in only, requires an approved template,
and is chunked with a delay — see [Broadcasting](#broadcasting).

### 3. Message limits are shared

The number's daily conversation tier is shared across both projects. A large
broadcast can exhaust it.

---

## Environment

`.env*` is gitignored in this repo, including `.env.example`, so this table is
the canonical list. Copy the block below into `.env.local`, and set the same
values in Vercel for production.

```bash
# --- WhatsApp Cloud API (Meta) --------------------------------------------
# Reused from the ProCarmelita Business account. The site runs fine without
# any of these; the channel simply reports itself as unconfigured.

# Permanent System User token with whatsapp_business_messaging.
WHATSAPP_CLOUD_API_TOKEN=
# The phone number ID that belongs to THIS project. Also acts as the routing
# filter: webhook traffic for any other number on the WABA is ignored.
WHATSAPP_CLOUD_PHONE_NUMBER_ID=
# WABA id. Only needed to list approved templates in the admin UI.
WHATSAPP_CLOUD_BUSINESS_ID=

# Meta app secret — validates the X-Hub-Signature-256 on every inbound
# webhook. Without it the endpoint refuses traffic; it does not run unsigned.
WHATSAPP_APP_SECRET=
# Any long random string. Enter the same value in the Meta webhook config.
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# Approved template used for broadcasts. Unset = broadcasting is off.
WHATSAPP_BROADCAST_TEMPLATE=
WHATSAPP_BROADCAST_TEMPLATE_LANG=es

# Optional. Defaults to v21.0, matching the ProCarmelita integration.
WHATSAPP_GRAPH_VERSION=v21.0
```

`WHATSAPP_CLOUD_API_TOKEN`, `..._PHONE_NUMBER_ID` and `..._BUSINESS_ID` are in
ProCarmelita's `.env`. `WHATSAPP_APP_SECRET` and
`WHATSAPP_WEBHOOK_VERIFY_TOKEN` are **not** in that file — they live only in
ProCarmelita's Vercel project. Pull them with `vercel env pull` from there, or
read them from the Meta App dashboard.

**All five of the first block are required together.** `getWhatsAppConfig()`
returns `null` unless every one is present, and half-configured is treated as
unconfigured on purpose: an endpoint that cannot verify a signature must not
accept messages that write to the moderation queue.

---

## Wiring it up

1. Set the environment variables above and deploy.
2. In the Meta App dashboard → WhatsApp → Configuration → Webhook:
   * **Callback URL:** `https://sismopereira.org/api/webhooks/whatsapp`
   * **Verify token:** the value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   * Subscribe to the **`messages`** field.
3. Meta immediately `GET`s the callback with `hub.challenge`. A 200 echoing the
   challenge means it worked; a 403 means the verify token does not match, and
   a 503 means the environment variables are not live yet.
4. Apply the migration: `supabase db push` (or `supabase db reset` locally).
5. Message the number the word `AYUDA`. You should get the menu back, and the
   thread should appear at `/admin/whatsapp`.

### Testing locally

Meta cannot reach `localhost`. Either point a tunnel at your dev server and use
a **separate** Meta app for it, or exercise the handler directly — the
signature is over the raw body:

```bash
BODY='{"object":"whatsapp_business_account","entry":[{"changes":[{"field":"messages","value":{"metadata":{"phone_number_id":"YOUR_ID"},"contacts":[{"wa_id":"573001112233","profile":{"name":"Prueba"}}],"messages":[{"from":"573001112233","id":"wamid.test1","timestamp":"1786000000","type":"text","text":{"body":"ESTADO"}}]}}]}]}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WHATSAPP_APP_SECRET" -hex | sed 's/^.* //')
curl -sS localhost:3000/api/webhooks/whatsapp \
  -H "content-type: application/json" \
  -H "x-hub-signature-256: sha256=$SIG" \
  -d "$BODY"
```

The response counts outcomes rather than deliveries: `handled`, `duplicates`,
`failed`, `statuses`, `ignored`. A first delivery returns `"handled":1`.

Reuse the same `wamid.test1` to confirm deduplication: the second call must
report `"handled":0,"duplicates":1` and must not send a second reply.

**A non-200 is deliberate.** If any message in the batch could not be stored,
the endpoint answers `503` with `"failed"` non-zero so Meta redelivers.
Acknowledging a message we failed to persist would drop a crisis report
permanently; redelivery is safe because the UNIQUE `wa_message_id` makes
re-ingesting the successful ones a no-op.

---

## The 24-hour service window

Meta only accepts **free-form** messages within 24 hours of the person's last
inbound message. Outside that window, only approved templates deliver.

This is modelled explicitly rather than discovered from a Graph error:

* `whatsapp_contacts.last_inbound_at` is maintained by a database trigger.
* `whatsapp_threads.window_open` exposes it to the inbox.
* `isWithinServiceWindow()` gates `replyToThread`, which refuses with an
  explanation instead of letting the send fail.

A moderator seeing **"Ventana cerrada"** is seeing a WhatsApp rule, not a bug.
The person has to write again to reopen it.

---

## Inbound routing

`src/lib/whatsapp/commands.ts` matches the **whole normalised message** against
a closed keyword list. It is not fuzzy and not substring-based, and that is a
deliberate safety property:

> `agua` → the water bulletin.
> `no hay agua en la 30 desde anoche` → a report for a human to read.

Anyone typing a sentence is telling us something we do not already know, and
answering them with a canned bulletin would both lose the report and imply we
had understood it.

Messages filed as reports are inserted with `category = 'other'` — a moderator
reads the text and categorises it. Guessing the category from keywords is the
same class of inference [Rule 1](./EDITORIAL.md#rule-1--unknown-is-a-first-class-status)
forbids: it makes an unverified message look like structured, verified data.

Messages shorter than 10 characters are **not** filed, because
`reports.description` has a `CHECK (char_length between 10 and 4000)`
constraint. The sender is asked for more detail rather than having their
message padded to fit.

### Every automated reply carries a disclaimer

> ⚠️ Esto no es una línea de emergencia. Si hay riesgo para la vida, llama al **123**.

On every single message, not just the first. People treat any WhatsApp number
that answers instantly as an emergency line, and this one is answered by
volunteer moderators when they are awake.

---

## Media

Inbound images, documents, audio and video are **referenced, not downloaded**.
The transcript records Meta's media id, MIME type and filename; the bytes stay
on Meta's CDN.

This is a deliberate difference from ProCarmelita, which mirrors media into
Supabase Storage because it needs payment proofs for accounting. Here the
trade-off runs the other way:

* photos sent to a disaster line contain people, homes, injuries and documents,
  and storing them creates a liability this project has no process to manage;
* Rule 4 keeps identifying data out of the site, and an image is identifying
  data;
* media ids expire, which is a real limitation — **a moderator who needs to see
  a photo must open the thread in WhatsApp itself.**

If mirroring is ever added, it needs a retention policy and a bucket that is
not public, decided before the code is written.

---

## Broadcasting

`/admin/whatsapp/difusion`. Constraints, and why:

* **Templates only.** Recipients are outside the 24-hour window by definition.
  Without `WHATSAPP_BROADCAST_TEMPLATE` the page says broadcasting is off
  rather than sending something that would fail for everyone.
* **Opt-in only.** `subscription = 'subscribed'`, set when someone sends
  `ALERTAS`. Never "everyone who has ever messaged us".
* **Published updates only.** The composer picks an existing published update
  and sends its title and URL. There is no free-text box, because a broadcast
  at scale should only ever carry something that already cleared the
  publishing bar.
* **Chunked and resumable.** 200 recipients per invocation, ~120 ms apart.
  Progress is recorded per recipient via `whatsapp_messages.broadcast_id`, so
  a timeout resumes instead of restarting, and nobody is messaged twice.
* **Failures are not retried automatically.** A number Meta rejected once will
  be rejected again; retrying burns the shared number's reputation. Failures
  are visible in the transcript.

### The template

Create it in WhatsApp Manager under category **UTILITY** with two body
variables:

```
{{1}}

Más detalle: {{2}}

Responde SALIR para dejar de recibir estos avisos.
```

`{{1}}` is the update title, `{{2}}` its URL. Marketing-category templates are
throttled harder and are the wrong classification for emergency information.

---

## Data model

Three tables, all moderators-only. See
`supabase/migrations/20260811130000_whatsapp.sql`.

| Table | Holds |
|---|---|
| `whatsapp_contacts` | One row per phone number. Subscription state, language, the 24h window clock, block flag. |
| `whatsapp_messages` | The full transcript, both directions. `wa_message_id` is UNIQUE — that constraint is the idempotency key for Meta's webhook retries. |
| `whatsapp_broadcasts` | One row per fan-out, with per-chunk progress. |

`whatsapp_threads` is the inbox view. It is declared
`WITH (security_invoker = true)`, which is **not** cosmetic: a normal Postgres
view runs with its owner's rights and bypasses RLS on the tables beneath it —
that is exactly how `public_reports` strips PII. Here we need the opposite, so
the view inherits `whatsapp_contacts_moderator_all` and a non-moderator session
reads an empty inbox instead of every phone number the project holds.

Nothing in this file is granted to `anon`.

### New tables need an explicit `service_role` GRANT

`supabase/config.toml` leaves `auto_expose_new_tables` unset, which is the new
cloud default: entities created after that point are **not** reachable through
the Data API roles without a `GRANT` — and that includes `service_role`.

This does not fail the migration. It fails at runtime, with `42501 permission
denied`, on every webhook write — which before this was caught meant inbound
crisis reports being accepted with a 200 and never stored. The migration
therefore grants `service_role` explicitly on all three tables plus `reports`.

**Any future migration adding a table the webhook or the partner API touches
must do the same.** It is worth checking whether the pre-existing tables
(`service_status`, `updates`) carry those grants in production, since
`api/v1/*` writes to them the same way.

### Why the webhook uses the service role

`getServiceSupabase()` bypasses RLS, and its doc comment says it is for partner
API-key ingestion. The webhook is the second case, for the same reason: the
caller is Meta, a machine with no Supabase session, so there is no RLS identity
to lean on. Every write is scoped explicitly by `wa_id`, and `store.ts` must
never be imported into anything reachable from a browser.

---

## Why there is no chatbot

The obvious next step is to put an LLM behind the number and let it answer
anything. Do not.

Every rule in [EDITORIAL.md](./EDITORIAL.md) exists to stop this site from
producing plausible-sounding crisis information that nobody verified, and a
language model answering "¿hay paso por la vía Armenia?" from context is
precisely that failure with better grammar. The keyword router can only return
data that is already published, and its worst failure mode is being unhelpful
and filing a report — which is what a human should see anyway.

If a model is ever used here, the safe shape is **triage, not answers**:
suggesting a category to a moderator inside `/admin`, where a person still
decides. That is a change to the moderation UI, not to the reply path.

---

## Operating it

Day-to-day moderation is in [RUNBOOK.md](./RUNBOOK.md). The short version:

* `/admin/whatsapp` is the inbox. Bold rows are unread.
* Opening a thread marks it read.
* Reports filed from WhatsApp appear in the normal queue at `/admin`, with the
  sender's number in the moderator-only contact field. **It is never published.**
* Blocking a number stops all replies, automated and manual, and keeps the
  transcript.

### When something breaks

| Symptom | Cause |
|---|---|
| Meta webhook config rejects the URL | `WHATSAPP_WEBHOOK_VERIFY_TOKEN` mismatch, or the env is not deployed yet (endpoint returns 503). |
| Messages arrive but nothing is stored | `SUPABASE_SERVICE_ROLE_KEY` missing — the webhook cannot write. Check the function logs for `[whatsapp/store]`. |
| Everything logs `invalid signature` | `WHATSAPP_APP_SECRET` belongs to a different Meta app than the one delivering. |
| Replies never arrive | Token expired, or the recipient is outside the 24-hour window. Check `error_detail` on the outbound row. |
| The same reply is sent twice | Should be impossible — the UNIQUE on `wa_message_id` gates it. If it happens, the row was deleted between deliveries. |
| ProCarmelita traffic in our queue | The `phone_number_id` guard is off because `WHATSAPP_CLOUD_PHONE_NUMBER_ID` is unset, or both projects genuinely share one number (option B). |
