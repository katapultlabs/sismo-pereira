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

/** Soft Linear-style pills — the tinted severity carries the alarm, the rest
 *  are neutral. No borders, no stamped boxes. */
const SEVERITY_STYLES: Record<SeverityLevel, string> = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-warn-muted text-warn-foreground",
  critical: "bg-down-muted text-down-foreground",
};

const PILL =
  "inline-flex items-center gap-1 rounded-full py-1 pr-2 pl-2.5 font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.06em] transition-colors group-hover:bg-background";

export function UpdateCard({
  update,
  lang,
  className,
}: {
  update: Update;
  lang: Lang;
  className?: string;
}) {
  const t = getDictionary(lang);
  const href = update.slug ? `/actualizaciones/${update.slug}` : null;

  return (
    <article
      className={cn(
        // Same idiom as the route and status tiles: a bordered field, no idle
        // fill, lifting onto a muted surface on hover. The subtle difference —
        // a severity pill row and a whole-card link — is the record's own.
        "group relative flex h-full w-full flex-col gap-2.5 rounded-sm border border-border p-4 transition-colors hover:border-foreground/30 hover:bg-muted",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn(PILL, SEVERITY_STYLES[update.severity])}>
          {SEVERITY_LABELS[lang][update.severity]}
        </span>
        {update.pinned ? (
          <span className={cn(PILL, "bg-muted text-muted-foreground")}>
            <Pin className="size-3" aria-hidden />
            {t.updates.pinned}
          </span>
        ) : null}
        {update.services.map((service) => (
          <span
            key={service}
            className={cn(PILL, "bg-secondary text-secondary-foreground")}
          >
            {SERVICE_LABELS[lang][service]}
          </span>
        ))}
      </div>

      <h3 className="display-condensed text-lg leading-tight font-bold text-balance">
        {href ? (
          <Link
            href={href}
            /* Whole-card target: these get tapped one-handed, in a hurry. */
            className="underline-offset-4 after:absolute after:inset-0 hover:underline"
          >
            {update.title}
          </Link>
        ) : (
          update.title
        )}
      </h3>

      {update.summary ? (
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
          {update.summary}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-2.5 font-mono text-[0.6875rem] text-muted-foreground">
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
    </article>
  );
}
