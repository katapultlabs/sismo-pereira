"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, TriangleAlert } from "lucide-react";

import {
  MEDICAL_CENTRES_CLOSED,
  PMU_REPORT,
} from "@/lib/fallback-data";
import { formatDateTime, getDictionary, type Lang } from "@/lib/i18n";

/**
 * The two standing life-safety instructions, fixed to the viewport's
 * bottom-right on `lg` so they stay reachable through the whole scroll — a
 * crisis site should never put "call 123" more than a glance away.
 *
 * Reworked in the calm, elevated idiom of a Linear card: a neutral dark
 * surface with a hairline border and a soft shadow, colour spent only where
 * it means something — the red "123", the red status pill. The closures card
 * collapses to its headline and expands to the four centres and the source.
 *
 * Below `lg` this renders nothing; `EmergencyPlates` carries the same two
 * instructions in the page flow there.
 */
export function HeroSafety({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 hidden w-64 flex-col gap-2.5 lg:flex">
      {/* Closures — a Linear-style item card: status pill, title, and a
          collapsible detail body. */}
      <div className="pointer-events-auto overflow-hidden rounded-sm border border-border bg-popover shadow-xl shadow-black/40">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="hero-closures-detail"
          className="flex w-full flex-col gap-2.5 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-down/15 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide text-down uppercase">
              <TriangleAlert className="size-3 shrink-0" aria-hidden />
              {SEVERITY_LABEL[lang]}
            </span>
            <span className="flex items-center gap-2">
              <span
                data-readout
                className="text-[0.625rem] tabular-nums text-muted-foreground"
              >
                {t.actions.medical.count(MEDICAL_CENTRES_CLOSED.length)}
              </span>
              {/* Idle points up, opens to point down. */}
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                  open ? "" : "rotate-180"
                }`}
                aria-hidden
              />
            </span>
          </span>
          <span className="text-[0.8125rem] leading-snug font-semibold text-balance text-foreground">
            {t.actions.medical.title}
          </span>
          <span className="text-[0.6875rem] leading-snug text-pretty text-down-foreground/80">
            {t.actions.medical.short}
          </span>
        </button>

        {/* Grid-rows 0fr→1fr gives a smooth height reveal; the global
            reduced-motion rule collapses the transition to instant. */}
        <div
          id="hero-closures-detail"
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-border px-4 py-3">
              <ul className="space-y-1.5">
                {MEDICAL_CENTRES_CLOSED.map((centre) => (
                  <li
                    key={centre.name}
                    className="flex items-baseline gap-2 text-xs leading-snug text-muted-foreground"
                  >
                    <span
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-down"
                      aria-hidden
                    />
                    <span className="min-w-0">{centre.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[0.625rem] leading-snug text-muted-foreground">
                {t.resources.medical.sourceLabel}: {PMU_REPORT.orgShortName} ·{" "}
                <span data-readout>
                  {formatDateTime(PMU_REPORT.reportedAt, lang)}
                </span>
              </p>
              <Link
                href="/recursos#centros-medicos"
                className="mt-3 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t.actions.medical.cta}
                <ArrowRight className="size-3 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/** The closures card is always critical; the pill says so. */
const SEVERITY_LABEL: Record<Lang, string> = {
  es: "Crítico",
  en: "Critical",
};
