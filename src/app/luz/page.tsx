import type { Metadata } from "next";
import Link from "next/link";
import { Info, Phone } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { LuzReportForm } from "@/components/luz-report-form";
import { ReportDensity } from "@/components/report-density";
import { SectionHeading } from "@/components/section-heading";
import { getServiceReportDensity, getZones } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLang()).luz;
  return { title: t.metaTitle, description: t.metaDescription };
}

/*
 * Counts move continuously while people report, and a cached page showing
 * yesterday's zeros would read as "nobody is reporting" rather than "this page
 * is stale". Rendered per request.
 */
export const dynamic = "force-dynamic";

export default async function LuzPage() {
  const lang = await getLang();
  const t = getDictionary(lang).luz;

  const [{ data: zones }, { data: density, degraded }] = await Promise.all([
    getZones(),
    getServiceReportDensity("electricity"),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading as="h1" title={t.title} subtitle={t.lede} />

      {/*
       * Two disclaimers, both above the form rather than under it.
       *
       * The first is the one this project always carries: we are not an
       * emergency service. The second is specific to this page and matters
       * just as much — a page that collects outage reports and mentions the
       * utility by name will be read as the utility's own channel unless it
       * says otherwise in its own voice.
       */}
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
        <LuzReportForm lang={lang} zones={zones} />
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

        <ReportDensity rows={density} lang={lang} />
      </section>
    </div>
  );
}
