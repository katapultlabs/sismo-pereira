import type { Metadata } from "next";
import { Info } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { SectionHeading } from "@/components/section-heading";
import { ServiceIcon } from "@/components/service-icon";
import { STATUS_ACCENT, StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getServiceStatus } from "@/lib/data";
import {
  SERVICE_LABELS,
  formatDateTime,
  formatRelative,
  getDictionary,
} from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import type { ServiceStatus, ServiceType } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).status.heading };
}

export default async function ServicesPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: statuses, degraded } = await getServiceStatus();

  // Group by service so a reader scans "electricity" once, then reads zones.
  const grouped = statuses.reduce<Map<ServiceType, ServiceStatus[]>>((acc, s) => {
    const list = acc.get(s.service) ?? [];
    list.push(s);
    acc.set(s.service, list);
    return acc;
  }, new Map());

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading
        as="h1"
        title={t.status.heading}
        subtitle={t.status.viewAll}
      />

      {degraded ? (
        <div className="mt-6">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      <Alert className="mt-6 rounded-sm">
        <Info className="size-4" aria-hidden />
        <AlertDescription>{t.status.unknownNotice}</AlertDescription>
      </Alert>

      {/* One board per service. Rows are zone records, read top to bottom. */}
      <div className="mt-10 space-y-8">
        {[...grouped.entries()].map(([service, rows], groupIndex) => (
          <section key={service}>
            <h2 className="label-signage flex items-center gap-2 border-b border-foreground/25 pb-2 text-muted-foreground">
              <ServiceIcon service={service} className="size-4" />
              {SERVICE_LABELS[lang][service]}
              <span data-readout className="ml-auto tabular-nums">
                {String(groupIndex + 1).padStart(2, "0")}
              </span>
            </h2>

            <ul>
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="relative flex flex-col gap-2 border-b border-border py-4 pl-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 w-1",
                      STATUS_ACCENT[row.status],
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="display-condensed text-base font-bold">
                      {row.zone_name ?? t.status.noData}
                    </p>
                    {row.headline ? (
                      <p className="text-sm font-medium">{row.headline}</p>
                    ) : null}
                    {row.detail ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {row.detail}
                      </p>
                    ) : null}
                    <p className="flex flex-wrap items-center gap-x-2 font-mono text-[0.6875rem] text-muted-foreground">
                      {row.org_short_name || row.org_name ? (
                        <span className="font-semibold text-foreground">
                          {row.org_short_name ?? row.org_name}
                        </span>
                      ) : null}
                      <time
                        dateTime={row.reported_at}
                        title={formatDateTime(row.reported_at, lang)}
                      >
                        {t.status.updated} {formatRelative(row.reported_at, lang)}
                      </time>
                    </p>
                  </div>
                  <StatusBadge
                    status={row.status}
                    lang={lang}
                    size="lg"
                    className="shrink-0 self-start"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
