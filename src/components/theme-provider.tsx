"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * `next-themes` was already a dependency — `ui/sonner.tsx` calls `useTheme()` —
 * but nothing ever mounted the provider, so `.dark` was never applied and the
 * entire dark palette in `globals.css` was dead code.
 *
 * It defaults to the operating system's setting rather than forcing light:
 * phones switch themselves to dark at night, and this is a site people open at
 * 3am during a blackout, on battery, with a torch in the other hand.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
