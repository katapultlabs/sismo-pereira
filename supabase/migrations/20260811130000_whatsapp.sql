-- =============================================================================
-- Sismo Pereira — WhatsApp channel
--
-- Two-way messaging over the Meta WhatsApp Cloud API, reusing the Business
-- number already verified for ProCarmelita.
--
-- Trust model — this is the part that matters:
--   * A WhatsApp id IS a phone number. It is PII under
--     `docs/EDITORIAL.md` Rule 4, so NOTHING in this file is granted to
--     `anon`, and no public view exposes it. Moderators only, enforced by RLS.
--   * Inbound free text becomes a `reports` row with `status = 'pending'`,
--     so the existing moderation gate (Rule 5) applies unchanged. WhatsApp is
--     a new front door onto the same queue, not a bypass around it.
--   * Outbound broadcasts only ever go to contacts who explicitly opted in.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type whatsapp_direction as enum ('inbound', 'outbound');

-- Mirrors Meta's status webhook, plus the two states Meta never sends us:
-- 'received' for anything inbound, 'queued' for an outbound row written
-- before the Graph call returns.
create type whatsapp_delivery as enum (
  'queued', 'sent', 'delivered', 'read', 'failed', 'received'
);

create type whatsapp_subscription as enum (
  'none', 'subscribed', 'unsubscribed', 'blocked'
);

create type whatsapp_broadcast_status as enum (
  'draft', 'sending', 'sent', 'partial', 'failed'
);

-- ---------------------------------------------------------------------------
-- Contacts — one row per phone number that has ever talked to us
-- ---------------------------------------------------------------------------
create table whatsapp_contacts (
  id             uuid primary key default gen_random_uuid(),
  -- Exactly as Meta sends it: digits, no '+', country code included.
  wa_id          text not null unique check (wa_id ~ '^[0-9]{6,20}$'),
  -- Convenience projection for matching against `reports.contact_phone`.
  phone_e164     text generated always as ('+' || wa_id) stored,
  display_name   text,
  lang           text not null default 'es' check (lang in ('es', 'en')),
  zone_slug      text references zones (slug) on delete set null,

  subscription   whatsapp_subscription not null default 'none',
  subscribed_at    timestamptz,
  unsubscribed_at  timestamptz,

  -- The 24-hour customer-service window is measured from the last inbound
  -- message. Outside it Meta only accepts approved templates, so this column
  -- decides whether a moderator may reply in free text at all.
  last_inbound_at  timestamptz,
  last_outbound_at timestamptz,
  inbound_count    integer not null default 0,
  unread_count     integer not null default 0,

  -- Set by a moderator to stop all automated replies to a number.
  blocked        boolean not null default false,
  moderator_note text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index whatsapp_contacts_inbox_idx
  on whatsapp_contacts (last_inbound_at desc nulls last);
create index whatsapp_contacts_subscribed_idx
  on whatsapp_contacts (zone_slug) where subscription = 'subscribed';

comment on table whatsapp_contacts is
  'People who have messaged the WhatsApp line. Phone numbers are PII: moderators only.';
comment on column whatsapp_contacts.last_inbound_at is
  'Start of the Meta 24h service window. Free-form replies are only valid inside it.';

-- ---------------------------------------------------------------------------
-- Broadcasts — one published update fanned out to opted-in subscribers
-- ---------------------------------------------------------------------------
create table whatsapp_broadcasts (
  id              uuid primary key default gen_random_uuid(),
  update_id       uuid references updates (id) on delete set null,
  -- Broadcasts are ALWAYS templates: recipients are, by definition, outside
  -- the 24h window. The template must already be approved in WhatsApp Manager.
  template_name   text not null,
  template_lang   text not null default 'es',
  -- What the template's variables were filled with, kept so the sent text is
  -- auditable after the fact even though Meta renders it from the template.
  template_params text[] not null default '{}',
  body_preview    text not null,
  -- Audience filter, e.g. {"zone_slug": "cuba", "lang": "es"}.
  audience        jsonb not null default '{}'::jsonb,

  status          whatsapp_broadcast_status not null default 'draft',
  recipient_count integer not null default 0,
  sent_count      integer not null default 0,
  failed_count    integer not null default 0,

  created_by      uuid references profiles (id) on delete set null,
  started_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index whatsapp_broadcasts_recent_idx on whatsapp_broadcasts (created_at desc);

-- ---------------------------------------------------------------------------
-- Messages — the full transcript, both directions
-- ---------------------------------------------------------------------------
create table whatsapp_messages (
  id            uuid primary key default gen_random_uuid(),
  contact_id    uuid not null references whatsapp_contacts (id) on delete cascade,
  -- Meta's `wamid.…`. UNIQUE is load-bearing: Meta retries a webhook until it
  -- gets a 200, so this constraint is what makes ingestion idempotent.
  wa_message_id text unique,
  direction     whatsapp_direction not null,
  message_type  text not null default 'text',
  body          text,

  -- Media is referenced, never downloaded here. See docs/WHATSAPP.md.
  media_id       text,
  media_mime     text,
  media_filename text,

  template_name text,
  delivery      whatsapp_delivery not null default 'received',
  error_detail  text,

  -- Set when an inbound message was filed into the moderation queue.
  report_id     uuid references reports (id) on delete set null,
  broadcast_id  uuid references whatsapp_broadcasts (id) on delete set null,
  -- Whether an automated reply was generated for this inbound message, and
  -- which command matched. Null for outbound rows.
  handled_as    text,

  raw           jsonb,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index whatsapp_messages_thread_idx
  on whatsapp_messages (contact_id, occurred_at desc);

-- One row per (broadcast, recipient). This is not bookkeeping: it is how a
-- recipient is *claimed*. The sender inserts this row BEFORE calling Meta, so
-- two concurrent chunks race on the index instead of both sending, and a
-- crash between send and transcript-write cannot re-queue someone who has
-- already been messaged. Partial, because ordinary conversation rows have a
-- null broadcast_id.
create unique index whatsapp_messages_broadcast_recipient_uniq
  on whatsapp_messages (broadcast_id, contact_id)
  where broadcast_id is not null;
create index whatsapp_messages_report_idx
  on whatsapp_messages (report_id) where report_id is not null;
create index whatsapp_messages_broadcast_idx
  on whatsapp_messages (broadcast_id) where broadcast_id is not null;

comment on column whatsapp_messages.wa_message_id is
  'Meta message id. UNIQUE — this is the idempotency key for webhook retries.';

-- ---------------------------------------------------------------------------
-- Keep contact counters honest without a round trip from the application
-- ---------------------------------------------------------------------------
create or replace function whatsapp_touch_contact()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.direction = 'inbound' then
    update whatsapp_contacts
       set last_inbound_at = greatest(coalesce(last_inbound_at, new.occurred_at), new.occurred_at),
           inbound_count   = inbound_count + 1,
           unread_count    = unread_count + 1,
           updated_at      = now()
     where id = new.contact_id;
  else
    update whatsapp_contacts
       set last_outbound_at = greatest(coalesce(last_outbound_at, new.occurred_at), new.occurred_at),
           updated_at       = now()
     where id = new.contact_id;
  end if;
  return new;
end;
$$;

create trigger whatsapp_messages_touch_contact
  after insert on whatsapp_messages
  for each row execute function whatsapp_touch_contact();

create trigger whatsapp_contacts_touch before update on whatsapp_contacts
  for each row execute function touch_updated_at();
create trigger whatsapp_broadcasts_touch before update on whatsapp_broadcasts
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Moderator inbox view — thread list with the last message inlined
-- ---------------------------------------------------------------------------
--
-- `security_invoker` is load-bearing, not boilerplate. A normal view runs with
-- its OWNER's rights and silently bypasses RLS on the tables beneath it —
-- which is exactly why `public_reports` and `public_organizations` exist in
-- the initial schema. Here we want the opposite: this view carries phone
-- numbers, so it must be evaluated as the caller and inherit
-- `whatsapp_contacts_moderator_all`. Without this clause, every signed-in
-- user could read the whole inbox.
create view whatsapp_threads with (security_invoker = true) as
select
  c.id, c.wa_id, c.phone_e164, c.display_name, c.lang, c.zone_slug,
  c.subscription, c.blocked, c.unread_count, c.inbound_count,
  c.last_inbound_at, c.last_outbound_at, c.moderator_note, c.created_at,
  -- Meta's 24h customer-service window: outside it, only templates send.
  (c.last_inbound_at is not null and c.last_inbound_at > now() - interval '24 hours')
    as window_open,
  m.body        as last_body,
  m.direction   as last_direction,
  m.occurred_at as last_at
from whatsapp_contacts c
left join lateral (
  select body, direction, occurred_at
  from whatsapp_messages
  where contact_id = c.id
  order by occurred_at desc
  limit 1
) m on true;

comment on view whatsapp_threads is
  'Moderator inbox. Contains phone numbers — never grant this to anon.';

-- ---------------------------------------------------------------------------
-- Row Level Security — moderators only, all three tables
-- ---------------------------------------------------------------------------
alter table whatsapp_contacts   enable row level security;
alter table whatsapp_messages   enable row level security;
alter table whatsapp_broadcasts enable row level security;

create policy whatsapp_contacts_moderator_all on whatsapp_contacts
  for all using (is_moderator()) with check (is_moderator());
create policy whatsapp_messages_moderator_all on whatsapp_messages
  for all using (is_moderator()) with check (is_moderator());
create policy whatsapp_broadcasts_moderator_all on whatsapp_broadcasts
  for all using (is_moderator()) with check (is_moderator());

-- ---------------------------------------------------------------------------
-- Grants
--
-- `anon` gets nothing at all here — not even on the view. Webhook ingestion
-- runs with the service role (the caller is Meta, not a signed-in user), and
-- the moderator UI runs as an authenticated user under the policies above.
--
-- `service_role` MUST be granted explicitly. `supabase/config.toml` leaves
-- `auto_expose_new_tables` unset, which is the new cloud default: entities
-- created after that point are NOT reachable through the Data API roles
-- without a GRANT — service_role included. Omitting these lines does not fail
-- the migration; it fails every webhook write at runtime with 42501, which is
-- how a crisis report gets silently dropped.
-- ---------------------------------------------------------------------------
revoke all on whatsapp_contacts   from anon, authenticated;
revoke all on whatsapp_messages   from anon, authenticated;
revoke all on whatsapp_broadcasts from anon, authenticated;

grant select, insert, update on whatsapp_contacts   to authenticated;
grant select, insert, update on whatsapp_messages   to authenticated;
grant select, insert, update on whatsapp_broadcasts to authenticated;
grant select on whatsapp_threads to authenticated;

grant select, insert, update, delete on whatsapp_contacts   to service_role;
grant select, insert, update, delete on whatsapp_messages   to service_role;
grant select, insert, update, delete on whatsapp_broadcasts to service_role;
grant select on whatsapp_threads to service_role;

-- The webhook also files inbound messages into the community moderation queue,
-- and reads zones/links/status to compose replies. Same reasoning as above.
grant select, insert, update on reports to service_role;

-- ---------------------------------------------------------------------------
-- Realtime — the moderator inbox subscribes to incoming messages
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table whatsapp_messages;
