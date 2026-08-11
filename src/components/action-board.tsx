import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Building2,
  Gauge,
  LifeBuoy,
  MessagesSquare,
  Megaphone,
  Phone,
  UserSearch,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { STATUS_ACCENT } from "@/components/status-badge";
import {
  EMERGENCY_LINES,
  MEDICAL_CENTRES_CLOSED,
  PMU_REPORT,
} from "@/lib/fallback-data";
import {
  STATUS_LABELS,
  formatDateTime,
  getDictionary,
  type Lang,
} from "@/lib/i18n";
import type { ServiceStatus, StatusLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The action board — a dispatch board, not a feature grid.
 *
 * This is the fold. Someone arriving here has one question ("what do I do
 * now?") and roughly four seconds of patience, so it answers with actions
 * rather than section names: every tile is named for what the reader does
 * ("Busca a una persona"), never for a part of the site ("Enlaces"), and every
 * tile carries a live instrument value — how many services are down, how many
 * lines exist, how many reports have been confirmed. A tile with no readout is
 * a nav link wearing a card.
 *
 * It ships as two exports because the page interleaves a third block between
 * them: `EmergencyPlates` (life safety) sits above the pinned strap line, and
 * `ActionRoutes` (the six routes) below it. See the ordering note in
 * `src/app/page.tsx`.
 *
 * Priority is encoded by plate size and by chroma, not by numbering — 01/02/03
 * markers would claim a sequence, and nobody works through these in order.
 *
 * The two plates render from hardcoded constants (`MEDICAL_CENTRES_CLOSED`,
 * `PMU_REPORT`, `EMERGENCY_LINES`) rather than a query, so the fold survives a
 * degraded read intact — see Rule 7.
 */

/** Severity order for the status readout: worst first, so a truncated line
 *  still leads with the thing a reader most needs to see. */
const STATUS_PRIORITY: StatusLevel[] = [
  "outage",
  "degraded",
  "restoring",
  "unknown",
  "operational",
];

/** Achromatic working tile. The chrome stays neutral so the two `down` plates
 *  above it keep the whole of the reader's alarm budget. */
function ActionTile({
  href,
  eyebrow,
  title,
  body,
  meta,
  Icon,
  delay,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  meta?: React.ReactNode;
  Icon: typeof Gauge;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="animate-rise group flex flex-col gap-2 border border-border bg-card p-4 transition-colors outline-none hover:border-foreground/30 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="label-signage flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {eyebrow}
      </span>

      <span className="display-condensed text-lg leading-tight font-bold text-balance">
        {title}
      </span>

      <span className="text-sm leading-relaxed text-pretty text-muted-foreground">
        {body}
      </span>

      {/* The readout sits on its own rule at the foot of the tile, the way a
          record's provenance line does everywhere else on the site. */}
      <span className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-2.5">
        <span className="min-w-0 font-mono text-[0.6875rem] leading-tight text-muted-foreground">
          {meta}
        </span>
        <ArrowRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </span>
    </Link>
  );
}

/**
 * The two life-safety plates.
 *
 * Rendered above the pinned strap line, directly under the masthead, because
 * they outrank even a pinned notice: "call 123" and "these four doors are
 * shut" are standing instructions that are true on every visit, where a pin is
 * curated and changes. Putting them first is also what gets a red plate onto a
 * 390×844 phone screen without scrolling — with the pins above them, the whole
 * board started at ~890px and nothing actionable was above the fold at all.
 */
export function EmergencyPlates({
  lang,
  className,
}: {
  lang: Lang;
  className?: string;
}) {
  const t = getDictionary(lang);
  const a = t.actions;

  return (
    <section aria-label={a.emergency.eyebrow} className={cn(className)}>
      <div className="grid gap-3 md:grid-cols-2">
        {/*
         * The 123 plate. Solid fill and a numeral set larger than anything
         * else on the site — this is the one element that has to be readable
         * by someone holding the phone at arm's length with shaking hands, so
         * the numeral is the element and the words are the caption.
         */}
        <a
          href="tel:123"
          aria-label={`${a.emergency.title}`}
          /* Top-aligned, not `justify-between`: this plate stretches to match
             the taller closures plate beside it, and spreading the content
             floated the numeral into the middle — below the fold on a laptop.
             The numeral has to be the first thing under the eyebrow. */
          className="animate-rise group flex flex-col gap-4 bg-down p-5 text-down-contrast transition-opacity outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6"
        >
          {/*
           * Full opacity, not a tint. `check:contrast` gates the token pairing
           * but cannot see an opacity modifier, and this is the one plate that
           * has to stay legible on a cracked screen in the dark — the size and
           * tracking of `label-signage` already de-emphasise it enough.
           */}
          <span className="label-signage flex items-center gap-2 text-down-contrast">
            <Phone className="size-3.5 shrink-0" aria-hidden />
            {a.emergency.eyebrow}
          </span>

          <span className="flex items-center gap-4">
            <span
              data-readout
              aria-hidden
              className="font-mono text-6xl leading-none font-semibold tracking-tight sm:text-7xl"
            >
              123
            </span>
            <span className="display-condensed text-xl leading-none font-extrabold uppercase sm:text-2xl">
              {a.emergency.title}
            </span>
          </span>

          <span className="text-sm leading-relaxed text-pretty text-down-contrast">
            {a.emergency.body}
          </span>
        </a>

        {/*
         * The "do not go" plate. Tinted rather than filled, so the two life-
         * safety plates are legible as a pair without competing: one is the
         * thing to do, the other is the thing not to do.
         *
         * Names only — the reasons, and the full apparatus, live on /recursos.
         * No addresses and no phone numbers, per the rule that governs the
         * `MedicalClosures` block this links to.
         */}
        <Link
          href="/recursos#centros-medicos"
          className="animate-rise group flex flex-col gap-3 border border-down/40 bg-down-muted p-5 text-down-foreground transition-colors outline-none hover:border-down/60 focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
          style={{ animationDelay: "60ms" }}
        >
          <span className="label-signage flex items-center gap-2">
            <Ban className="size-3.5 shrink-0" aria-hidden />
            {a.medical.eyebrow}
            <span data-readout className="ml-auto shrink-0 tabular-nums">
              {a.medical.count(MEDICAL_CENTRES_CLOSED.length)}
            </span>
          </span>

          <span className="display-condensed text-xl leading-tight font-extrabold text-balance uppercase sm:text-2xl">
            {a.medical.title}
          </span>

          <ul className="space-y-1">
            {MEDICAL_CENTRES_CLOSED.map((centre) => (
              <li
                key={centre.name}
                className="flex items-baseline gap-2 text-sm leading-snug font-semibold"
              >
                <Ban className="size-3 shrink-0 translate-y-0.5" aria-hidden />
                {centre.name}
              </li>
            ))}
          </ul>

          <span className="text-sm leading-relaxed text-pretty">
            {a.medical.body}
          </span>

          <span className="mt-auto flex items-center justify-between gap-3 border-t border-down/25 pt-2.5 font-mono text-[0.6875rem] leading-tight">
            <span className="min-w-0">
              {t.resources.medical.sourceLabel}: {PMU_REPORT.orgShortName} ·{" "}
              <span data-readout>
                {formatDateTime(PMU_REPORT.reportedAt, lang)}
              </span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Link>
      </div>
    </section>
  );
}

/**
 * The six routes. Achromatic on purpose — the two plates above own the whole
 * of the reader's alarm budget, and a third red thing would spend it.
 */
export function ActionRoutes({
  lang,
  statuses,
  reportCount,
  className,
}: {
  lang: Lang;
  statuses: ServiceStatus[];
  reportCount: number;
  className?: string;
}) {
  const t = getDictionary(lang);
  const a = t.actions;

  // Live tally for the services tile. Only non-empty levels are printed, worst
  // first, capped at three so the line never wraps past the tile.
  const tally = STATUS_PRIORITY.map((level) => ({
    level,
    count: statuses.filter((s) => s.status === level).length,
  }))
    .filter((entry) => entry.count > 0)
    .slice(0, 3);

  return (
    <section aria-label={a.heading} className={cn(className)}>
      {/*
       * No `index`. The numbered sections are the bulletin's own records — the
       * status board and the update feed — and numbering a set of routes would
       * claim an order nobody follows.
       */}
      <SectionHeading title={a.heading} subtitle={a.subheading} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActionTile
          href="/servicios"
          eyebrow={a.services.eyebrow}
          title={a.services.title}
          body={a.services.body}
          Icon={Gauge}
          delay={120}
          meta={
            /* A live tally, encoded twice — the accent dot and the word — so a
               greyscale screen still reads it. */
            <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {tally.map(({ level, count }) => (
                <span key={level} className="inline-flex items-center gap-1.5">
                  <span
                    className={cn("size-1.5 shrink-0", STATUS_ACCENT[level])}
                    aria-hidden
                  />
                  <span data-readout className="font-semibold text-foreground">
                    {count}
                  </span>
                  {STATUS_LABELS[lang][level]}
                </span>
              ))}
            </span>
          }
        />

        <ActionTile
          href="/reportar"
          eyebrow={a.report.eyebrow}
          title={a.report.title}
          body={a.report.body}
          meta={a.report.meta}
          Icon={Megaphone}
          delay={160}
        />

        <ActionTile
          href="/enlaces#personas-desaparecidas"
          eyebrow={a.missing.eyebrow}
          title={a.missing.title}
          body={a.missing.body}
          meta={a.missing.meta}
          Icon={UserSearch}
          delay={200}
        />

        <ActionTile
          href="/recursos"
          eyebrow={a.resources.eyebrow}
          title={a.resources.title}
          body={a.resources.body}
          meta={a.resources.meta(EMERGENCY_LINES.length)}
          Icon={LifeBuoy}
          delay={240}
        />

        <ActionTile
          href="/reportes"
          eyebrow={a.community.eyebrow}
          title={a.community.title}
          body={a.community.body}
          meta={
            reportCount > 0 ? a.community.meta(reportCount) : a.community.metaEmpty
          }
          Icon={MessagesSquare}
          delay={280}
        />

        <ActionTile
          href="/organizaciones"
          eyebrow={a.orgs.eyebrow}
          title={a.orgs.title}
          body={a.orgs.body}
          meta={a.orgs.meta}
          Icon={Building2}
          delay={320}
        />
      </div>
    </section>
  );
}
