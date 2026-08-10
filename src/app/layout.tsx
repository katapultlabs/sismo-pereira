import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { DEFAULT_LANG } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://sismo-pereira.vercel.app",
  ),
  title: {
    default: "Sismo Pereira — Información verificada en tiempo real",
    template: "%s · Sismo Pereira",
  },
  description:
    "Estado de servicios, reportes verificados y recursos de emergencia tras el " +
    "sismo del 10 de agosto de 2026 en Pereira, Risaralda.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Set by `src/proxy.ts`. Only the root layout can set <html lang>, and a
  // nested [lang] layout has no way to reach it.
  const lang = (await headers()).get("x-lang") ?? DEFAULT_LANG;

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
