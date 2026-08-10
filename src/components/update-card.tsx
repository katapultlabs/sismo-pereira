import Link from "next/link";
import { ExternalLink, Pin } from "lucide-react";

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

/** Stamped chip, shared by every label on the card. */
const CHIP = "label-signage inline-flex items-center gap-1 rounded-sm border px-1.5 py-1";

export function UpdateCard({ update, lang }: { update: Update; lang: Lang }) {
  const t = getDictionary(lang);
  const href = update.slug ? `/actualizaciones/${update.slug}` : null;

  return (
    <article className="relative overflow-hidden border border-border bg-card">
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          SEVERITY_RAIL[update.severity],
        )}
        aria-hidden
      />

      <div className="flex flex-col gap-2.5 p-4 pl-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(CHIP, SEVERITY_STYLES[update.severity])}>
            {SEVERITY_LABELS[lang][update.severity]}
          </span>
          {update.pinned ? (
            <span className={cn(CHIP, "border-border text-muted-foreground")}>
              <Pin className="size-3" aria-hidden />
              {t.updates.pinned}
            </span>
          ) : null}
          {update.services.map((service) => (
            <span
              key={service}
              className={cn(CHIP, "border-transparent bg-secondary text-secondary-foreground")}
            >
              {SERVICE_LABELS[lang][service]}
            </span>
          ))}
        </div>

        <h3 className="display-condensed text-xl leading-tight font-bold text-balance">
          {href ? (
            <Link
              href={href}
              /* Whole-card target: these get tapped one-handed, in a hurry. */
              className="after:absolute after:inset-0 hover:underline underline-offset-4"
            >
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

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
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
            <span className="font-semibold text-foreground">
              {update.source_name}
            </span>
          ) : null}
          {update.source_url ? (
            <a
              href={update.source_url}
              target="_blank"
              rel="noreferrer noopener"
              /* Lifted above the title's ::after overlay so it stays clickable. */
              className="relative z-10 inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            >
              {t.updates.viewSource}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
