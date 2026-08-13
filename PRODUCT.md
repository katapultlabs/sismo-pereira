# Product

*This is the design brief: register, audience, personality, principles. It says what
the site should feel like. It deliberately does **not** restate the publishing rules
([docs/EDITORIAL.md](./docs/EDITORIAL.md), binding), the conventions and traps
([CLAUDE.md](./CLAUDE.md)), or the reasoning behind specific calls
([docs/DECISIONS.md](./docs/DECISIONS.md)) — duplicating those here guarantees they
drift apart. Link, don't copy.*

## Register

brand

*(The home landing is a brand surface — documentary, editorial, emotionally
credible. Inner routes — /servicios, /reportes, /reportar, admin — are product
surfaces: a civil-defence bulletin where design serves information. Override
register per task when working on inner pages.)*

## Users

People in Pereira, Risaralda, in the days after the M7.4 earthquake of
2026-08-10 — often on a phone, at night, during a blackout, on battery, on a
degraded connection. Secondary: diaspora and international responders (English
translation), press, and partner organizations publishing status. Their job:
get a trustworthy, timestamped answer to a small question (is there water, is
the hospital open, where do I donate) without being moved by rumour.

## Product Purpose

Be the boring, correct, timestamped answer during a disaster. The site
publishes verified service status, moderated community reports, and vetted
routes to help — and refuses to look more complete than what it actually
knows. The landing must also move people to act (donate, report, publish)
without sensationalism. Success: a reader leaves informed, grounded, and
knowing exactly what is confirmed versus unknown.

## Brand Personality

Calm, verified, documentary. The voice of a civil-defence bulletin with the
composure of a broadsheet: restrained, precise, humane. Emotionally impactful
through honesty (the stated gap, the sourced figure) rather than through
drama. Premium by discipline — type, rhythm, and instrument-grade data
presentation — never by decoration.

## Anti-references

- Playful/whimsical campaign sites (the units.gr tone): bright color-block
  cards, cartoon illustration, bouncy motion. We borrowed its *structure*
  only.
- Generic SaaS card UI: soft shadows, large radii, hero-metric templates.
- Disaster-porn news design: red banners, countdowns, sirens, urgency
  theatrics.
- Charity-marketing sentimentality: stock photos of crying children, guilt
  copy, inflated impact numbers.

## Design Principles

1. **Chroma is signal.** The chrome stays achromatic; saturated color is
   reserved for service status (and, on the landing only, the single ember
   accent). A reader scanning for red must find an outage, never decoration.
2. **The honest gap beats the confident guess.** Never invent a figure,
   image, address, or status to fill a layout. Render the empty state and say
   when we learned what we know (docs/EDITORIAL.md is binding).
3. **Life safety outranks everything.** No appeal for money or attention sits
   above "call 123" or "do not go to these hospitals".
4. **Instrument, not dashboard.** Data reads like a chart recorder: mono
   readouts, hairline rules, stamped labels, tight radii. Type carries the
   expression; three faces, each with a job.
5. **Survive the worst reader conditions.** Dark mode is functional, not
   aesthetic — and so is light mode, which is why **no page may be pinned to
   one theme**; status is encoded three ways (color, icon, text); the page must
   be legible on a cracked screen over 2G. That last clause is a budget, not a
   sentiment: artwork is drawn from tokens rather than imported, because the
   first version of this landing put 1.42MB of gzipped PNG in front of the
   headline.

## Accessibility & Inclusion

WCAG AA (4.5:1) on every color pairing, enforced by `pnpm check:contrast` as
a build gate. Status never depends on color alone. `prefers-reduced-motion`
disables all animation including scroll-driven reveals. Bilingual es/en with
Spanish authoritative; screen-reader language set at the root. Touch targets
sized for one-handed, hurried use.
