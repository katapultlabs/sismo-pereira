"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Phone, TriangleAlert } from "lucide-react";

import { MEDICAL_CENTRES_CLOSED, PMU_REPORT } from "@/lib/fallback-data";
import { formatDateTime, getDictionary, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** The closures card is always critical; the pill says so. */
const SEVERITY_LABEL: Record<Lang, string> = {
  es: "Crítico",
  en: "Critical",
};

/**
 * The closures warning — a calm, elevated Linear-style card: a neutral dark
 * surface, a red status pill, a headline, and a collapsible body with the
 * four centres and the source. Shared by the desktop fixed widget and the
 * mobile in-flow stack so both read identically.
 */
function MedicalCard({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-popover shadow-xl shadow-black/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="closures-detail"
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
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
                !open && "rotate-180",
              )}
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
        id="closures-detail"
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
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
  );
}

/**
 * The "call 123" plate — the alarm-red life-safety action, centred: an
 * eyebrow, the single "Call 123" instruction, and the one-line reason. Used
 * in the mobile stack (the desktop keeps only the closures card, since the
 * header carries a 123 button).
 */
function Call123Card({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  return (
    <a
      href="tel:123"
      className="flex flex-col items-center gap-2.5 rounded-sm bg-down p-5 text-center text-down-contrast transition-opacity outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="label-signage inline-flex items-center gap-2">
        <Phone className="size-3.5 shrink-0" aria-hidden />
        {t.actions.emergency.eyebrow}
      </span>
      <span className="display-condensed text-3xl font-extrabold uppercase">
        {t.actions.emergency.title}
      </span>
      <span className="max-w-xs text-sm leading-relaxed text-pretty">
        {t.actions.emergency.body}
      </span>
    </a>
  );
}

/**
 * Desktop life safety — the closures card fixed to the viewport's bottom-right
 * on `lg`, so it stays reachable through the whole scroll. Renders nothing
 * below `lg`; `HeroSafetyMobile` carries it in the flow there.
 */
export function HeroSafety({ lang }: { lang: Lang }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 hidden w-64 lg:block">
      <div className="pointer-events-auto">
        <MedicalCard lang={lang} />
      </div>
    </div>
  );
}

/** Mobile life safety — the 123 plate and the closures card, in the flow. */
export function HeroSafetyMobile({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3 lg:hidden">
      <Call123Card lang={lang} />
      <MedicalCard lang={lang} />
    </div>
  );
}
