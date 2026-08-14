import { ExternalLink } from "lucide-react";

import { ServiceIcon } from "@/components/service-icon";
import { StatusBadge } from "@/components/status-badge";
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
  showZone = false,
}: {
  status: ServiceStatus;
  lang: Lang;
  className?: string;
  style?: React.CSSProperties;
  /** Show the zone as the card's title — for the per-zone board on
   *  /servicios, where the same service appears once per zone. */
  showZone?: boolean;
}) {
  const t = getDictionary(lang);

  return (
    <article
      className={cn(
        /* Same idiom as the route tiles on the landing — a bordered field,
           no idle fill, lifting onto a muted surface on hover — with the
           status badge and the reading detail the route tiles don't carry. */
        "group flex flex-col gap-2 rounded-sm border border-border p-4 transition-colors hover:border-foreground/30 hover:bg-muted",
        className,
      )}
      style={style}
    >
      {/* Eyebrow row: the service, and its status badge (colour + icon +
          text) — the extra signal a route tile has no need for. */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="label-signage flex items-center gap-2 text-muted-foreground">
          <ServiceIcon service={status.service} className="size-3.5 shrink-0" />
          {SERVICE_LABELS[lang][status.service]}
        </h3>
        <StatusBadge status={status.status} lang={lang} />
      </div>

      {showZone ? (
        <p className="display-condensed text-lg leading-tight font-bold text-balance">
          {status.zone_name ?? t.status.noData}
        </p>
      ) : null}

      {status.headline ? (
        <p className="display-condensed text-lg leading-tight font-bold text-balance">
          {status.headline}
        </p>
      ) : null}

      {status.detail ? (
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
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

      {/* Attribution line, on its own rule — the same footer the route tiles
          carry, guaranteeing every claim its source and its time. */}
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
    </article>
  );
}
