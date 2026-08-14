"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUpRight, HeartHandshake, Megaphone } from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { EMERGENCY_LINES } from "@/lib/fallback-data";
import { getDictionary, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The site's primary navigation from `lg`: a full-height vertical rail. The
 * five section routes as plates, the two action plates (Report in the alarm
 * red, Donate in inverted ink), the emergency-lines directory, and the
 * language/theme controls at the foot. Below `lg` the horizontal `SiteHeader`
 * carries navigation instead, and the home page repeats the plates as a
 * 2-up grid inside its fold.
 *
 * A client component so it can mark the active route.
 */

/** The five section routes, one plate each, with the active one highlighted. */
export function RailRoutes({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const pathname = usePathname();

  return (
    <>
      {(
        [
          { index: "01", label: t.nav.services, href: "/servicios", wide: false },
          { index: "02", label: t.nav.reports, href: "/reportes", wide: false },
          { index: "03", label: t.nav.resources, href: "/recursos", wide: false },
          { index: "04", label: t.nav.links, href: "/enlaces", wide: false },
          {
            index: "05",
            label: t.nav.partners,
            href: "/organizaciones",
            wide: true,
          },
        ] as const
      ).map((item) => {
        const active = pathname === item.href;
        return (
          /* `col-span-2` fills the row in the mobile 2-up grid (ignored in the
             desktop flex rail). */
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-sm px-3.5 py-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-accent text-foreground"
                : "bg-secondary text-foreground hover:bg-accent",
              item.wide && "col-span-2",
            )}
          >
            <span
              data-readout
              className={cn(
                "shrink-0 font-mono text-xs font-semibold",
                active ? "text-ember" : "text-muted-foreground",
              )}
            >
              {item.index}
            </span>
            <span className="display-condensed min-w-0 flex-1 text-base leading-tight font-bold uppercase lg:text-sm">
              {item.label}
            </span>
            <ArrowUpRight
              className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
              aria-hidden
            />
          </Link>
        );
      })}
    </>
  );
}

/** The two action plates — the rail's closing pair. */
export function RailActions({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <>
      <Link
        href="/reportar"
        className="group col-span-2 flex items-center gap-3 rounded-sm bg-down px-3.5 py-3 text-down-contrast transition-opacity outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Megaphone className="size-4 shrink-0" aria-hidden />
        <span className="display-condensed flex-1 text-base leading-tight font-extrabold uppercase lg:text-sm">
          {t.nav.submit}
        </span>
        <ArrowRight
          className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>

      <Link
        href="/donar"
        className="group col-span-2 flex items-center gap-3 rounded-sm bg-primary px-3.5 py-3 text-primary-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HeartHandshake className="size-4 shrink-0" aria-hidden />
        <span className="display-condensed flex-1 text-base leading-tight font-extrabold uppercase lg:text-sm">
          {t.donate.cta}
        </span>
        <ArrowRight
          className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </>
  );
}

/** The full vertical rail: identity, routes, directory, actions, controls. */
export function SiteRail({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <nav
      aria-label={t.landing.hero.railLabel}
      /* Full viewport height so the last plate sits at the foot; the numbers
         directory grows to absorb the slack. `overflow-y-auto` is the last
         resort for sub-600px windows. */
      className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-2 overflow-y-auto py-3 lg:flex"
    >
      {/* Wordmark. */}
      <Link
        href="/"
        className="px-1 pt-1 pb-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="display-condensed block truncate text-xl leading-none uppercase">
          <span className="font-extrabold">Sismo</span>
          <span className="ml-1.5 font-normal text-muted-foreground">
            Pereira
          </span>
        </span>
        <span className="label-signage mt-1.5 block text-[0.5625rem] tracking-[0.16em] text-muted-foreground">
          {t.nav.tagline}
        </span>
      </Link>

      <RailRoutes lang={lang} />

      {/* Emergency lines — a phone directory that grows to fill the slack. */}
      <ul className="flex flex-1 flex-col divide-y divide-border/60 rounded-sm bg-secondary px-3.5">
        {EMERGENCY_LINES.map((line) => (
          <li key={line.number} className="flex flex-1 items-center gap-3">
            <a
              href={`tel:${line.number}`}
              data-readout
              className="w-8 shrink-0 font-mono text-xs font-semibold tabular-nums underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {line.number}
            </a>
            <span className="min-w-0 truncate text-xs leading-snug text-muted-foreground">
              {line.label}
            </span>
          </li>
        ))}
      </ul>

      <RailActions lang={lang} />

      {/* Foot controls. */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center justify-center rounded-sm bg-secondary px-2 py-1.5">
          <LanguageToggle current={lang} />
        </div>
        <ThemeToggle lang={lang} className="size-9 shrink-0" />
      </div>
    </nav>
  );
}
