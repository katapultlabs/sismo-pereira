import { cn } from "@/lib/utils";

/**
 * The bulletin's section rule: a hairline, a numbered index, and a condensed
 * signage title. Repeating this exact structure on every page is what makes
 * the site read as one printed document rather than a stack of cards — so
 * prefer adding a variant here over hand-rolling a heading in a page.
 */
export function SectionHeading({
  index,
  title,
  subtitle,
  action,
  centered = false,
  className,
  as: Heading = "h2",
}: {
  /** Two-digit section number, e.g. "02". Purely typographic ordering. */
  index?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Centered variant: no rule, no index, title and subtitle centered — for
   *  sections that open like a statement rather than a bulletin record. */
  centered?: boolean;
  className?: string;
  as?: "h1" | "h2";
}) {
  if (centered) {
    return (
      <header className={cn("flex flex-col items-center text-center", className)}>
        <Heading
          className={cn(
            "display-condensed font-extrabold uppercase",
            Heading === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
          )}
        >
          {title}
        </Heading>
        {subtitle ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </header>
    );
  }

  return (
    <header className={cn("border-t border-foreground/25 pt-3", className)}>
      {/* Title and subtitle share a column so that when `action` wraps on a
          narrow screen it drops below both, rather than splitting the heading
          from the line that explains it. */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <div className="flex items-baseline gap-3">
            {index ? (
              <span
                data-readout
                aria-hidden
                className="label-signage shrink-0 text-muted-foreground"
              >
                {index}
              </span>
            ) : null}
            <Heading
              className={cn(
                "display-condensed font-extrabold uppercase",
                Heading === "h1" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
              )}
            >
              {title}
            </Heading>
          </div>
          {subtitle ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
