import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  SEVERITY_LABELS,
  formatDateTime,
  formatRelative,
  getDictionary,
  type Lang,
} from "@/lib/i18n";
import type { SeverityLevel, Update } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Pinned notices, set as a strap line rather than as cards.
 *
 * On the home page these sit between the masthead and the action board, which
 * makes their height a direct tax on the fold: as full `UpdateCard`s, two pins
 * cost ~360px and pushed every actionable route off the first screen. As
 * single ruled rows they cost ~50px each and still carry the severity, the
 * headline and the time — everything a reader needs to decide whether to open
 * it. The full record, with its source and body, is one tap away.
 *
 * The feed below renders the same updates as cards, so nothing is lost by
 * compressing them here.
 */

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

export function PinnedAlerts({
  updates,
  lang,
  className,
}: {
  updates: Update[];
  lang: Lang;
  className?: string;
}) {
  const t = getDictionary(lang);
  if (updates.length === 0) return null;

  return (
    <section
      aria-label={t.updates.pinnedHeading}
      className={cn("border border-border bg-card", className)}
    >
      <h2 className="label-signage border-b border-border px-4 py-2 text-muted-foreground">
        {t.updates.pinnedHeading}
      </h2>

      <ul className="divide-y divide-border">
        {updates.map((update) => {
          const href = update.slug ? `/actualizaciones/${update.slug}` : null;

          const row = (
            <>
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-1",
                  SEVERITY_RAIL[update.severity],
                )}
                aria-hidden
              />
              {/*
               * The row reflows rather than dropping anything. On a phone the
               * chip, the time and the chevron sit on one line and the headline
               * takes the full width below (`basis-full`); from `sm` the CSS
               * `order`s swap back to chip · headline · time · chevron on a
               * single line. Letting the headline share a line with the chip at
               * 390px wrapped it to four lines and cost 100px a row — and the
               * age of a critical notice is exactly the thing a reader triages
               * on, so hiding the time on mobile was not an option.
               */}
              <span
                className={cn(
                  "label-signage order-1 inline-flex shrink-0 items-center rounded-sm border px-1.5 py-1",
                  SEVERITY_STYLES[update.severity],
                )}
              >
                {SEVERITY_LABELS[lang][update.severity]}
              </span>

              <span className="order-4 min-w-0 basis-full text-sm leading-snug font-semibold text-pretty sm:order-2 sm:flex-1 sm:basis-auto">
                {update.title}
              </span>

              {update.published_at ? (
                <time
                  dateTime={update.published_at}
                  title={formatDateTime(update.published_at, lang)}
                  className="order-2 ml-auto shrink-0 font-mono text-[0.6875rem] text-muted-foreground sm:order-3 sm:ml-0"
                >
                  {formatRelative(update.published_at, lang)}
                </time>
              ) : null}

              {href ? (
                <ChevronRight
                  className="order-3 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground sm:order-4"
                  aria-hidden
                />
              ) : null}
            </>
          );

          return (
            <li key={update.id} className="relative">
              {href ? (
                <Link
                  href={href}
                  className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 pr-4 pl-5 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {row}
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 pr-4 pl-5">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
