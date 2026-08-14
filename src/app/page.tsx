import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { ActionRoutes } from "@/components/action-board";
import { DONATE_OPERATOR } from "@/components/donate-banner";
import { HeroSafety, HeroSafetyMobile } from "@/components/hero-safety";
import { LanguageToggle } from "@/components/language-toggle";
import { PinnedAlerts } from "@/components/pinned-alerts";
import { ThemeToggle } from "@/components/theme-toggle";
import { SectionHeading } from "@/components/section-heading";
import { Seismograph } from "@/components/seismograph";
import { ServiceStatusCard } from "@/components/service-status-card";
import { RailActions, RailRoutes } from "@/components/site-rail";
import { StatusCarousel } from "@/components/status-carousel";
import { UpdateCard } from "@/components/update-card";
import { Button } from "@/components/ui/button";
import { getPublicReports, getServiceStatus, getUpdates } from "@/lib/data";
import {
  EMERGENCY_LINES,
  MEDICAL_CENTRES_CLOSED,
  PMU_REPORT,
} from "@/lib/fallback-data";
import { formatDateTime, getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

/**
 * The home page's wall content. The shell — the vertical rail, the mobile
 * masthead, the footer, the theme — is provided site-wide by the root layout
 * (`src/app/layout.tsx`); this file renders only what sits in the main column:
 * the pinned ticker, the hero, and the sections below it.
 *
 * Two invariants survive every restructure: nothing renders a figure without
 * a source elsewhere on the site, and no appeal for money sits above life
 * safety.
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
    <>
      {/* Life safety, fixed to the viewport on `lg` — stays reachable through
          the whole scroll. `HeroSafetyMobile` carries it in the flow below. */}
      <HeroSafety lang={lang} />

      <div className="space-y-3">
          {/* Top row — the pinned-notices ticker, with the language and theme
              controls at the right. `min-h` matches the rail's wordmark so the
              hero below lands level with the first nav plate (SERVICES). */}
          <div className="flex min-h-[2.5625rem] items-center gap-3">
            <div className="min-w-0 flex-1">
              <PinnedAlerts updates={pinned} lang={lang} />
            </div>
            {/* lg only — below `lg` the masthead carries these controls. */}
            <div className="hidden items-center gap-2 lg:flex">
              <LanguageToggle current={lang} />
              <ThemeToggle lang={lang} className="size-[1.625rem] shrink-0" />
            </div>
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
                className="size-full bg-down opacity-[0.62]"
                style={{
                  maskImage: "url(/seismic-accents.svg)",
                  WebkitMaskImage: "url(/seismic-accents.svg)",
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
              <h1 className="display-condensed mt-6 text-3xl leading-[1.06] font-extrabold text-balance uppercase min-[420px]:text-4xl sm:text-5xl">
                {l.hero.titleLines.map((line, i) => (
                  <span
                    key={line}
                    /* Wraps freely on phones (no pinned cards there); only
                       from `lg`, where the cards sit at the corner, are the
                       authored line breaks locked with `nowrap`. */
                    className={cn(
                      "block lg:whitespace-nowrap",
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

          {/* Life safety in full, below `lg` — the desktop keeps only the
              fixed closures card, so here the 123 plate joins it. */}
          <HeroSafetyMobile lang={lang} />
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
            {/* Subtle seismic wash — the accent lines, faint, positioned left
                so the two banners never read as the same tile. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/seismic-accents.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-[20%_35%] opacity-[0.06] [mask-image:radial-gradient(130%_130%_at_30%_50%,black_45%,transparent_92%)]"
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
                  <p className="flex items-start gap-2.5 rounded-sm border border-border bg-muted/40 px-3.5 py-2.5 text-xs leading-snug text-pretty text-muted-foreground">
                    <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                    <span>{t.status.unknownNotice}</span>
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
              src="/seismic-accents.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1.2] scale-y-[1.2] object-cover object-[80%_70%] opacity-[0.06] [mask-image:radial-gradient(130%_130%_at_70%_50%,black_45%,transparent_92%)]"
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
    </>
  );
}
