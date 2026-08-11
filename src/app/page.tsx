import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { ActionRoutes, EmergencyPlates } from "@/components/action-board";
import { DegradedNotice } from "@/components/degraded-notice";
import { DonateBlock } from "@/components/donate-banner";
import { PinnedAlerts } from "@/components/pinned-alerts";
import { SectionHeading } from "@/components/section-heading";
import { ServiceStatusCard } from "@/components/service-status-card";
import { UpdateCard } from "@/components/update-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getPublicReports, getServiceStatus, getUpdates } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export default async function HomePage() {
  const lang = await getLang();
  const t = getDictionary(lang);

  const [statusResult, updatesResult, reportsResult] = await Promise.all([
    getServiceStatus(),
    getUpdates(8),
    /* Only the tally is used here, and it is read with the same default limit
       /reportes renders — so the number on the tile is exactly how many rows
       the reader will find when they tap it, never an estimate. */
    getPublicReports(),
  ]);

  const degraded = statusResult.degraded || updatesResult.degraded;
  const statuses = statusResult.data;
  const updates = updatesResult.data;

  /* Pinned updates appear twice by design: compressed to a row in the strap
     line above the board, and again as a full card in the feed below, which
     stays the complete record. `UpdateCard` stamps them "fijado", so the
     repeat reads as the same item rather than as two. */
  const pinned = updates.filter((u) => u.pinned);
  const hasUnknown = statuses.some((s) => s.status === "unknown");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* ---------------------------------------------------------------- */}
      {/* Masthead — deliberately short                                      */}
      {/* ---------------------------------------------------------------- */}
      {/*
       * This used to be a full-height hero: a 7xl headline, a lede, two CTAs,
       * and the event readout as a 20rem sidebar. It cost the entire fold to
       * say something the reader already knows — there was an earthquake — and
       * pushed every actionable route below it.
       *
       * So it is now a masthead: the same identity (chart paper, the pulsing
       * epicentre mark, the instrument readout) in roughly half the height,
       * with the fold handed to the action board. The two hero buttons are
       * gone because the board carries both of those routes as full plates.
       */}
      <section className="relative -mx-4 border-b border-foreground/25 px-4 py-6 sm:py-8">
        {/* Seismograph chart paper, faded on both axes so it never competes
            with the headline or the readout sitting on top of it. */}
        <div
          className="chart-paper pointer-events-none absolute inset-0 [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,black,transparent_80%),linear-gradient(to_right,black_35%,transparent_90%)]"
          aria-hidden
        />

        <div className="relative">
          <p className="label-signage inline-flex items-center gap-2 text-down-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-down opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-down" />
            </span>
            {t.hero.eyebrow}
          </p>

          <h1 className="display-condensed mt-3 text-3xl font-extrabold text-balance uppercase sm:text-4xl lg:text-5xl">
            {t.hero.title}
          </h1>

          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground">
            {t.hero.subtitle}
          </p>

          {/*
           * Event readout, turned on its side and un-boxed.
           *
           * As a vertical field list it needed a 20rem column; as a 2×2 grid of
           * cells it cost ~150px on a phone, because "Chocó, ~55 km al
           * occidente de Pereira" wraps to three lines inside a half-width
           * cell. Set inline against a single rule it wraps as prose does,
           * costs ~60px, and reads the way an instrument prints its channels.
           */}
          <dl className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-border pt-4">
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
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* The fold: life safety, then pinned notices, then the routes        */}
      {/* ---------------------------------------------------------------- */}
      {/*
       * This ordering is the whole argument of the page.
       *
       * The two red plates are standing instructions — call 123, and these
       * four hospital doors are shut — true on every visit and rendered from
       * hardcoded constants, so they lead. A pinned notice is curated and
       * time-sensitive, so it comes second, and as a strap line rather than as
       * cards: three pins as full `UpdateCard`s cost ~540px and pushed every
       * actionable thing off the first screen on a phone. The six routes come
       * third, because choosing where to go is what you do after you have
       * dealt with anything on fire.
       */}
      <EmergencyPlates lang={lang} className="mt-6" />

      <PinnedAlerts updates={pinned} lang={lang} className="mt-3" />

      {/* ---------------------------------------------------------------- */}
      {/* Electricity reporting drive                                       */}
      {/* ---------------------------------------------------------------- */}
      {/*
       * Between the pinned strap and the routes, and deliberately not a
       * seventh tile in the board below.
       *
       * The board lists standing routes — places that are always there. This
       * is a time-boxed campaign asking the reader to *contribute* something
       * only they have, for an operator that currently cannot see its own
       * grid. As tile seven it would read as a peer of "Organizaciones" and
       * break the 3-column grid; as a plate it keeps the weight the ask
       * actually has, and it can be deleted later without leaving a hole.
       *
       * It carries no status colour. Chroma on this site means a service
       * state, and this is a call to act, not a reading — the rule and the
       * arrow do the work.
       */}
      <section className="mt-10 border border-foreground/25 p-5 sm:p-6">
        <p className="label-signage text-muted-foreground">{t.luz.eyebrow}</p>
        <h2 className="display-condensed mt-2 text-2xl font-extrabold uppercase sm:text-3xl">
          {t.luz.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t.luz.lede}
        </p>
        <Button
          size="lg"
          className="label-signage mt-5 h-11 rounded-sm"
          render={<Link href="/luz" />}
        >
          {t.luz.ctaFromHome}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {t.luz.minutes}
        </p>
      </section>

      <ActionRoutes
        lang={lang}
        statuses={statuses}
        reportCount={reportsResult.data.length}
        className="mt-10"
      />

      {/* ---------------------------------------------------------------- */}
      {/* Service status grid                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14">
        {/*
         * The degraded banner sits here rather than under the masthead. The
         * board's two life-safety plates render from hardcoded constants and
         * are never degraded, so disclaiming them would be wrong; everything
         * from this point down is a live read, and this is what the notice is
         * actually about.
         */}
        {degraded ? (
          <div className="mb-8">
            <DegradedNotice lang={lang} />
          </div>
        ) : null}

        <SectionHeading
          index="01"
          title={t.status.heading}
          subtitle={t.status.subheading}
          action={
            <Link
              href="/servicios"
              className="label-signage inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t.status.viewAll}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        />

        {hasUnknown ? (
          <Alert className="mt-5 rounded-sm">
            <Info className="size-4" aria-hidden />
            <AlertDescription>{t.status.unknownNotice}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statuses.map((status, i) => (
            <ServiceStatusCard
              key={status.id}
              status={status}
              lang={lang}
              /* One staggered reveal across the board, capped so a long grid
                 never leaves the last card waiting on a visible delay. */
              className="animate-rise"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Donation drive                                                    */}
      {/* ---------------------------------------------------------------- */}
      {/*
       * Below the pinned alerts, the action board, and the status board. An
       * appeal for money must never sit above "do not enter this building" or
       * above the routes to help — but it leads everything after them.
       */}
      <DonateBlock lang={lang} className="mt-14" />

      {/* ---------------------------------------------------------------- */}
      {/* Update feed                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14">
        <SectionHeading
          index="02"
          title={t.updates.heading}
          subtitle={t.updates.subheading}
        />

        {updates.length === 0 ? (
          <p className="mt-5 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {t.updates.empty}
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {updates.map((update) => (
              <UpdateCard key={update.id} update={update} lang={lang} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Contribution CTA                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14 border border-border bg-muted/40 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="display-condensed text-xl font-extrabold uppercase">
              {t.partners.heading}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t.partners.subheading}
            </p>
          </div>
          <Button
            variant="outline"
            className="label-signage h-10 shrink-0 gap-2 rounded-sm px-4"
            render={<Link href="/organizaciones" />}
          >
            {t.partners.contactHeading}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </section>
    </div>
  );
}
