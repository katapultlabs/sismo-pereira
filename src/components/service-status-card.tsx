import { ExternalLink } from "lucide-react";

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
  className,
  style,
}: {
  status: ServiceStatus;
  lang: Lang;
  className?: string;
  style?: React.CSSProperties;
}) {
  const t = getDictionary(lang);

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden border border-border bg-card",
        className,
      )}
      style={style}
    >
      {/* Accent rail: lets someone scan the grid for red without reading. */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          STATUS_ACCENT[status.status],
        )}
        aria-hidden
      />

      <div className="flex flex-1 flex-col gap-3 p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="label-signage flex items-center gap-2 pt-1 text-muted-foreground">
            <ServiceIcon service={status.service} className="size-4 shrink-0" />
            {SERVICE_LABELS[lang][status.service]}
          </h3>
          <StatusBadge status={status.status} lang={lang} />
        </div>

        {status.headline ? (
          <p className="text-[0.9375rem] leading-snug font-semibold text-balance">
            {status.headline}
          </p>
        ) : null}

        {status.detail ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {status.detail}
          </p>
        ) : null}

        {status.affected_users != null || status.eta_restored ? (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            {status.affected_users != null ? (
              <div className="flex gap-1">
                <dt className="sr-only">{t.status.affected}</dt>
                <dd>
                  <span
                    data-readout
                    className="font-mono font-semibold text-foreground"
                  >
                    {new Intl.NumberFormat(
                      lang === "es" ? "es-CO" : "en-GB",
                    ).format(status.affected_users)}
                  </span>{" "}
                  {t.status.affected}
                </dd>
              </div>
            ) : null}
            {status.eta_restored ? (
              <div className="flex gap-1">
                <dt>{t.status.eta}:</dt>
                <dd data-readout className="font-mono font-medium text-foreground">
                  {formatDateTime(status.eta_restored, lang)}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {/* Attribution line. Every claim on this site carries its source and
            its time — this is the footer that guarantees it. */}
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-2.5 font-mono text-[0.6875rem] text-muted-foreground">
          {status.org_short_name || status.org_name ? (
            <span className="font-semibold text-foreground">
              {status.org_short_name ?? status.org_name}
            </span>
          ) : null}
          <time
            dateTime={status.reported_at}
            title={formatDateTime(status.reported_at, lang)}
          >
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
    </article>
  );
}
