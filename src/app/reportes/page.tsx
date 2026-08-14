import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { Button } from "@/components/ui/button";
import { getPublicReports } from "@/lib/data";
import {
  CATEGORY_LABELS,
  SERVICE_LABELS,
  formatDateTime,
  formatRelative,
  getDictionary,
  type ReportCategory,
} from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).reports.heading };
}

const PILL =
  "inline-flex items-center rounded-full py-1 pr-2 pl-2.5 font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.06em] transition-colors group-hover:bg-background";

export default async function ReportsPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: reports, degraded } = await getPublicReports();

  return (
    <div className="pb-12">
      <h1 className="display-condensed text-center text-3xl font-extrabold uppercase sm:text-4xl">
        {t.reports.heading}
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-pretty text-muted-foreground">
        {t.reports.subheading}
      </p>

      <div className="mt-6 flex justify-center">
        <Button
          className="label-signage h-10 gap-2 rounded-sm px-5"
          render={<Link href="/reportar" />}
        >
          {t.reports.submitCta}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>

      {/* Moderation is the whole promise of this page — an info card, not a
          footnote. */}
      <p className="mt-8 flex items-start gap-2.5 rounded-sm border border-fixing/40 bg-fixing-muted px-4 py-3 text-sm leading-relaxed text-pretty text-fixing-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.reports.moderationNote}
      </p>

      {degraded ? (
        <div className="mt-6">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {reports.length === 0 ? (
        <p className="mt-6 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t.reports.empty}
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {reports.map((report) => (
            <article
              key={report.id}
              className="group flex flex-col gap-2.5 rounded-sm border border-border p-4 transition-colors hover:border-foreground/30 hover:bg-muted"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`${PILL} bg-secondary text-secondary-foreground`}>
                  {CATEGORY_LABELS[lang][report.category as ReportCategory] ??
                    report.category}
                </span>
                {report.service ? (
                  <span className={`${PILL} bg-muted text-muted-foreground`}>
                    {SERVICE_LABELS[lang][report.service]}
                  </span>
                ) : null}
                {report.zone_name ? (
                  <span className={`${PILL} bg-muted text-muted-foreground`}>
                    {report.zone_name}
                  </span>
                ) : null}
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-line text-pretty">
                {report.description}
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-border pt-2.5 font-mono text-[0.6875rem] text-muted-foreground">
                {report.address_hint ? (
                  <>
                    <span>{report.address_hint}</span>
                    <span className="text-border" aria-hidden>
                      ·
                    </span>
                  </>
                ) : null}
                <time
                  dateTime={report.created_at}
                  title={formatDateTime(report.created_at, lang)}
                >
                  {formatRelative(report.created_at, lang)}
                </time>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
