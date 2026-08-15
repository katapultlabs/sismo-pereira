# Documentation

AquíAyuda Pereira (formerly Sismo Pereira) — crisis information platform built
after the M7.4 earthquake of 10 August 2026.

Start with the root [`README.md`](../README.md) for what the project is and how to
run it. These documents go deeper, and each is written for a specific reader.

| Document | Read it if you are… |
|---|---|
| [EDITORIAL.md](./EDITORIAL.md) | **Moderating, writing, or reviewing content.** The rules about what we publish and what we refuse to publish, with the judgment calls worked through. The most important document here. |
| [RUNBOOK.md](./RUNBOOK.md) | **Operating the site during an incident.** Moderating the queue, publishing an update, onboarding a partner, and what to do when something breaks. |
| [PARTNER-API.md](./PARTNER-API.md) | **A utility, telco, or agency integrating with us.** Self-contained: safe to send to someone outside the project. |
| [SUPABASE.md](./SUPABASE.md) | **Working on the database, auth, or permissions.** Schema, the RLS trust model, and the provisioning steps that are still pending. |
| [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) | **Shipping a change, or touching hosting, DNS, or the domain.** Branches, deploys, and rollback — plus the failure modes we already hit, so you don't rediscover them. |
| [DECISIONS.md](./DECISIONS.md) | **Wondering why something is the way it is** — including the things we deliberately chose *not* to build. |

For coding agents, [`../CLAUDE.md`](../CLAUDE.md) is the entry point; it carries the
invariants and links back here for detail.

## Current state

The site is live at **https://sismopereira.org** and **production reads a live
Supabase** — the "mostrando información de respaldo" banner does not appear there,
and pages serve rows that exist only in the database.

**Local development is the opposite.** The site runs with no `.env.local` at all and
every read falls back to `src/lib/fallback-data.ts`. This is deliberate — it is what
makes the site survivable when our own infrastructure is not — but it is also the
most expensive misunderstanding available here:

> Editing `supabase/seed.sql` or `src/lib/fallback-data.ts` changes what a developer
> sees and what a fresh `supabase db reset` produces. It does **not** change
> production. Shipping content that way looks correct locally, passes `pnpm build`,
> deploys green, and changes nothing on the live site.

To publish, write to the live database — see
[RUNBOOK.md](./RUNBOOK.md#publishing-an-update). The exception is hardcoded
components (the emergency lines, the medical closures, the donation drive), which
reach production through a deploy on purpose, so that they survive a degraded read.

**The open item is people, not code:** naming 2–3 moderators — see
[RUNBOOK.md](./RUNBOOK.md). A moderation queue nobody drains is worse than no
submissions at all, because the site implies somebody is checking.

## A note on tone

This project was built quickly, during a real emergency, and these documents try to
be honest about that: what is finished, what is stubbed, what was deliberately left
out, and what we got wrong on the way. If you find something here that is no longer
true, fixing it is a contribution.
