import Link from "next/link";

import {
  SEVERITY_LABELS,
  getDictionary,
  type Lang,
} from "@/lib/i18n";
import type { Update } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Pinned notices, set as a ticker band on the alarm-tinted surface.
 *
 * A moving critical notice is a usability hazard, so the band earns its
 * motion back three ways: it pauses the moment a pointer or keyboard focus
 * enters (so any notice can be read and its link followed), it holds
 * completely still under `prefers-reduced-motion`, and the same notices are
 * present as a plain, static, screen-reader list. The band is chrome; the
 * list is the record.
 *
 * The visible track holds two identical copies of the notices so a -50%
 * translate lands on an exact period and the loop is seamless.
 */
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

  // Longer content scrolls proportionally slower, so reading speed stays even
  // regardless of how many notices are pinned.
  const duration = `${Math.max(24, updates.length * 12)}s`;

  const items = updates.map((update) => {
    const href = update.slug ? `/actualizaciones/${update.slug}` : null;
    const label = (
      <>
        {/* The one alarm accent — the severity, in the status red on the
            otherwise neutral band. */}
        <span className="label-signage shrink-0 text-[0.5625rem] text-down">
          {SEVERITY_LABELS[lang][update.severity]}
        </span>
        <span className="text-xs leading-none font-medium">{update.title}</span>
      </>
    );
    return { id: update.id, href, label };
  });

  const track = (
    <div className="marquee-track flex w-max shrink-0" aria-hidden>
      {[0, 1].map((copy) => (
        <div key={copy} className="flex shrink-0 items-center">
          {items.map((item) => (
            <span key={`${copy}-${item.id}`} className="flex items-center">
              <span className="mx-5 size-1 shrink-0 bg-border" />
              {item.href ? (
                <Link
                  href={item.href}
                  tabIndex={copy === 0 ? undefined : -1}
                  className="flex items-center gap-2.5 whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <section
      aria-label={t.updates.pinnedHeading}
      className={cn(
        "marquee-group overflow-hidden bg-background py-2 text-foreground",
        className,
      )}
      style={{ "--marquee-duration": duration } as React.CSSProperties}
    >
      {/* The static, ordered record — the source of truth for assistive tech,
          hidden from the visual ticker to avoid a double read. */}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.id}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          </li>
        ))}
      </ul>

      {track}
    </section>
  );
}
