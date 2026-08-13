import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  CircleDashed,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  Package,
  Phone,
  Quote,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { DonateAction } from "@/components/donate-banner";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getCollectionPoints } from "@/lib/data";
import { SOURCE_LABELS, formatDateTime, getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).donate.page.heading };
}

/**
 * The bare hostname, printed so a reader can compare it against the address
 * bar — the same check `/enlaces` and the donate plate make.
 *
 * Returns `null` rather than throwing on a value that is not a URL. `new URL`
 * throws, this string comes from the database, and a render that throws is a
 * 500 on the page someone opened to find out where to take water (Rule 7).
 */
function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/*
 * Everything about giving, on one page.
 *
 * **The page asks one question: how do you want to help.** "Quiero donar" is a
 * single intent — the donor has something to give and wants to know where it
 * goes — and it was previously split across `/donar` (money) and `/acopio`
 * (goods). That split modelled our schema, not the reader.
 *
 * The fold is the question and two doors, and nothing else. What used to sit
 * above the fold was a four-card verification dossier, three campaign claims,
 * and three open questions — roughly 1,400 words of apparatus in front of a
 * button. All of it is still here and none of it is softened; it is behind
 * `trustSummary` ("¿Por qué deberías confiar en esto?"), which is the question
 * a reader actually asks, at the moment they ask it.
 *
 * Two things did **not** move, and must not:
 *
 *  - **The declaration of interest stays in the body, at full size.** Rule 10
 *    is explicit that it is not a footnote, and a disclosure behind a
 *    disclosure is a footnote with extra steps. It is short; it was never the
 *    thing making this page heavy.
 *  - **Findings, claims, and gaps stay three visibly different containers**
 *    inside the expander — bordered cards with a source line, quoted blocks,
 *    dashed boxes. Collapsing them into one confident block is the move this
 *    site exists not to make (Rule 3). Collapsing them behind one *summary*
 *    is not the same thing.
 *
 * `<details>` rather than the Base UI accordion on purpose: it needs no
 * JavaScript, so the trust panel still opens if hydration never happens — on
 * a degraded connection during an aftershock, which is exactly when someone
 * is reading this (Rule 7).
 */
export default async function DonatePage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const p = t.donate.page;
  const o = p.otherRegions;
  const c = t.collection;
  const { data: points, degraded } = await getCollectionPoints();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading as="h1" title={p.heading} subtitle={p.lede} />

      {/* ------------------------------------------------------------------ */}
      {/* The choice. This is the whole fold.                                 */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Two doors, achromatic like the home page's route board — the four
       * status hues are the only saturated colour on this site and a donate
       * plate must not compete with them. Each carries a live readout, so
       * neither is a nav link wearing a card: the goods door says how many
       * confirmed points are actually on the other side, including when the
       * honest answer is none.
       */}
      <nav aria-label={p.lede} className="mt-6 grid gap-2 sm:grid-cols-2">
        <a
          href="#dinero"
          className="group animate-rise flex flex-col border border-border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-muted/50"
        >
          <Banknote
            className="size-5 text-muted-foreground transition-transform group-hover:scale-110"
            aria-hidden
          />
          <h2 className="display-condensed mt-3 text-xl font-extrabold uppercase">
            {p.moneyChoice.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {p.moneyChoice.body}
          </p>
          <p
            data-readout
            className="label-signage mt-4 flex items-center gap-1.5 text-foreground"
          >
            {p.moneyChoice.readout}
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </p>
        </a>

        <a
          href="#acopio"
          className="group animate-rise flex flex-col border border-border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-muted/50"
          style={{ animationDelay: "40ms" }}
        >
          <Package
            className="size-5 text-muted-foreground transition-transform group-hover:scale-110"
            aria-hidden
          />
          <h2 className="display-condensed mt-3 text-xl font-extrabold uppercase">
            {p.goodsChoice.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {p.goodsChoice.body}
          </p>
          <p
            data-readout
            className={cn(
              "label-signage mt-4 flex items-center gap-1.5",
              points.length > 0 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {points.length > 0
              ? p.goodsChoice.readout(points.length)
              : p.goodsChoice.readoutEmpty}
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </p>
        </a>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Money                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section id="dinero" className="mt-14 scroll-mt-20">
        <SectionHeading index="01" title={p.moneyHeading} />

        <DonateAction lang={lang} className="mt-5" />

        {/*
         * The one-glance verdict, above the disclosure and the dossier.
         *
         * The dossier answers "why should you trust this" in about 400 words.
         * This answers the question a donor actually holds — *is this checked
         * or not* — in two sentences, and the long version stays one click
         * away for anyone who wants it.
         *
         * It reuses the two containers this page already uses for exactly
         * this distinction: a solid bordered card for a finding, a dashed one
         * for an absence. Same grammar as the `verified`/`gaps` blocks inside
         * the expander, so the summary and the detail read as one argument.
         */}
        <ChecksStrip
          yes={p.checks.yes}
          no={p.checks.no}
          verified={p.checks.verified}
          unverified={p.checks.unverified}
          className="mt-2"
        />

        {/* What "verificado" meant, for the reader who wants the standard
            rather than this one campaign's dossier. */}
        <Link
          href="/verificacion"
          className="label-signage mt-2 inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t.verification.cardLink}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>

        {/*
         * Rule 10, requirement 2. In the body, at full size, before the
         * trust panel rather than inside it — a reader who never opens the
         * expander must still have read this.
         *
         * Carries the donate tint rather than a heavy black rule: it is part
         * of the appeal's own voice, and `border-2 border-foreground/25` read
         * as a legal warning stapled to the page.
         */}
        <div className="mt-2 border-2 border-donate/25 bg-donate-muted/50 p-6 sm:p-8">
          <h3 className="display-condensed flex items-center gap-2.5 text-lg font-extrabold uppercase">
            <Scale className="size-5 shrink-0" aria-hidden />
            {p.disclosureHeading}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pretty">
            {p.disclosureBody}
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* The trust dossier, collapsed                                      */}
        {/* ---------------------------------------------------------------- */}
        <details className="group mt-2 border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="display-condensed block text-lg font-extrabold uppercase">
                {p.trustSummary}
              </span>
              {/* Rule 3: the dossier is a snapshot of one afternoon's
                  checking, and says so without being opened. */}
              <span
                data-readout
                className="label-signage mt-1 block text-muted-foreground"
              >
                {p.checkedOn}
              </span>
            </span>
            <ChevronDown
              className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>

          <div className="border-t border-border p-5 sm:p-6">
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {p.trustLede}
            </p>

            {/* 01 — What we checked ourselves. Bordered cards, each with its
                own source line. */}
            <h4 className="label-signage mt-8 border-b border-foreground/25 pb-2 text-muted-foreground">
              {p.verifiedHeading}
            </h4>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {p.verifiedLede}
            </p>
            <ul className="mt-4 space-y-2">
              {p.verified.map((item) => (
                <li key={item.title} className="border border-border bg-background p-4">
                  <h5 className="flex items-start gap-2.5 text-sm leading-snug font-semibold">
                    <ShieldCheck
                      className="mt-px size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    {item.title}
                  </h5>
                  <p className="mt-2 pl-6.5 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                  <p className="mt-2 pl-6.5 font-mono text-[0.6875rem] text-muted-foreground">
                    {t.status.source}{" "}
                    <span className="font-semibold text-foreground">{item.source}</span>
                  </p>
                </li>
              ))}
            </ul>

            {/* 02 — Their voice, not ours. A visibly different container from
                the block above, so a skimming reader can tell our findings
                from their marketing without reading the heading. */}
            <h4 className="label-signage mt-8 border-b border-foreground/25 pb-2 text-muted-foreground">
              {p.claimsHeading}
            </h4>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {p.claimsLede}
            </p>
            <ul className="mt-4 space-y-2">
              {p.claims.map((item) => (
                <li
                  key={item.title}
                  className="border-l-2 border-border bg-muted/40 py-3 pr-4 pl-4"
                >
                  <h5 className="flex items-start gap-2.5 text-sm leading-snug font-semibold">
                    <Quote
                      className="mt-px size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    {item.title}
                  </h5>
                  <p className="mt-1.5 pl-6.5 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>

            {/* 03 — Absences, not findings. Dashed and achromatic: spending a
                status hue on them would overstate them. */}
            <h4 className="label-signage mt-8 border-b border-foreground/25 pb-2 text-muted-foreground">
              {p.gapsHeading}
            </h4>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {p.gapsLede}
            </p>
            <ul className="mt-4 space-y-2">
              {p.gaps.map((gap) => (
                <li
                  key={gap}
                  className="flex items-start gap-2.5 border border-dashed border-border p-4 text-sm leading-relaxed text-muted-foreground"
                >
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        </details>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Goods                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section id="acopio" className="mt-14 scroll-mt-20">
        <SectionHeading index="02" title={p.goodsHeading} subtitle={c.lede} />

        {degraded ? (
          <div className="mt-5">
            <DegradedNotice lang={lang} />
          </div>
        ) : null}

        {points.length === 0 ? (
          <p className="mt-5 border border-dashed border-border p-8 text-center text-sm leading-relaxed text-muted-foreground sm:p-10">
            {c.empty}
          </p>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {points.map((point, i) => (
                <CollectionCard key={point.id} point={point} lang={lang} index={i} />
              ))}
            </div>

            {/* Collapsed for the same reason the dossier is: it is genuinely
                useful and genuinely not what someone came here to read. */}
            <details className="group mt-2 border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                <span className="display-condensed text-lg font-extrabold uppercase">
                  {c.beforeYouGo.heading}
                </span>
                <ChevronDown
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <ul className="space-y-2 border-t border-border p-5">
                {c.beforeYouGo.items.map((item) => (
                  <li
                    key={item}
                    className="border-l-2 border-border bg-muted/40 py-2.5 pr-4 pl-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Another region                                                      */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Below both doors on purpose. The fold is still "how do you want to
       * help" answered by dinero and cosas; geography is a question a reader
       * only reaches once they have already decided to give, and promoting it
       * to a third plate would break the two-door grid the page is built on.
       */}
      <section id="buenaventura" className="mt-14 scroll-mt-20">
        <SectionHeading index="03" title={o.heading} subtitle={o.lede} />
        <BuenaventuraCard lang={lang} />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Alternatives                                                        */}
      {/* ------------------------------------------------------------------ */}
      {/* Rule 10, requirement 3: a give page with exactly one destination is
          an advertisement. */}
      <section className="mt-14 border border-border p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="display-condensed text-xl font-extrabold uppercase">
              {p.alternativesHeading}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {p.alternativesBody}
            </p>
          </div>
          <Link
            href="/enlaces"
            className="label-signage inline-flex shrink-0 items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {p.alternativesCta}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Verified / not verified, side by side.
 *
 * Two containers this page already uses for the distinction: a solid bordered
 * card is something we checked, a dashed one is something we could not. The
 * dashed box is deliberately the same weight as the solid one — a summary that
 * set the reassuring half in body type and the caveat in fine print would be
 * the merged-confident-block failure Rule 10 exists to stop.
 */
function ChecksStrip({
  yes,
  no,
  verified,
  unverified,
  className,
}: {
  yes: string;
  no: string;
  verified: string;
  unverified: string;
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-2 sm:grid-cols-2", className)}>
      <li className="flex gap-3 border border-border bg-card p-5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
        <div className="min-w-0">
          <p className="label-signage text-muted-foreground">{yes}</p>
          <p className="mt-1.5 text-sm leading-relaxed">{verified}</p>
        </div>
      </li>
      <li className="flex gap-3 border border-dashed border-border p-5">
        <CircleDashed
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="label-signage text-muted-foreground">{no}</p>
          <p className="mt-1.5 text-sm leading-relaxed">{unverified}</p>
        </div>
      </li>
    </ul>
  );
}

/**
 * The Buenaventura appeal.
 *
 * Hardcoded rather than a `resources` or `links` row, for the same reason the
 * Vaki drive is: it has to survive a degraded read (Rule 7), and a campaign
 * that vanishes when Supabase does is one nobody sees.
 *
 * **The canonical `gofundme.com` URL, never the `gofund.me` shortener it
 * arrived as.** Rule 9 prints a bare domain so a reader can compare it against
 * the address bar; a shortener hides precisely that, on the click where it
 * matters most.
 *
 * This is the weakest destination the site links to — a personal fundraiser on
 * a platform that hosts anyone — so it carries the most apparatus: the
 * "no es un canal oficial" badge, a named organizer, a sourced reason the
 * place needs help, what was checked, what was not, and how the link reached
 * us. That last one is Rule 10: a personal connection is an interest, and it
 * is disclosed on the card rather than left for someone to discover.
 */
const BUENAVENTURA_URL =
  "https://www.gofundme.com/f/earthquake-relief-for-buenaventura-colombia-mprzj";

/** Printed for the reader to compare against the address bar, same as
 *  `DONATE_HOST`. A literal, so it is legible in the diff that changes it. */
const BUENAVENTURA_HOST = "gofundme.com";

function BuenaventuraCard({
  lang,
}: {
  lang: Awaited<ReturnType<typeof getLang>>;
}) {
  const t = getDictionary(lang);
  const o = t.donate.page.otherRegions;

  return (
    <article className="mt-5 border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="label-signage text-muted-foreground">{o.place}</p>
          <h3 className="display-condensed mt-1 text-lg font-bold text-balance sm:text-xl">
            {o.campaignTitle}
          </h3>
        </div>
        {/* Encoded three ways — tint, icon, words — same as `/enlaces`. */}
        <span className="label-signage inline-flex shrink-0 items-center gap-1 rounded-sm border border-warn/40 bg-warn-muted px-1.5 py-1 text-warn-foreground">
          <Users className="size-3" aria-hidden />
          {t.links.notOfficial}
        </span>
      </div>

      {/* Why this place, sourced. We do not assert the damage ourselves — the
          site has no reporting in Valle del Cauca, and Rule 3 applies to a
          reason for giving exactly as it applies to a status card. */}
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {o.context}
      </p>
      <p className="mt-2 font-mono text-[0.6875rem] text-muted-foreground">
        {t.status.source}{" "}
        <span className="font-semibold text-foreground">{o.contextSource}</span>
      </p>

      <ChecksStrip
        yes={t.donate.page.checks.yes}
        no={t.donate.page.checks.no}
        verified={o.verified}
        unverified={o.unverified}
        className="mt-5"
      />

      {/* Rule 10: how this link reached us. */}
      <p className="mt-2 border-l-2 border-donate/40 bg-donate-muted/50 py-3 pr-4 pl-4 text-sm leading-relaxed">
        {o.relation}
      </p>

      <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
          <span>
            {o.organizerLabel}{" "}
            <span className="font-semibold text-foreground">{o.organizer}</span>
          </span>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <span
            data-readout
            className="inline-flex items-center gap-1 font-semibold text-foreground"
          >
            {BUENAVENTURA_HOST}
            <ExternalLink className="size-3" aria-hidden />
          </span>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <span>{o.reviewedOn}</span>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <Link
            href="/verificacion"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {t.verification.cardLink}
          </Link>
        </div>

        <Button
          size="lg"
          className="label-signage h-11 shrink-0 gap-2 rounded-sm bg-donate px-6 text-donate-contrast hover:bg-donate/90"
          render={
            <a
              href={BUENAVENTURA_URL}
              target="_blank"
              rel="noreferrer noopener"
            />
          }
        >
          {o.cta}
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only"> ({t.links.newTab})</span>
        </Button>
      </div>
    </article>
  );
}

/**
 * One drop-off point.
 *
 * **The needs checklist is the reason this exists, not the address.** A
 * collection point published as a name and an opening time is the standard
 * disaster-logistics failure: it produces a car park of donated clothing
 * nobody asked for while the gauze runs out. So `needs` is set at body size
 * above the metadata, in the operator's own order, and an empty list says
 * "ask first" rather than quietly implying anything is welcome (Rule 8).
 */
function CollectionCard({
  point,
  lang,
  index,
}: {
  point: Resource;
  lang: Awaited<ReturnType<typeof getLang>>;
  index: number;
}) {
  const t = getDictionary(lang);
  const c = t.collection;
  const official = point.source === "official";
  const host = point.source_url ? hostnameOf(point.source_url) : null;

  return (
    <article
      className="animate-rise border border-border bg-card p-5 sm:p-6"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="display-condensed text-lg font-bold text-balance sm:text-xl">
          {point.name}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {/* Official vs not is encoded three ways — tint, icon, and words —
              so it survives greyscale, same as `/enlaces`. */}
          <span
            className={cn(
              "label-signage inline-flex items-center gap-1 rounded-sm border px-1.5 py-1",
              official
                ? "border-border text-muted-foreground"
                : "border-warn/40 bg-warn-muted text-warn-foreground",
            )}
          >
            {official ? (
              <ShieldCheck className="size-3" aria-hidden />
            ) : (
              <Users className="size-3" aria-hidden />
            )}
            {official ? SOURCE_LABELS[lang][point.source] : t.links.notOfficial}
          </span>
          <StatusBadge status={point.status} lang={lang} />
        </div>
      </div>

      {point.description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {point.description}
        </p>
      ) : null}

      {/* Where and when — the two values someone re-reads in the car.
          Suppressed entirely when we have none of them, rather than rendering
          an empty `dl` and its margin: an appeal that names a venue and
          nothing else is the common case, not the exception. */}
      {point.address || point.hours || point.phone ? (
        <dl className="mt-4 space-y-2">
          {point.address ? (
            <div className="flex items-baseline gap-2">
              <dt className="sr-only">{c.address}</dt>
              <MapPin
                className="size-3.5 shrink-0 translate-y-0.5 text-muted-foreground"
                aria-hidden
              />
              <dd className="text-sm leading-relaxed">{point.address}</dd>
            </div>
          ) : null}
          {point.hours ? (
            <div className="flex items-baseline gap-2">
              <dt className="sr-only">{c.hours}</dt>
              <Clock
                className="size-3.5 shrink-0 translate-y-0.5 text-muted-foreground"
                aria-hidden
              />
              <dd data-readout className="font-mono text-sm font-semibold">
                {point.hours}
              </dd>
            </div>
          ) : null}
          {point.phone ? (
            <div className="flex items-baseline gap-2">
              <dt className="sr-only">{c.phone}</dt>
              <Phone className="size-3.5 shrink-0 translate-y-0.5 text-down" aria-hidden />
              <dd>
                <a
                  href={`tel:${point.phone}`}
                  className="font-mono text-sm font-semibold underline-offset-4 hover:underline"
                >
                  {point.phone}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        <h4 className="label-signage text-muted-foreground">{c.needsHeading}</h4>
        {point.needs.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {c.noNeeds}
          </p>
        ) : (
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {point.needs.map((need) => (
              <li key={need} className="flex items-baseline gap-2">
                <Check className="size-3.5 shrink-0 translate-y-0.5 text-ok" aria-hidden />
                <span className="text-sm leading-relaxed">{need}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rule 3: who told us, and when — plus what "checked" meant.
          `source_name` is the site rather than whoever made the call: a name
          asks the reader to judge a stranger, which is not a question they can
          answer, so the row links to the method instead. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-border pt-3 font-mono text-[0.6875rem] text-muted-foreground">
        {point.source_name ? (
          <>
            <span>
              {c.sourceLabel}{" "}
              <span className="font-semibold text-foreground">{point.source_name}</span>
            </span>
            <span className="text-border" aria-hidden>
              ·
            </span>
          </>
        ) : null}
        <span>
          {c.updatedLabel}{" "}
          <time dateTime={point.updated_at} className="text-foreground">
            {formatDateTime(point.updated_at, lang)}
          </time>
        </span>
        {host ? (
          <>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <a
              href={point.source_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
            >
              {host}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </>
        ) : null}
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link
          href="/verificacion"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t.verification.cardLink}
        </Link>
      </div>
    </article>
  );
}
