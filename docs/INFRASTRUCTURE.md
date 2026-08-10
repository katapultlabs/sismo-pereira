# Infrastructure

**Audience:** anyone touching hosting, DNS, the domain, or deployments.

The second half of this document records failures we already worked through. Read it
before debugging anything DNS-shaped — most of an afternoon is written down here.

---

## Where things live

| | |
|---|---|
| **Repository** | `katapultlabs/sismo-pereira` (public) |
| **Hosting** | Vercel — team **Katapult**, scope slug `katapult-8b361435`, project `sismo-pereira` |
| **Domain** | `sismopereira.org`, registered 2026-08-10 |
| **Registrar + DNS** | Cloudflare, under the **Katapult Labs** account |
| **Live** | https://sismopereira.org |

---

## DNS

Two records, both **DNS only** (grey cloud):

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `@` | `76.76.21.21` | **DNS only** |
| CNAME | `www` | `cname.vercel-dns.com` | **DNS only** |

### Do not enable the Cloudflare proxy on these records

Cloudflare's dashboard actively nags: *"Proxying is required for most security and
performance features."* Ignore it. Orange-clouding these records breaks Vercel's TLS
challenge and produces redirect loops or certificate errors.

If you later want Cloudflare's WAF in front of the site, that is a deliberate project:
set SSL mode to **Full (strict)** first, and expect to re-issue certificates.

### Do not move nameservers to Vercel

Vercel suggests `ns1/ns2.vercel-dns.com`. Don't. Cloudflare is the registrar, and
moving DNS there loses the free email routing and the WAF option.

### Newer Vercel records

Vercel's panel now recommends project-specific targets as it expands IP ranges:

| | Currently set | Vercel recommends |
|---|---|---|
| apex | `76.76.21.21` | `216.150.1.1` |
| www | `cname.vercel-dns.com` | `6c2abcbef5c75d25.vercel-dns-016.com` |

Vercel states plainly that **the legacy records continue to work**, and they do — both
certificates issued on them. Migrating is housekeeping, not a fix. Note the Vercel
*CLI* still prints the old `76.76.21.21` advice while the *dashboard* shows the new
records; the dashboard is the more current of the two.

---

## Branches and deploying

**`main` is production.** Pushing to it deploys, through the Vercel GitHub
integration. There is no PR gate, no CI, and no review queue — see
[DECISIONS.md](./DECISIONS.md#no-prs-no-ci-gate-main-deploys).

The whole path:

```bash
git switch -c fix-water-zone     # branch off main
# …work…
pnpm build                       # the only gate. It has to pass.
git switch main && git merge fix-water-zone && git push
```

That is it. You review your own work, you merge your own branch, you deploy.

**Branches are optional but cheap.** Push one and Vercel builds a preview URL for it
automatically — the fastest way to look at a change on a phone, or to send it to
someone in Pereira before it goes live. Delete the branch after merging.

**Worktrees** (`git worktree add`) are for running two changes side by side without
stashing — most useful when a coding agent is working on one thing while you edit
another. `.claude/worktrees/` is gitignored, so agent worktrees never show up in a
diff. Nothing else about the process changes; the branch still merges to `main` the
same way.

Never force-push `main`, and never commit `.env.local`.

### Deploying by hand

Only needed when you are deploying something that is not on `main` — a hotfix while
GitHub is down, or promoting a preview.

```bash
pnpm dlx vercel@latest deploy --prod --yes --scope katapult-8b361435
```

Use `pnpm dlx vercel@latest` rather than the globally installed `vercel`. The global
binary on at least one dev machine is stale (v50), and `pnpm add -g vercel@latest`
does not fix it because pnpm's global bin directory is not on `PATH` until `pnpm
setup` has been run. The stale CLI hangs on some non-interactive flows — notably
`vercel env add <NAME> preview --value … --yes`, which loops on a "which Git branch?"
prompt forever instead of defaulting to all preview branches.

### Rolling back

Faster than fixing forward, and usually right during an incident: promote the previous
good deployment from the Vercel dashboard (**Deployments → ⋯ → Promote to
Production**), then fix `main` at your own pace. `git revert` and push also works, but
it waits on a build.

---

## Environment variables

Managed with `vercel env`. See [`.env.example`](../.env.example) for the full list and
[SUPABASE.md](./SUPABASE.md#3-set-environment-variables) for what still needs setting.

| Variable | Set? | Notes |
|---|---|---|
| `REPORT_HASH_SALT` | ✅ all three envs | Salt for the one-way submitter fingerprint. Changing it resets abuse history. |
| `NEXT_PUBLIC_SITE_URL` | ✅ production | `https://sismopereira.org`. Drives `metadataBase`, canonical URLs, share cards. |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | **Server-only.** Bypasses RLS. Never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | ❌ | Optional. When unset the partners page links to the repo rather than inventing an address. |

---

## Known gaps

### Email authentication

`sismopereira.org` has **no SPF, DKIM, or DMARC records**. Anyone can send mail
appearing to come from the domain. For a site whose entire value proposition is being
the trustworthy source, a spoofed "official" email is uniquely damaging. Worth closing
before the URL is promoted — three TXT records.

Cloudflare Email Routing (free, already available in that account) would also give a
real `hola@sismopereira.org` forwarding to a monitored inbox, which is what
`NEXT_PUBLIC_CONTACT_EMAIL` is waiting on.

### www does not redirect to the apex

`www.sismopereira.org` serves the site independently rather than redirecting. Canonical
tags point at the apex so search engines consolidate, but a hard redirect would be
cleaner. Not done.

### No sitemap, robots.txt, or OG image

The discovery path for this site is someone googling *"sismo pereira energía"* or
pasting a link into WhatsApp. Today it shares as a blank card. This is arguably the
highest-value unfinished work after Supabase.

---

## Failure modes we already hit

Recorded so nobody re-debugs them.

### "Failed To Generate Cert" on a brand-new domain

**Symptom:** Vercel shows *Failed To Generate Cert*; expanding it gives
`DNS problem: NXDOMAIN looking up A for sismopereira.org`.

**Cause:** the domain was registered minutes earlier. `whois` showed correct
nameservers immediately, but the .org **zone** had not published the delegation yet.
Vercel attempted issuance, Let's Encrypt could not resolve the name, and the failure
latched.

**Fix:** wait for propagation, then hit Refresh **once**.

### Do not spam the Refresh button

Let's Encrypt rate-limits failed validations (**5 per hostname per hour**). Retrying
against a domain that still does not resolve burns the quota and makes the wait
*longer*. Vercel additionally greys out the Refresh buttons once you have used several
in quick succession.

Vercel retries issuance automatically — in the end that is what issued the apex
certificate, without any record change.

### Propagation is uneven, and "is it live?" is the wrong question

Mid-propagation we measured, simultaneously:

- **0 of 6** .org TLD servers returning the delegation from one vantage point
- Google `8.8.8.8` and OpenDNS resolving it correctly
- Cloudflare `1.1.1.1` and Quad9 returning nothing

TLD nameservers are anycast; different nodes pick up a new zone at different times.
Useful commands:

```bash
# Ground truth — the zone itself
dig +short sismopereira.org A @henrik.ns.cloudflare.com

# Is the registry publishing the delegation yet?
for ns in $(dig +short org NS | head -6); do
  dig +norecurse sismopereira.org NS @"$ns" | grep -o "status: [A-Z]*"
done

# What do public resolvers say?
for r in 8.8.8.8 1.1.1.1 9.9.9.9 208.67.222.222; do
  dig +short sismopereira.org A @"$r"
done
```

### Negative caching makes a working site look broken

Resolvers cache `NXDOMAIN` for the zone's negative TTL (**30 minutes** here). Every
lookup made *before* the domain resolved poisoned that resolver for half an hour
afterwards — so the site was serving correctly while `curl`, Cloudflare's own
`1.1.1.1`, and other networks still reported nothing.

**Diagnose the layer before reporting an outage.** `curl` returning `000` is ambiguous:

```bash
dig +short sismopereira.org A                    # does DNS resolve?
host sismopereira.org                            # does the SYSTEM resolver resolve?
curl --resolve sismopereira.org:443:76.76.21.21 https://sismopereira.org/es   # bypass DNS
echo | openssl s_client -connect 76.76.21.21:443 -servername sismopereira.org \
  | openssl x509 -noout -subject -issuer         # which cert is actually served?
```

That last one is the highest-signal check: it showed a valid certificate for
`CN=www.sismopereira.org` while the apex still had none, which pinned the problem
precisely when the dashboard label was ambiguous. `dig` and `host` can succeed while
`curl`'s `getaddrinfo` still fails — that is a local stub-resolver cache, not a site
outage.
