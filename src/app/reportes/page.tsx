import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { SectionHeading } from "@/components/section-heading";
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

const CHIP = "label-signage inline-flex items-center rounded-sm border px-1.5 py-1";

export default async function ReportsPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: reports, degraded } = await getPublicReports();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading
        as="h1"
        title={t.reports.heading}
        subtitle={t.reports.subheading}
        action={
          <Button
            className="label-signage h-9 rounded-sm px-4"
            render={<Link href="/reportar" />}
          >
            {t.reports.submitCta}
          </Button>
        }
      />

      {/* Moderation is the whole promise of this page — state it before the
          first record, not in a footnote. */}
      <p className="mt-5 flex items-start gap-2 border-l-2 border-fixing bg-fixing-muted px-3 py-2.5 text-sm text-fixing-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.reports.moderationNote}
      </p>

      {degraded ? (
        <div className="mt-6">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {reports.length === 0 ? (
        <p className="mt-8 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t.reports.empty}
        </p>
      ) : (
        <ul className="mt-8 border-t border-border">
          {reports.map((report) => (
            <li
              key={report.id}
              className="border-b border-border py-4 transition-colors hover:bg-card"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`${CHIP} border-transparent bg-secondary text-secondary-foreground`}>
                  {CATEGORY_LABELS[lang][report.category as ReportCategory] ??
                    report.category}
                </span>
                {report.service ? (
                  <span className={`${CHIP} border-border text-muted-foreground`}>
                    {SERVICE_LABELS[lang][report.service]}
                  </span>
                ) : null}
                {report.zone_name ? (
                  <span className={`${CHIP} border-border text-muted-foreground`}>
                    {report.zone_name}
                  </span>
                ) : null}
              </div>

              <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line">
                {report.description}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
