"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { LANGS, type Lang } from "@/lib/i18n";
import { setLanguage } from "@/lib/lang-actions";
import { cn } from "@/lib/utils";

const LABELS: Record<Lang, { short: string; full: string }> = {
  es: { short: "ES", full: "Español" },
  en: { short: "EN", full: "English" },
};

/**
 * Segmented language switch.
 *
 * Writes a cookie and re-renders on the server rather than swapping strings on
 * the client, so the language survives a reload, a shared link opened later,
 * and a visitor with JS disabled after their first choice.
 */
export function LanguageToggle({ current }: { current: Lang }) {
  const [pending, startTransition] = useTransition();

  function choose(lang: Lang) {
    if (lang === current) return;
    startTransition(() => setLanguage(lang));
  }

  return (
    <div
      role="group"
      aria-label={current === "es" ? "Idioma" : "Language"}
      className={cn(
        "flex items-center rounded-sm border border-border",
        pending && "opacity-60",
      )}
    >
      {LANGS.map((lang) => (
        <Button
          key={lang}
          size="xs"
          variant="ghost"
          aria-pressed={lang === current}
          title={LABELS[lang].full}
          onClick={() => choose(lang)}
          className={cn(
            // Stamped, not pill-shaped — it reads as part of the masthead plate.
            "rounded-none px-1.5 font-mono text-[0.6875rem] font-medium tracking-wider first:rounded-l-[2px] last:rounded-r-[2px]",
            lang === current
              ? "bg-foreground text-background hover:bg-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LABELS[lang].short}
          <span className="sr-only"> — {LABELS[lang].full}</span>
        </Button>
      ))}
    </div>
  );
}
