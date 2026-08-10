import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";

import { ReportForm } from "@/components/report-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getZones } from "@/lib/data";
import { getDictionary, isLang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reportar">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getDictionary(lang).form.heading };
}

export default async function ReportPage({
  params,
}: PageProps<"/[lang]/reportar">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const { data: zones } = await getZones();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.form.heading}
        </h1>
        <p className="text-muted-foreground">{t.form.subheading}</p>
      </header>

      {/* This has to be impossible to miss. The form is not an emergency line. */}
      <Alert className="mt-6 border-down/40 bg-down-muted text-down-foreground">
        <Phone className="size-4" aria-hidden />
        <AlertTitle>
          <a href="tel:123" className="font-mono underline underline-offset-4">
            123
          </a>
        </AlertTitle>
        <AlertDescription className="text-down-foreground/80">
          {t.form.emergencyWarning}
        </AlertDescription>
      </Alert>

      <p className="mt-6 text-sm text-muted-foreground">
        {t.reports.moderationNote}
      </p>

      <div className="mt-8">
        <ReportForm lang={lang} zones={zones} />
      </div>
    </div>
  );
}
