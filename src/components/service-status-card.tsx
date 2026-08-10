import { ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ServiceIcon } from "@/components/service-icon";
import { STATUS_ACCENT, StatusBadge } from "@/components/status-badge";
import {
  SERVICE_LABELS,
  formatDateTime,
  formatRelative,
  getDictionary,
  type Lang,
} from "@/lib/i18n";
import type { ServiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ServiceStatusCard({
  status,
  lang,
}: {
  status: ServiceStatus;
  lang: Lang;
}) {
  const t = getDictionary(lang);

  return (
    <Card className="relative gap-0 overflow-hidden p-0">
      {/* Accent rail: lets someone scan the grid for red without reading. */}
      <div
        className={cn("absolute inset-y-0 left-0 w-1", STATUS_ACCENT[status.status])}
        aria-hidden
      />
      <div className="flex flex-col gap-3 p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ServiceIcon
              service={status.service}
              className="size-5 shrink-0 text-muted-foreground"
            />
            <h3 className="leading-tight font-semibold">
              {SERVICE_LABELS[lang][status.service]}
            </h3>
          </div>
          <StatusBadge status={status.status} lang={lang} />
        </div>

        {status.headline ? (
          <p className="text-sm leading-snug font-medium text-foreground">
            {status.headline}
          </p>
        ) : null}

        {status.detail ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {status.detail}
          </p>
        ) : null}

        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {status.affected_users != null ? (
            <div className="flex gap-1">
              <dt className="sr-only">{t.status.affected}</dt>
              <dd>
                <span className="font-mono font-medium text-foreground">
                  {new Intl.NumberFormat(lang === "es" ? "es-CO" : "en-GB").format(
                    status.affected_users,
                  )}
                </span>{" "}
                {t.status.affected}
              </dd>
            </div>
          ) : null}
          {status.eta_restored ? (
            <div className="flex gap-1">
              <dt>{t.status.eta}:</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(status.eta_restored, lang)}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          {status.org_short_name || status.org_name ? (
            <span className="font-medium text-foreground">
              {status.org_short_name ?? status.org_name}
            </span>
          ) : null}
          <time dateTime={status.reported_at} title={formatDateTime(status.reported_at, lang)}>
            {t.status.updated} {formatRelative(status.reported_at, lang)}
          </time>
          {status.source_url ? (
            <a
              href={status.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            >
              {t.status.source}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
