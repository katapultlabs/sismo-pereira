import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";

import { DonateBar } from "@/components/donate-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getDictionary, SITE_META } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import "./globals.css";

/*
 * Three faces, each with a job. All are self-hosted and subset to `latin`,
 * which covers the accents and inverted punctuation Spanish needs (á é í ó ú
 * ñ ü ¿ ¡) without pulling the full character set over a degraded connection.
 */

/** Display. A grotesque with signage lineage and a real width axis, so
 *  headlines can be set condensed like a departure board. */
const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

/** Body. Humanist, open apertures, tall x-height — chosen to survive a cracked
 *  screen at small sizes rather than to look interesting. */
const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

/** Readout. Timestamps, magnitudes, phone numbers, zone codes — anything the
 *  reader treats as an instrument value. Not preloaded: it is always secondary
 *  to the body text, so it should not compete for the first bytes. */
const readout = IBM_Plex_Mono({
  variable: "--font-readout",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

/**
 * Site-level metadata. Note there is no `await getLang()` here, and that is the
 * point: the share card and the indexed description are bilingual constants
 * (see `SITE_META`), so they read the same whoever — or whatever — fetched the
 * page. Per-page `<title>`s still resolve to the reader's language through the
 * `%s` template; it is only this outermost card that is fixed.
 *
 * No `openGraph.images`: there is no share image, and Next would happily emit a
 * tag pointing at one that does not exist.
 */
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://sismopereira.org",
    ),
    title: { default: SITE_META.title, template: `%s · ${SITE_META.name}` },
    description: SITE_META.description,
    robots: { index: true, follow: true },
    openGraph: {
      siteName: SITE_META.name,
      title: SITE_META.title,
      description: SITE_META.description,
      // One URL serves both languages, so the alternate is a locale, not a
      // second href — there is no `/en` to point an hreflang at.
      locale: "es_CO",
      alternateLocale: ["en_US"],
      type: "website",
    },
    twitter: {
      // Declared rather than inferred: with no image, X falls back to `summary`
      // anyway, and saying so keeps the card from changing under us.
      card: "summary",
      title: SITE_META.title,
      description: SITE_META.description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    // Match the paper/ink substrates so the browser chrome joins the page.
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Set by `src/proxy.ts` from the lang cookie or the browser locale.
  const lang = await getLang();
  const t = getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${display.variable} ${body.variable} ${readout.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-sm focus:bg-foreground focus:px-4 focus:py-2 focus:text-background focus:ring-2 focus:ring-ring"
          >
            {t.nav.skipToContent}
          </a>
          <SiteHeader lang={lang} />
          {/* Outside <main> and after the header: it is chrome, not content,
              and it scrolls away rather than joining the sticky masthead. */}
          <DonateBar lang={lang} />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter lang={lang} />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
