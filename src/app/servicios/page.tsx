import type { Metadata } from "next";
import { Info } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { ServiceIcon } from "@/components/service-icon";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { getServiceStatus } from "@/lib/data";
import {
  SERVICE_LABELS,
  formatDateTime,
  formatRelative,
  getDictionary,
} from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import type { ServiceStatus, ServiceType } from "@/lib/types";

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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.status.heading}
        </h1>
        <p className="text-muted-foreground">{t.status.viewAll}</p>
      </header>

      {degraded ? (
        <div className="mt-6">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      <Alert className="mt-6">
        <Info className="size-4" aria-hidden />
        <AlertDescription>{t.status.unknownNotice}</AlertDescription>
      </Alert>

      <div className="mt-8 space-y-8">
        {[...grouped.entries()].map(([service, rows]) => (
          <section key={service} className="space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <ServiceIcon service={service} className="size-5 text-muted-foreground" />
              {SERVICE_LABELS[lang][service]}
            </h2>

            <Card className="overflow-hidden p-0">
              <ul className="divide-y">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">
                        {row.zone_name ?? t.status.noData}
                      </p>
                      {row.headline ? (
                        <p className="text-sm text-foreground">{row.headline}</p>
                      ) : null}
                      {row.detail ? (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {row.detail}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {row.org_short_name ?? row.org_name ?? ""}
                        {row.org_name ? " · " : ""}
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
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
