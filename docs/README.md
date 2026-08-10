# Documentation

Sismo Pereira — crisis information platform built after the M7.4 earthquake of
10 August 2026.

Start with the root [`README.md`](../README.md) for what the project is and how to
run it. These documents go deeper, and each is written for a specific reader.

| Document | Read it if you are… |
|---|---|
| [EDITORIAL.md](./EDITORIAL.md) | **Moderating, writing, or reviewing content.** The rules about what we publish and what we refuse to publish, with the judgment calls worked through. The most important document here. |
| [RUNBOOK.md](./RUNBOOK.md) | **Operating the site during an incident.** Moderating the queue, publishing an update, onboarding a partner, and what to do when something breaks. |
| [PARTNER-API.md](./PARTNER-API.md) | **A utility, telco, or agency integrating with us.** Self-contained: safe to send to someone outside the project. |
| [SUPABASE.md](./SUPABASE.md) | **Working on the database, auth, or permissions.** Schema, the RLS trust model, and the provisioning steps that are still pending. |
| [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) | **Touching hosting, DNS, or the domain.** Includes the failure modes we already hit, so you don't rediscover them. |
| [DECISIONS.md](./DECISIONS.md) | **Wondering why something is the way it is** — including the things we deliberately chose *not* to build. |

For coding agents, [`../CLAUDE.md`](../CLAUDE.md) is the entry point; it carries the
invariants and links back here for detail.

## Current state

The site is live at **https://sismopereira.org** and serves content, but it is
**read-only in practice**: Supabase is not provisioned, so report submission,
moderation, and partner ingestion do not work yet. Everything falls back to seed
content and shows a visible "showing fallback information" banner.

Two things block real use, and both are decisions rather than code:

1. **Provision Supabase** — see [SUPABASE.md](./SUPABASE.md).
2. **Name 2–3 moderators** — see [RUNBOOK.md](./RUNBOOK.md). A moderation queue
   nobody drains is worse than no submissions at all, because the site implies
   somebody is checking.

## A note on tone

This project was built quickly, during a real emergency, and these documents try to
be honest about that: what is finished, what is stubbed, what was deliberately left
out, and what we got wrong on the way. If you find something here that is no longer
true, fixing it is a contribution.
