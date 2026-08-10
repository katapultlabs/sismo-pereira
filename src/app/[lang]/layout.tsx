import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { LANGS, getDictionary, isLang } from "@/lib/i18n";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);

  return {
    title: { default: t.meta.title, template: "%s · Sismo Pereira" },
    description: t.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: { es: "/es", en: "/en" },
    },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      locale: lang === "es" ? "es_CO" : "en_GB",
      type: "website",
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);

  return (
    <>
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
    </>
  );
}
