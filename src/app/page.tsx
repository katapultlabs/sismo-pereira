import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Droplets,
  Gauge,
  HeartHandshake,
  LifeBuoy,
  Megaphone,
  Package,
  UserSearch,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { PinnedAlerts } from "@/components/pinned-alerts";
import { SectionHeading } from "@/components/section-heading";
import {
  getCollectionPoints,
  getOrganizations,
  getServiceReportDensity,
  getServiceStatus,
  getUpdates,
} from "@/lib/data";
import { MEDICAL_CENTRES_CLOSED } from "@/lib/fallback-data";
import { formatDateTime, formatRelative, getDictionary, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { instrumentOpen } from "@/lib/service-instruments";
import type { ServiceReportDensity } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Households that reported in the density window, across all zones. */
function households(rows: ServiceReportDensity[]): number {
  return rows.reduce((acc, r) => acc + Number(r.total_count), 0);
}

interface Door {
  href: string;
  icon: LucideIcon;
  title: string;
  sub: string;
  readout: string | null;
  /** The one saturated door — donate wears the brand volt, nothing else. */
  volt?: boolean;
}

/**
 * The funnel landing.
 *
 * One question — do you need help, or do you want to help? — answered by two
 * groups of doors, rendered directly so the reader starts clicking, not
 * navigating. This replaced the editorial landing (rail, hero panel, status
 * carousel, figures, update feed) in the days-after phase of the emergency:
 * the job moved from *narrating the event* to *routing people to the thing
 * they came to do*. What each removed piece's job became is recorded in
 * docs/DECISIONS.md.
 *
 * Invariants that survive the rewrite:
 * - Life safety outranks every appeal: the sticky masthead carries 123 on
 *   every scroll position, pinned critical notices render above the fold,
 *   and the "necesito ayuda" group renders before the "quiero ayudar" one.
 * - A door carries a live readout, and the number on it is the number on the
 *   far side (the route-tile rule).
 * - Doors are achromatic except donate, which wears the brand volt like every
 *   donate CTA on the site.
 */
export default async function HomePage() {
  const lang = await getLang();
  const t = getDictionary(lang);

  const [
    statusResult,
    updatesResult,
    luzDensityResult,
    aguaDensityResult,
    orgsResult,
    pointsResult,
  ] = await Promise.all([
    getServiceStatus(),
    getUpdates(8),
    getServiceReportDensity("electricity"),
    getServiceReportDensity("water"),
    getOrganizations(),
    getCollectionPoints(),
  ]);

  const statuses = statusResult.data;
  const unknownCount = statuses.filter((s) => s.status === "unknown").length;
  const pinned = updatesResult.data.filter((u) => u.pinned);
  const latest = updatesResult.data.slice(0, 3);
  const aguaOpen =
    !orgsResult.degraded && instrumentOpen("water", orgsResult.data);

  const needDoors: Door[] = [
    {
      href: "/luz",
      icon: Zap,
      title: t.triage.luzTitle,
      sub: t.triage.luzSub,
      readout: luzDensityResult.degraded
        ? null
        : t.triage.householdsReadout(households(luzDensityResult.data)),
    },
    {
      href: "/agua",
      icon: Droplets,
      title: t.triage.aguaTitle,
      sub: t.triage.aguaSub,
      readout: aguaOpen
        ? aguaDensityResult.degraded
          ? null
          : t.triage.householdsReadout(households(aguaDensityResult.data))
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
      href: "/reportar",
      icon: Megaphone,
      title: t.triage.otherTitle,
      sub: t.triage.otherSub,
      readout: null,
    },
    {
      href: "/servicios",
      icon: Gauge,
      title: t.home.servicesTitle,
      sub: t.home.servicesSub,
      readout: statusResult.degraded
        ? null
        : t.home.servicesReadout(unknownCount, statuses.length),
    },
    {
      href: "/recursos",
      icon: LifeBuoy,
      title: t.home.resourcesTitle,
      sub: t.home.resourcesSub,
      readout: t.home.closuresReadout(MEDICAL_CENTRES_CLOSED.length),
    },
  ];

  const helpDoors: Door[] = [
    {
      href: "/donar#dinero",
      icon: HeartHandshake,
      title: t.home.donateTitle,
      sub: t.home.donateSub,
      readout: null,
      volt: true,
    },
    {
      href: "/donar#acopio",
      icon: Package,
      title: t.home.goodsTitle,
      sub: t.home.goodsSub,
      readout: pointsResult.degraded
        ? null
        : t.home.goodsReadout(pointsResult.data.length),
    },
    {
      href: "/organizaciones",
      icon: Building2,
      title: t.home.orgTitle,
      sub: t.home.orgSub,
      readout: null,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      {pinned.length > 0 ? (
        <PinnedAlerts updates={pinned} lang={lang} className="mt-3" />
      ) : null}

      {/* The hero is three lines and nothing else — the doors are the page. */}
      <header className="py-10 text-center sm:py-14">
        <p className="label-signage text-ember">{t.home.eyebrow}</p>
        <h1 className="display-condensed mx-auto mt-4 max-w-2xl text-3xl leading-tight font-extrabold text-balance uppercase sm:text-4xl">
          {t.home.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
          {t.home.lede}
        </p>
      </header>

      <section id="necesito" className="scroll-mt-20">
        <SectionHeading as="h2" index="01" title={t.home.needHeading} />
        <nav
          aria-label={t.home.needHeading}
          className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {needDoors.map((door) => (
            <DoorCard key={door.href} door={door} />
          ))}
        </nav>
      </section>

      <section id="ayudar" className="mt-14 scroll-mt-20">
        <SectionHeading as="h2" index="02" title={t.home.helpHeading} />
        <nav
          aria-label={t.home.helpHeading}
          className="mt-6 grid gap-3 sm:grid-cols-3"
        >
          {helpDoors.map((door) => (
            <DoorCard key={door.href} door={door} />
          ))}
        </nav>
      </section>

      {/* The three newest updates as plain rows — the feed's job, at the
          funnel's scale. Each row IS its source-and-time claim. */}
      {latest.length > 0 ? (
        <section id="actualizaciones" className="mt-14 scroll-mt-20">
          <SectionHeading as="h2" index="03" title={t.home.updatesHeading} />
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {latest.map((u) => (
              <li key={u.id}>
                <UpdateRow update={u} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DoorCard({ door }: { door: Door }) {
  return (
    <Link
      href={door.href}
      className={cn(
        "group flex flex-col gap-2 rounded-sm p-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        door.volt
          ? "border border-brand-contrast/25 bg-brand text-brand-contrast hover:opacity-90"
          : "border border-border bg-card hover:border-foreground/40 hover:bg-muted/40",
      )}
    >
      <span className="flex items-center gap-2.5">
        <door.icon
          className={cn(
            "size-5 shrink-0",
            door.volt
              ? ""
              : "text-muted-foreground transition-colors group-hover:text-foreground",
          )}
          aria-hidden
        />
        <span className="display-condensed flex-1 text-lg leading-tight font-bold uppercase">
          {door.title}
        </span>
        <ArrowUpRight
          className={cn(
            "size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            door.volt ? "" : "text-muted-foreground group-hover:text-foreground",
          )}
          aria-hidden
        />
      </span>
      <span
        className={cn(
          "text-sm leading-snug",
          door.volt ? "text-brand-contrast/80" : "text-muted-foreground",
        )}
      >
        {door.sub}
      </span>
      {door.readout ? (
        <span
          data-readout
          className={cn(
            "label-signage mt-auto pt-1 text-[0.625rem]",
            door.volt ? "text-brand-contrast/70" : "text-muted-foreground",
          )}
        >
          {door.readout}
        </span>
      ) : null}
    </Link>
  );
}

function UpdateRow({
  update,
  lang,
}: {
  update: { slug: string | null; title: string; published_at: string | null };
  lang: Lang;
}) {
  const inner = (
    <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
      <span className="min-w-0 text-sm leading-snug font-semibold">
        {update.title}
      </span>
      {update.published_at ? (
        <time
          data-readout
          dateTime={update.published_at}
          title={formatDateTime(update.published_at, lang)}
          className="shrink-0 font-mono text-xs text-muted-foreground"
        >
          {formatRelative(update.published_at, lang)}
        </time>
      ) : null}
    </span>
  );

  return update.slug ? (
    <Link
      href={`/actualizaciones/${update.slug}`}
      className="block transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}
