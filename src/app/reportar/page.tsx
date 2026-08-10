import type { Metadata } from "next";
import { Phone, ShieldCheck } from "lucide-react";

import { ReportForm } from "@/components/report-form";
import { SectionHeading } from "@/components/section-heading";
import { getZones } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).form.heading };
}

export default async function ReportPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: zones } = await getZones();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading
        as="h1"
        title={t.form.heading}
        subtitle={t.form.subheading}
      />

      {/*
       * This has to be impossible to miss. The form is not an emergency line,
       * and someone filling it in while a wall is down is the exact failure
       * this block exists to prevent — so the number is a tap target set at
       * headline size, not a link inside a sentence.
       */}
      <aside className="mt-6 flex flex-col gap-3 border-2 border-down bg-down-muted p-4 text-down-foreground sm:flex-row sm:items-center">
        <a
          href="tel:123"
          aria-label={`${t.hero.emergencyCta}: 123`}
          className="flex shrink-0 items-center gap-2 bg-down px-4 py-2.5 font-mono text-2xl leading-none font-semibold tracking-tight text-down-contrast transition-opacity hover:opacity-90"
        >
          <Phone className="size-5" aria-hidden />
          123
        </a>
        <p className="text-sm leading-relaxed font-medium">
          {t.form.emergencyWarning}
        </p>
      </aside>

      <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.reports.moderationNote}
      </p>

      <div className="mt-8">
        <ReportForm lang={lang} zones={zones} />
      </div>
    </div>
  );
}
