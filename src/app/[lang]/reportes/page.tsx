import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPublicReports } from "@/lib/data";
import {
  CATEGORY_LABELS,
  SERVICE_LABELS,
  formatDateTime,
  formatRelative,
  getDictionary,
  isLang,
  localePath,
  type ReportCategory,
} from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reportes">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getDictionary(lang).reports.heading };
}

export default async function ReportsPage({
  params,
}: PageProps<"/[lang]/reportes">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const { data: reports, degraded } = await getPublicReports();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.reports.heading}
          </h1>
          <p className="text-muted-foreground">{t.reports.subheading}</p>
        </div>
        <Button render={<Link href={localePath(lang, "/reportar")} />}>
          {t.reports.submitCta}
        </Button>
      </header>

      <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" aria-hidden />
        {t.reports.moderationNote}
      </p>

      {degraded ? (
        <div className="mt-6">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {reports.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t.reports.empty}
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="gap-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {CATEGORY_LABELS[lang][report.category as ReportCategory] ??
                    report.category}
                </Badge>
                {report.service ? (
                  <Badge variant="outline">
                    {SERVICE_LABELS[lang][report.service]}
                  </Badge>
                ) : null}
                {report.zone_name ? (
                  <Badge variant="outline">{report.zone_name}</Badge>
                ) : null}
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-line">
                {report.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {report.address_hint ? <span>{report.address_hint}</span> : null}
                <time
                  dateTime={report.created_at}
                  title={formatDateTime(report.created_at, lang)}
                >
                  {formatRelative(report.created_at, lang)}
                </time>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
