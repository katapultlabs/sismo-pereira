import Link from "next/link";
import { ArrowRight, Info, Megaphone, Phone } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { DonateBlock } from "@/components/donate-banner";
import { SectionHeading } from "@/components/section-heading";
import { ServiceStatusCard } from "@/components/service-status-card";
import { UpdateCard } from "@/components/update-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getServiceStatus, getUpdates } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export default async function HomePage() {
  const lang = await getLang();
  const t = getDictionary(lang);

  const [statusResult, updatesResult] = await Promise.all([
    getServiceStatus(),
    getUpdates(8),
  ]);

  const degraded = statusResult.degraded || updatesResult.degraded;
  const statuses = statusResult.data;
  const updates = updatesResult.data;

  const pinned = updates.filter((u) => u.pinned);
  const rest = updates.filter((u) => !u.pinned);
  const hasUnknown = statuses.some((s) => s.status === "unknown");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* ---------------------------------------------------------------- */}
      {/* Hero — headline against an instrument readout of the event        */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative -mx-4 border-b border-foreground/25 px-4 py-10 sm:py-14">
        {/* Seismograph chart paper, faded on both axes so it never competes
            with the headline or the readout sitting on top of it. */}
        <div
          className="chart-paper pointer-events-none absolute inset-0 [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,black,transparent_80%),linear-gradient(to_right,black_35%,transparent_90%)]"
          aria-hidden
        />

        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="label-signage inline-flex items-center gap-2 text-down-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-down opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-down" />
              </span>
              {t.hero.eyebrow}
            </p>

            <h1 className="display-condensed mt-5 text-5xl font-extrabold text-balance uppercase sm:text-6xl lg:text-7xl">
              {t.hero.title}
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
              {t.hero.subtitle}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <Button
                size="lg"
                render={<Link href="/reportar" />}
                className="label-signage h-11 gap-2 rounded-sm px-5"
              >
                <Megaphone className="size-4" aria-hidden />
                {t.hero.reportCta}
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/recursos" />}
                className="label-signage h-11 gap-2 rounded-sm px-5"
              >
                <Phone className="size-4" aria-hidden />
                {t.hero.emergencyCta}
              </Button>
            </div>
          </div>

          {/* Event readout. A labelled field list rather than a sentence —
              the numbers are what people come back to check. */}
          <dl className="divide-y divide-border border-y border-border bg-card/60 text-sm">
            {t.hero.quakeFacts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline justify-between gap-4 px-3 py-2"
              >
                <dt className="label-signage shrink-0 text-muted-foreground">
                  {fact.label}
                </dt>
                <dd
                  data-readout
                  className="text-right font-mono text-[0.8125rem] font-medium"
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {degraded ? (
        <div className="mt-8">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Pinned / critical updates                                         */}
      {/* ---------------------------------------------------------------- */}
      {pinned.length > 0 ? (
        <section className="mt-10 space-y-3">
          {pinned.map((update) => (
            <UpdateCard key={update.id} update={update} lang={lang} />
          ))}
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Donation drive                                                    */}
      {/* ---------------------------------------------------------------- */}
      {/*
       * Deliberately below the pinned alerts and above the status board. The
       * pinned slot carries critical, time-sensitive safety notices, and an
       * appeal for money must never sit above "do not enter this building".
       * Everywhere after that, it leads.
       */}
      <DonateBlock lang={lang} className="mt-10" />

      {/* ---------------------------------------------------------------- */}
      {/* Service status grid                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14">
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
      {/* Update feed                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14">
        <SectionHeading
          index="02"
          title={t.updates.heading}
          subtitle={t.updates.subheading}
        />

        {rest.length === 0 && pinned.length === 0 ? (
          <p className="mt-5 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {t.updates.empty}
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {rest.map((update) => (
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
