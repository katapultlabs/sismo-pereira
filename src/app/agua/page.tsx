import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Inbox, Info, Phone } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { ReportDensity } from "@/components/report-density";
import { SectionHeading } from "@/components/section-heading";
import { ServiceReportForm } from "@/components/service-report-form";
import { Button } from "@/components/ui/button";
import { getOrganizations, getServiceReportDensity, getZones } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { instrumentOpen } from "@/lib/service-instruments";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLang()).agua;
  return { title: t.metaTitle, description: t.metaDescription };
}

/* Counts move continuously while people report — rendered per request, same
 * as /luz. */
export const dynamic = "force-dynamic";

/**
 * The water twin of `/luz` — the same collection instrument, keyed to
 * `service = 'water'`.
 *
 * The form only renders while the instrument is **open**: the launch switch in
 * `src/lib/service-instruments.ts` is on AND a verified organization covering
 * `water` exists to read the rows. This page collects phone numbers in order
 * to hand them to the operator (EDITORIAL Rule 4), and a form nobody reads is
 * worse than no form (Rule 5) — so while the gate is closed it says exactly
 * that, and routes to the moderated community form instead.
 *
 * The gate is evaluated against the **live** org list and closes on a degraded
 * read: when we cannot confirm a recipient we do not collect. Failing toward
 * not collecting is the safe direction.
 */
export default async function AguaPage() {
  const lang = await getLang();
  const t = getDictionary(lang).agua;

  const [
    { data: zones },
    { data: density, degraded },
    { data: orgs, degraded: orgsDegraded },
  ] = await Promise.all([
    getZones(),
    getServiceReportDensity("water"),
    getOrganizations(),
  ]);

  const open = !orgsDegraded && instrumentOpen("water", orgs);

  if (!open) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 pb-16 sm:py-14">
        <SectionHeading as="h1" title={t.title} subtitle={t.lede} />

        <section className="mt-8 flex flex-col items-start gap-4 border border-dashed border-border p-6 sm:p-8">
          <p className="label-signage flex items-center gap-2 text-muted-foreground">
            <Inbox className="size-4" aria-hidden />
            {t.closedTitle}
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-pretty">
            {t.closedBody}
          </p>
          <Button
            className="label-signage rounded-sm"
            render={<Link href="/reportar#formulario" />}
          >
            {t.closedCta}
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading as="h1" title={t.title} subtitle={t.lede} />

      {/* Same pair of disclaimers as /luz, in the same order: we are not an
          emergency service, and we are not the operator's own channel. */}
      <aside className="mt-6 flex flex-col gap-3 border-2 border-down bg-down-muted p-4 text-down-foreground sm:flex-row sm:items-center">
        <a
          href="tel:123"
          aria-label="123"
          className="flex shrink-0 items-center gap-2 bg-down px-4 py-2.5 font-mono text-2xl leading-none font-semibold tracking-tight text-down-contrast transition-opacity hover:opacity-90"
        >
          <Phone className="size-5" aria-hidden />
          123
        </a>
        <p className="text-sm leading-relaxed font-medium">
          {t.emergencyWarning}
        </p>
      </aside>

      <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.notOfficialNotice}
      </p>

      <div className="mt-8">
        <ServiceReportForm lang={lang} zones={zones} service="water" />
      </div>

      <section className="mt-14 space-y-5">
        <SectionHeading
          index="02"
          title={t.densityHeading}
          subtitle={t.densitySubheading}
          action={
            <Link
              href="/servicios"
              className="label-signage text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {getDictionary(lang).status.heading}
            </Link>
          }
        />

        {degraded ? <DegradedNotice lang={lang} /> : null}

        <ReportDensity rows={density} lang={lang} service="water" />
      </section>
    </div>
  );
}
