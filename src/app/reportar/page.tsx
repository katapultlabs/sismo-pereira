import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Droplets,
  Phone,
  ShieldCheck,
  UserSearch,
  Zap,
} from "lucide-react";

import { ReportForm } from "@/components/report-form";
import { SectionHeading } from "@/components/section-heading";
import { getZones } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).form.heading };
}

/**
 * The general report form, form-first. The funnel's triage lives on the home
 * page now; this page exists to *file a report*, so the form starts
 * immediately. The three special cases (the two utility instruments, a
 * missing person) are one slim chip row — a reader who took a wrong door
 * loses one tap, not a page.
 */
export default async function ReportPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: zones } = await getZones();

  const chips = [
    { href: "/luz", icon: Zap, label: t.triage.luzTitle },
    { href: "/agua", icon: Droplets, label: t.triage.aguaTitle },
    {
      href: "/enlaces#personas-desaparecidas",
      icon: UserSearch,
      label: t.triage.personTitle,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading
        as="h1"
        title={t.form.heading}
        subtitle={t.form.subheading}
      />

      {/* Life safety first, always: the form is not an emergency line. */}
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

      {/* The wrong-door escape hatch: one row, not an interstitial. */}
      <nav
        aria-label={t.triage.heading}
        className="mt-5 flex flex-wrap items-center gap-2"
      >
        <span className="label-signage text-muted-foreground">
          {t.triage.heading}
        </span>
        {chips.map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className="label-signage inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-2 transition-colors outline-none hover:border-foreground/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <chip.icon className="size-3.5" aria-hidden />
            {chip.label}
            <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        ))}
      </nav>

      <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.reports.moderationNote}
      </p>

      {/* `#formulario` is load-bearing: /agua's closed state links here. */}
      <div id="formulario" className="mt-8 scroll-mt-20">
        <ReportForm lang={lang} zones={zones} />
      </div>
    </div>
  );
}
