import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  Info,
  Megaphone,
} from "lucide-react";

import { ActionRoutes, EmergencyPlates } from "@/components/action-board";
import { DONATE_OPERATOR } from "@/components/donate-banner";
import { HeroSafety } from "@/components/hero-safety";
import { LanguageToggle } from "@/components/language-toggle";
import { PinnedAlerts } from "@/components/pinned-alerts";
import { SectionHeading } from "@/components/section-heading";
import { Seismograph } from "@/components/seismograph";
import { ServiceStatusCard } from "@/components/service-status-card";
import { StatusCarousel } from "@/components/status-carousel";
import { UpdateCard } from "@/components/update-card";
import { Button } from "@/components/ui/button";
import { getPublicReports, getServiceStatus, getUpdates } from "@/lib/data";
import {
  EMERGENCY_LINES,
  MEDICAL_CENTRES_CLOSED,
  PMU_REPORT,
} from "@/lib/fallback-data";
import { formatDateTime, getDictionary, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

/**
 * The rail plates — the site's routes, in the bulletin's numbering, closed
 * by the two action plates: Reportar in the alarm red, Donar as the inverted
 * ink slab every donate surface on the site shares. Rendered twice — as the
 * vertical navbar from `lg`, and as a 2-up grid under the hero below it.
 * Life safety no longer lives here: the 123 and closures cards sit pinned
 * to the hero itself, and `EmergencyPlates` carries them below `lg`.
 */
/** The five section routes, one row each. */
function RailRoutes({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <>
      {(
        [
          { index: "01", label: t.nav.services, href: "/servicios" },
          { index: "02", label: t.nav.reports, href: "/reportes" },
          { index: "03", label: t.nav.resources, href: "/recursos" },
          { index: "04", label: t.nav.links, href: "/enlaces" },
          { index: "05", label: t.nav.partners, href: "/organizaciones" },
        ] as const
      ).map((item) => (
        /* One row per route: index, title, arrow. A single line can never
           spill out of its plate, whatever the viewport height. Achromatic
           on purpose — a coloured nav plate would trespass on the four
           status hues. */
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-center gap-3 rounded-sm bg-secondary px-3.5 py-3 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            data-readout
            className="shrink-0 font-mono text-xs font-semibold text-muted-foreground"
          >
            {item.index}
          </span>
          <span className="display-condensed min-w-0 flex-1 text-base leading-tight font-bold uppercase lg:text-sm">
            {item.label}
          </span>
          <ArrowUpRight
            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </Link>
      ))}
    </>
  );
}

/** The two action plates — report in the alarm red, donate in the inverted
 *  ink of every donate surface on the site. The rail's closing pair. */
function RailActions({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <>
      <Link
        href="/reportar"
        className="group flex items-center gap-3 rounded-sm bg-down px-3.5 py-3 text-down-contrast transition-opacity outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Megaphone className="size-4 shrink-0" aria-hidden />
        <span className="display-condensed flex-1 text-base leading-tight font-extrabold uppercase lg:text-sm">
          {t.nav.submit}
        </span>
        <ArrowRight
          className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>

      <Link
        href="/donar"
        className="group flex items-center gap-3 rounded-sm bg-primary px-3.5 py-3 text-primary-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HeartHandshake className="size-4 shrink-0" aria-hidden />
        <span className="display-condensed flex-1 text-base leading-tight font-extrabold uppercase lg:text-sm">
          {t.donate.cta}
        </span>
        <ArrowRight
          className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </>
  );
}

/**
 * The editorial landing.
 *
 * A dispatch wall: a sticky vertical rail on the left (the navbar from `lg` —
 * wordmark, life safety, the numbered sections, donate, language) and a
 * full-width column beside it that alternates two textures — paneled splits
 * for the storytelling sections, and open ruled sections (the bulletin's own
 * `SectionHeading` grammar) for the records: routes, the status board, the
 * feed. Composed at 1280px and scaled proportionally above it via
 * `[data-landing]` (see globals.css).
 *
 * The whole page is set on the "noche" token set (the `dark` wrapper)
 * regardless of theme. Two invariants survive every restructure: nothing
 * renders a figure without a source elsewhere on the site, and no appeal for
 * money sits above life safety.
 */
export default async function HomePage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const l = t.landing;

  const [statusResult, updatesResult, reportsResult] = await Promise.all([
    getServiceStatus(),
    getUpdates(8),
    /* Only the tally is used here, and it is read with the same default limit
       /reportes renders — so the number on the tile is exactly how many rows
       the reader will find when they tap it, never an estimate. */
    getPublicReports(),
  ]);

  const statuses = statusResult.data;
  const updates = updatesResult.data;
  const reportCount = reportsResult.data.length;

  /* Pinned updates appear twice by design: as a strap line in the fold and
     again as full cards in the feed, which stays the complete record. */
  const pinned = updates.filter((u) => u.pinned);
  const hasUnknown = statuses.some((s) => s.status === "unknown");
  const unknownCount = statuses.filter((s) => s.status === "unknown").length;

  /* The live tallies, as instrument rows rather than stat tiles — each one
     is a reading with a provenance, not a KPI. */
  const tallies = [
    {
      key: "medical",
      value: MEDICAL_CENTRES_CLOSED.length,
      label: l.impact.medicalLabel,
      source: (
        <>
          {t.status.source}: {PMU_REPORT.orgShortName} ·{" "}
          <span data-readout>{formatDateTime(PMU_REPORT.reportedAt, lang)}</span>
        </>
      ),
    },
    {
      key: "unknown",
      value: unknownCount,
      label: l.impact.unknownLabel(statuses.length),
      source: null,
    },
    {
      key: "reports",
      value: reportCount,
      label: l.impact.reportsLabel,
      source: null,
    },
    {
      key: "lines",
      value: EMERGENCY_LINES.length,
      label: l.impact.linesLabel,
      source: null,
    },
  ] as const;

  return (
    <div data-landing className="dark bg-background text-foreground">
      {/* Life safety, fixed to the viewport on `lg` — stays reachable through
          the whole scroll. Renders nothing below `lg` (EmergencyPlates
          carries it in the flow there). */}
      <HeroSafety lang={lang} />

      <div className="flex items-start gap-3 px-3">
        {/* ------------------------------------------------------------ */}
        {/* The rail — the landing's navbar from `lg`                      */}
        {/* ------------------------------------------------------------ */}
        <nav
          aria-label={l.hero.railLabel}
          /* Full viewport height so the last plate (DONAR) sits at the foot,
             level with the hero's bottom edge. The routes stay tightly
             stacked; the numbers directory below grows to absorb the slack
             (see its `flex-1`), so the rail fills the height with no dead
             band. `overflow-y-auto` is the last resort for sub-600px
             windows. */
          className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-2 overflow-y-auto py-3 lg:flex"
        >
          {/* Wordmark — the horizontal masthead is hidden here (see
              SiteHeader), so the rail carries the identity at logotype
              size, with the tagline set beneath it. */}
          <Link
            href="/"
            className="px-1 pt-1 pb-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="display-condensed block truncate text-xl leading-none uppercase">
              <span className="font-extrabold">Sismo</span>
              <span className="ml-1.5 font-normal text-muted-foreground">
                Pereira
              </span>
            </span>
            <span className="label-signage mt-1.5 block text-[0.5625rem] tracking-[0.16em] text-muted-foreground">
              {t.nav.tagline}
            </span>
          </Link>

          <RailRoutes lang={lang} />

          {/* The emergency lines — a phone directory. Each row is an equal
              share of the panel's height (`flex-1`) with a hairline between,
              so the list fills the rail's slack as a regular, aligned
              pattern: a fixed numeral column, labels flush beside it. */}
          <ul className="flex flex-1 flex-col divide-y divide-border/60 rounded-sm bg-secondary px-3.5">
            {EMERGENCY_LINES.map((line) => (
              <li key={line.number} className="flex flex-1 items-center gap-3">
                <a
                  href={`tel:${line.number}`}
                  data-readout
                  className="w-8 shrink-0 font-mono text-xs font-semibold tabular-nums underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {line.number}
                </a>
                <span className="min-w-0 truncate text-xs leading-snug text-muted-foreground">
                  {line.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Report and Donate — the rail's closing pair, at the foot. */}
          <RailActions lang={lang} />
        </nav>

        {/* ------------------------------------------------------------ */}
        {/* The wall                                                       */}
        {/* ------------------------------------------------------------ */}
        {/* Rhythm: the fold is one tight cluster; every section after it
            gets real air (4–6rem). Tight inside compositions, generous
            between thoughts — the page breathes instead of ticking. */}
        <div className="min-w-0 flex-1 py-3">
          <div className="space-y-3">
          {/* Top row — the wall's header, aligned with the rail's wordmark.
              The pinned-notices ticker leads, the language toggle sits at the
              right. `min-h` is tuned so the hero below lands level with the
              first nav plate (SERVICES). */}
          <div className="flex min-h-[2.5625rem] items-center gap-3">
            <div className="min-w-0 flex-1">
              <PinnedAlerts updates={pinned} lang={lang} />
            </div>
            <LanguageToggle current={lang} />
          </div>

          {/* Hero panel: contour terrain and chart paper behind a centered
              headline, one strong CTA, the trace, and the event readout.
              A clamped *minimum*, never a fixed height: the viewport sets
              the size, 64rem stops a portrait monitor stretching it into a
              void — and on squat windows the panel grows with its content
              instead of clipping the readout. */}
          {/* Height on `lg` is tuned so the panel's top sits level with the
              first nav plate (SERVICES) and its bottom with the last one
              (DONAR): the wall's top offset is pt-3 (0.75) + top row
              (2.5625) + gap (0.75), and pb-3 (0.75) closes it, so the panel
              is 100svh minus their sum. */}
          <section className="relative flex min-h-[calc(100svh-9rem)] flex-col overflow-hidden rounded-sm border border-border bg-card/30 lg:min-h-[calc(100svh-4.8125rem)]">
            {/* The seismic field — the traced isoseismal map, tinted the alarm
                red by using the (black-on-white) map as a luminance mask over
                a solid `down` layer, so only its lines carry colour. Drifts
                slowly with scroll; the outer radial fade keeps the headline
                clean. Ornament, but meaningful: intensity from the source. */}
            <div
              aria-hidden
              className="parallax-drift pointer-events-none absolute inset-x-0 -top-4 -bottom-16"
              style={{
                maskImage:
                  "radial-gradient(120% 100% at 50% 45%, black 50%, transparent 90%)",
                WebkitMaskImage:
                  "radial-gradient(120% 100% at 50% 45%, black 50%, transparent 90%)",
              }}
            >
              <div
                className="size-full bg-down opacity-45"
                style={{
                  maskImage: "url(/seismic-dark.svg)",
                  WebkitMaskImage: "url(/seismic-dark.svg)",
                  maskMode: "luminance",
                  maskSize: "cover",
                  WebkitMaskSize: "cover",
                  maskPosition: "50% 42%",
                  WebkitMaskPosition: "50% 42%",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                }}
              />
            </div>
            <div
              aria-hidden
              className="chart-paper pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,transparent_8%,black_55%)]"
            />

            {/* Life safety no longer lives inside the hero — `HeroSafety`
                renders it fixed to the viewport (see below), so it stays
                reachable through the whole scroll. */}

            <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-10 sm:py-12">
              <p className="label-signage text-[0.625rem] text-down">
                {t.hero.eyebrow}
              </p>

              {/* One sentence, two voices: the record in ink, the call to
                  act in the alarm red (the Report plate's colour). Explicit
                  breaks — never wrapping. */}
              <h1 className="display-condensed mt-6 text-4xl leading-[1.06] font-extrabold uppercase sm:text-5xl">
                {l.hero.titleLines.map((line, i) => (
                  <span
                    key={line}
                    className={cn(
                      "block whitespace-nowrap",
                      i === l.hero.titleLines.length - 1 && "text-down",
                    )}
                  >
                    {line}
                  </span>
                ))}
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
                {l.hero.lede}
              </p>

              <Button
                className="label-signage mt-8 h-10 gap-2 rounded-sm bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                render={<Link href="/donar" />}
              >
                {t.donate.title}
                <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            </div>

            {/* The masthead's trace, drawn once on load — the site's one
                ornament, and the divider itself: no border rule under it. */}
            <Seismograph className="relative h-7 w-full text-ember/45" />

            {/* Event readout on the panel's foot. The trace above is the
                rule — no border here, or the two read as a double line. */}
            <dl className="relative flex flex-wrap items-baseline justify-center gap-x-6 gap-y-2.5 px-5 pt-1 pb-5">
              {t.hero.quakeFacts.map((fact) => (
                <div key={fact.label} className="flex items-baseline gap-2">
                  <dt className="label-signage text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd
                    data-readout
                    className="font-mono text-[0.8125rem] leading-snug font-medium"
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Below `lg` there is no rail, so the plates follow the panel. */}
          <nav
            aria-label={l.hero.railLabel}
            className="grid grid-cols-2 gap-3 lg:hidden"
          >
            <RailRoutes lang={lang} />
            <RailActions lang={lang} />
          </nav>

          {/* Life safety in full, below `lg` — the hero carries the compact
              cards from there up. */}
          <div className="lg:hidden">
            <EmergencyPlates lang={lang} />
          </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* The six routes — first after the hero: "what do you do now?"  */}
          {/* ---------------------------------------------------------- */}
          <div className="mt-16 sm:mt-24">
            <ActionRoutes
              lang={lang}
              statuses={statuses}
              reportCount={reportCount}
            />
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Centred report CTA — the one thing a reader can DO to help    */}
          {/* the board stay accurate. Honest copy only; no invented claim  */}
          {/* about any named operator.                                     */}
          {/* ---------------------------------------------------------- */}
          {/* A light panel — a bright break in the dark scroll — with the
              seismic field faint behind it, and a dark button. */}
          <section className="relative mt-16 overflow-hidden rounded-sm border border-border bg-card sm:mt-24">
            {/* Subtle seismic wash — the dark map, screened so only its faint
                lines show, positioned left so the two banners never read as
                the same tile. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/seismic-dark.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-[20%_35%] opacity-[0.06] mix-blend-screen [mask-image:radial-gradient(130%_130%_at_30%_50%,black_45%,transparent_92%)]"
            />
            <div className="relative flex flex-col items-center px-6 py-16 text-center sm:py-20">
              <p className="label-signage text-ember">
                {t.actions.report.eyebrow}
              </p>
              <h2 className="display-condensed mt-4 max-w-2xl text-2xl leading-tight font-extrabold text-balance uppercase sm:text-3xl">
                {t.actions.report.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
                {t.actions.report.body}
              </p>
              <Button
                className="label-signage mt-8 h-11 gap-2 rounded-sm bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                render={<Link href="/reportar" />}
              >
                {t.reports.submitCta}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <p className="label-signage mt-4 text-[0.625rem] text-muted-foreground">
                {t.actions.report.meta}
              </p>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* Service status board                                         */}
          {/* ---------------------------------------------------------- */}
          <section id="servicios" className="mt-16 scroll-mt-20 sm:mt-24">
            <SectionHeading centered title={t.status.heading} />

            {/* Subheading, with the zone-detail route as an inline link in the
                same type — only underlined. */}
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-pretty text-muted-foreground">
              {t.status.subheading}.{" "}
              <Link
                href="/servicios"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t.status.viewAll}
              </Link>
            </p>

            <StatusCarousel
              label={t.status.heading}
              className="mt-8"
              note={
                hasUnknown ? (
                  <p className="flex items-center justify-center gap-2 text-center text-xs leading-snug text-pretty text-muted-foreground">
                    <Info className="size-3.5 shrink-0" aria-hidden />
                    {t.status.unknownNotice}
                  </p>
                ) : null
              }
            >
              {statuses.map((status) => (
                <ServiceStatusCard
                  key={status.id}
                  status={status}
                  lang={lang}
                  /* Fill the slide so every card in the row is the same
                     height regardless of copy length. */
                  className="h-full w-full"
                />
              ))}
            </StatusCarousel>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* Donation banner — the same inverted-panel treatment as the   */}
          {/* report CTA, with the operator disclosed and the audit note   */}
          {/* on its foot. Well below life safety.                         */}
          {/* ---------------------------------------------------------- */}
          <section className="relative mt-16 overflow-hidden rounded-sm border border-border bg-card sm:mt-24">
            {/* Same wash, mirrored and pushed right/down, so this banner and
                the report one never look identical. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/seismic-dark.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1.2] scale-y-[1.2] object-cover object-[80%_70%] opacity-[0.06] mix-blend-screen [mask-image:radial-gradient(130%_130%_at_70%_50%,black_45%,transparent_92%)]"
            />
            <div className="relative flex flex-col items-center px-6 py-16 text-center sm:py-20">
              <p className="label-signage text-ember">{t.donate.eyebrow}</p>
              <h2 className="display-condensed mt-4 max-w-2xl text-2xl leading-tight font-extrabold text-balance uppercase sm:text-3xl">
                {t.donate.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
                {t.donate.body}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
                {t.donate.scope}
              </p>
              <Button
                className="label-signage mt-8 h-11 gap-2 rounded-sm bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                render={<Link href="/donar" />}
              >
                {t.donate.cta}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <p className="mt-6 font-mono text-[0.6875rem] text-muted-foreground">
                {t.links.operator}{" "}
                <span className="font-semibold text-foreground">
                  {DONATE_OPERATOR}
                </span>
              </p>
            </div>
            <p className="relative border-t border-border px-6 py-3 text-center text-xs leading-relaxed text-pretty text-muted-foreground">
              {t.donate.blockNote}
            </p>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* The emergency in figures                                     */}
          {/* ---------------------------------------------------------- */}
          <section id="cifras" className="mt-16 scroll-mt-20 sm:mt-24">
            <SectionHeading
              centered
              title={l.impact.heading}
              subtitle={l.impact.note}
            />

            {/* One bordered grid: the event parameters on top, the live
                record below, every cell ruled off with a hairline and the
                whole thing boxed. `gap-px` over a `bg-border` sheet draws the
                internal lines; the container border closes the box. */}
            <div className="mt-10 overflow-hidden rounded-sm border border-border">
              <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                {l.impact.event.map((cell) => (
                  <div
                    key={cell.label}
                    className="flex flex-col items-center bg-background px-3 py-6 text-center sm:py-8"
                  >
                    <dd
                      data-readout
                      className="font-mono text-3xl font-semibold tracking-tight whitespace-nowrap sm:text-4xl"
                    >
                      {cell.value}
                    </dd>
                    <dt className="label-signage mt-3 leading-snug text-muted-foreground">
                      {cell.label}
                    </dt>
                  </div>
                ))}
                {tallies.map((row) => (
                  <div
                    key={row.key}
                    className="flex flex-col items-center bg-background px-3 py-6 text-center sm:py-8"
                  >
                    <dd
                      data-readout
                      className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl"
                    >
                      {row.value}
                    </dd>
                    <dt className="mt-3 text-sm leading-snug text-pretty">
                      {row.label}
                    </dt>
                    {row.source ? (
                      <p className="mt-2 font-mono text-[0.625rem] leading-snug text-muted-foreground">
                        {row.source}
                      </p>
                    ) : null}
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* 06 — The complete update feed (open ruled section)           */}
          {/* ---------------------------------------------------------- */}
          <section
            id="actualizaciones"
            className="mt-16 scroll-mt-20 sm:mt-24"
          >
            <SectionHeading
              centered
              title={t.updates.heading}
              subtitle={t.updates.subheading}
            />

            {updates.length === 0 ? (
              <p className="mt-8 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {t.updates.empty}
              </p>
            ) : (
              <StatusCarousel label={t.updates.heading} className="mt-8">
                {updates.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    lang={lang}
                    className="h-full w-full"
                  />
                ))}
              </StatusCarousel>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
