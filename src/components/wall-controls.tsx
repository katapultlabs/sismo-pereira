"use client";

import { usePathname } from "next/navigation";

import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Lang } from "@/lib/i18n";

/**
 * The language and theme controls, pinned to the top-right of the content
 * column on `lg` (below `lg` the masthead carries them). The home page renders
 * its own pair beside the news ticker, so this yields there to avoid doubling
 * up.
 */
export function WallControls({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    /* `min-h` + `mb-3` mirror the rail's wordmark row, so the page content
       below lands level with the first nav plate (SERVICES). */
    <div className="mb-3 hidden min-h-[2.5625rem] items-center justify-end gap-2 lg:flex">
      <LanguageToggle current={lang} />
      <ThemeToggle lang={lang} className="size-[1.625rem] shrink-0" />
    </div>
  );
}
