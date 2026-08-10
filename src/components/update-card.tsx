import Link from "next/link";
import { ExternalLink, Pin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  SERVICE_LABELS,
  SEVERITY_LABELS,
  SOURCE_LABELS,
  formatDateTime,
  formatRelative,
  getDictionary,
  type Lang,
} from "@/lib/i18n";
import type { SeverityLevel, Update } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<SeverityLevel, string> = {
  info: "bg-muted text-muted-foreground border-border",
  warning: "bg-warn-muted text-warn-foreground border-warn/40",
  critical: "bg-down-muted text-down-foreground border-down/40",
};

const SEVERITY_RAIL: Record<SeverityLevel, string> = {
  info: "bg-border",
  warning: "bg-warn",
  critical: "bg-down",
};

export function UpdateCard({ update, lang }: { update: Update; lang: Lang }) {
  const t = getDictionary(lang);
  const href = update.slug ? `/actualizaciones/${update.slug}` : null;

  return (
    <Card className="relative gap-0 overflow-hidden p-0">
      <div
        className={cn("absolute inset-y-0 left-0 w-1", SEVERITY_RAIL[update.severity])}
        aria-hidden
      />
      <article className="flex flex-col gap-2.5 p-5 pl-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={SEVERITY_STYLES[update.severity]}>
            {SEVERITY_LABELS[lang][update.severity]}
          </Badge>
          {update.pinned ? (
            <Badge variant="outline" className="gap-1">
              <Pin className="size-3" aria-hidden />
              {t.updates.pinned}
            </Badge>
          ) : null}
          {update.services.map((service) => (
            <Badge key={service} variant="secondary">
              {SERVICE_LABELS[lang][service]}
            </Badge>
          ))}
        </div>

        <h3 className="text-lg leading-snug font-semibold tracking-tight text-balance">
          {href ? (
            <Link href={href} className="hover:underline underline-offset-4">
              {update.title}
            </Link>
          ) : (
            update.title
          )}
        </h3>

        {update.summary ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {update.summary}
          </p>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {update.published_at ? (
            <time
              dateTime={update.published_at}
              title={formatDateTime(update.published_at, lang)}
            >
              {formatRelative(update.published_at, lang)}
            </time>
          ) : null}
          <span className="text-border" aria-hidden>
            ·
          </span>
          <span>{SOURCE_LABELS[lang][update.source]}</span>
          {update.source_name ? (
            <span className="font-medium text-foreground">{update.source_name}</span>
          ) : null}
          {update.source_url ? (
            <a
              href={update.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            >
              {t.updates.viewSource}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </article>
    </Card>
  );
}
