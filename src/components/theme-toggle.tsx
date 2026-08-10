"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Day/night switch. The default is the operating system's setting, so most
 * people never touch this — it exists for the case the site is built around:
 * reading in the dark on a phone whose owner keeps it in light mode.
 *
 * Both icons and both labels are always in the DOM, and the `dark:` variants
 * pick which pair is shown. That keeps server and client markup identical (no
 * `mounted` state, which the React Compiler's `set-state-in-effect` rule
 * rejects anyway) and makes the control correct on first paint rather than
 * after hydration — next-themes sets the class in a blocking script.
 * The accessible name comes from the sr-only text, so it tracks the theme too.
 */
export function ThemeToggle({
  lang,
  className,
}: {
  lang: Lang;
  className?: string;
}) {
  const t = getDictionary(lang).theme;
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("rounded-sm", className)}
    >
      <Moon className="size-3.5 dark:hidden" aria-hidden />
      <Sun className="hidden size-3.5 dark:block" aria-hidden />
      <span className="sr-only dark:hidden">{t.toDark}</span>
      <span className="sr-only hidden dark:inline">{t.toLight}</span>
    </Button>
  );
}
