import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";

import { DonateBar } from "@/components/donate-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getDictionary } from "@/lib/i18n";
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

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = getDictionary(lang);

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://sismopereira.org",
    ),
    title: { default: t.meta.title, template: "%s · Sismo Pereira" },
    description: t.meta.description,
    robots: { index: true, follow: true },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      locale: lang === "es" ? "es_CO" : "en_GB",
      type: "website",
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
