import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
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
         * Rule 10, requirement 2. In the body, at full size, before the
         * trust panel rather than inside it — a reader who never opens the
         * expander must still have read this.
         */}
        <div className="mt-2 border-2 border-foreground/25 bg-muted/40 p-6 sm:p-8">
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

      {/* Rule 3: who told us, and when. */}
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
      </div>
    </article>
  );
}
