import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Set by `src/proxy.ts` from the lang cookie or the browser locale.
  const lang = await getLang();
  const t = getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
        >
          {t.nav.skipToContent}
        </a>
        <SiteHeader lang={lang} />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <SiteFooter lang={lang} />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
