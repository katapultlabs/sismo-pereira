"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A live Bogotá clock, set like an instrument readout: `[ • 21:32:21 ]`.
 *
 * This is the one piece of chrome that *is* data: the site's whole promise
 * is "every item shows its time", and the running clock is that promise made
 * visible. Renders dashes until the first client tick so server and client
 * markup never disagree; the interval callback is async, which keeps the
 * React Compiler's set-state-in-effect rule satisfied.
 */
export function LocalClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const text = now
    ? new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/Bogota",
      }).format(now)
    : "--:--:--";

  return (
    <span
      className={cn(
        "label-signage inline-flex items-center gap-2 tabular-nums",
        className,
      )}
    >
      <span aria-hidden>[</span>
      {/* The carrier light: a slow breath, not a blip. */}
      <span className="animate-blink size-1.5 shrink-0 bg-ember" aria-hidden />
      <time suppressHydrationWarning>{text}</time>
      <span aria-hidden>]</span>
    </span>
  );
}
