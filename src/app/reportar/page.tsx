import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Megaphone,
  Phone,
  ShieldCheck,
  UserSearch,
  Zap,
} from "lucide-react";

import { ReportForm } from "@/components/report-form";
import { SectionHeading } from "@/components/section-heading";
import {
  getOrganizations,
  getServiceReportDensity,
  getZones,
} from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { instrumentOpen } from "@/lib/service-instruments";
import type { ServiceReportDensity } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).triage.heading };
}

/* The door readouts are live counts; a cached zero reads as "nobody is
 * reporting" rather than "stale page". */
export const dynamic = "force-dynamic";

/** Households that reported in the density window, across all zones. */
function households(rows: ServiceReportDensity[]): number {
  return rows.reduce((acc, r) => acc + Number(r.total_count), 0);
}

/**
 * The intake triage — the funnel's one question: *what do you want to
 * report?* Each door leads to the form whose rows actually reach someone who
 * can act, which is the whole argument for having doors instead of one form:
 *
 * - electricity and water go to their collection instruments (`/luz`,
 *   `/agua`), read by the operating utility;
 * - a missing person goes to Cruz Roja's official registry via `/enlaces`
 *   (we do not run one — docs/DECISIONS.md);
 * - everything else lands on the moderated community form, right below on
 *   this page.
 *
 * Same rule as the home page's route tiles: a door carries a live readout,
 * and the number on it is the number the reader finds on the far side.
 */
export default async function ReportPage() {
  const lang = await getLang();
  const t = getDictionary(lang);

  const [
    { data: zones },
    { data: luzDensity, degraded: luzDegraded },
    { data: aguaDensity, degraded: aguaDegraded },
    { data: orgs, degraded: orgsDegraded },
  ] = await Promise.all([
    getZones(),
    getServiceReportDensity("electricity"),
    getServiceReportDensity("water"),
    getOrganizations(),
  ]);

  const aguaOpen = !orgsDegraded && instrumentOpen("water", orgs);

  const doors = [
    {
      href: "/luz",
      icon: Zap,
      title: t.triage.luzTitle,
      sub: t.triage.luzSub,
      readout: luzDegraded
        ? null
        : t.triage.householdsReadout(households(luzDensity)),
    },
    {
      href: "/agua",
      icon: Droplets,
      title: t.triage.aguaTitle,
      sub: t.triage.aguaSub,
      readout: aguaOpen
        ? aguaDegraded
          ? null
          : t.triage.householdsReadout(households(aguaDensity))
        : t.triage.aguaClosed,
    },
    {
      href: "/enlaces#personas-desaparecidas",
      icon: UserSearch,
      title: t.triage.personTitle,
      sub: t.triage.personSub,
      readout: null,
    },
    {
      href: "#formulario",
      icon: Megaphone,
      title: t.triage.otherTitle,
      sub: t.triage.otherSub,
      readout: t.triage.otherReadout,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading
        as="h1"
        title={t.triage.heading}
        subtitle={t.triage.subheading}
      />

      {/*
       * Life safety before the doors — this page's first instruction is still
       * "if it is an emergency, this is not the place". The number is a tap
       * target set at headline size, not a link inside a sentence.
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

      {/* The doors. Achromatic, like every nav plate — the four status hues
          and the brand volt keep their jobs. */}
      <nav aria-label={t.triage.heading} className="mt-8 grid gap-3 sm:grid-cols-2">
        {doors.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="group flex flex-col gap-2 rounded-sm border border-border bg-card p-4 transition-colors outline-none hover:border-foreground/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2.5">
              <door.icon
                className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden
              />
              <span className="display-condensed flex-1 text-lg leading-tight font-bold uppercase">
                {door.title}
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </span>
            <span className="text-sm leading-snug text-muted-foreground">
              {door.sub}
            </span>
            {door.readout ? (
              <span
                data-readout
                className="label-signage mt-auto pt-1 text-[0.625rem] text-muted-foreground"
              >
                {door.readout}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {/*
       * The community form, on the same page under its own rule. The anchor is
       * load-bearing: the "otra cosa" door above and /agua's closed state both
       * target it — `scroll-mt-20` clears the sticky masthead.
       */}
      <section id="formulario" className="mt-14 scroll-mt-20">
        <SectionHeading
          index="02"
          title={t.triage.otherFormHeading}
          subtitle={t.form.subheading}
        />

        <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t.reports.moderationNote}
        </p>

        <div className="mt-8">
          <ReportForm lang={lang} zones={zones} />
        </div>
      </section>

      <p className="mt-10 text-center">
        <Link
          href="/reportes"
          className="label-signage inline-flex items-center gap-1.5 text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {t.nav.reports}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </p>
    </div>
  );
}
