import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { DonateBlock } from "@/components/donate-banner";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getCollectionPoints } from "@/lib/data";
import { SOURCE_LABELS, formatDateTime, getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).collection.heading };
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
 * Donations in kind.
 *
 * The counterpart to `/donar`, and deliberately a separate page from
 * `/recursos`: that grid answers "where do I go for help", this one answers
 * "where do I take what I have". Same rows, same table, different question —
 * `getResources` excludes `donation_point` so a point has exactly one home.
 *
 * **The needs checklist is the page, not the address.** A collection point
 * published as a name and an opening time is the classic disaster-logistics
 * failure: it produces a car park of donated clothing nobody asked for while
 * the gauze runs out. So `needs` is set as a checklist at body size, above
 * the metadata, and a point with an empty list says "ask first" rather than
 * quietly implying anything is welcome (Rule 8 — the honest gap beats the
 * confident guess).
 *
 * Rule 2 governs whether a row appears at all. `getCollectionPoints` filters
 * on `verified`, and the empty state names the specific failure this page
 * invites: a forwarded broadcast announcing a collection point is the most
 * shareable and least verifiable object in circulation after an earthquake.
 * Collection points are also where donation fraud lands — a fake one is how
 * donated goods get stolen — so the gate is not a formality here.
 */
export default async function CollectionPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const c = t.collection;
  const { data: points, degraded } = await getCollectionPoints();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading
        as="h1"
        title={c.heading}
        subtitle={c.subheading}
        action={
          <Link
            href="/donar"
            className="label-signage inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t.donate.cta}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      />

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {c.lede}
      </p>

      {degraded ? (
        <div className="mt-8">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {points.length === 0 ? (
        <div className="mt-8 border border-dashed border-border p-8 text-center sm:p-10">
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
            {c.empty}
          </p>
          <Link
            href="/donar"
            className="label-signage mt-5 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            {c.emptyCta}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {points.map((point, i) => {
            const official = point.source === "official";

            return (
              <article
                key={point.id}
                className="animate-rise border border-border bg-card p-5 sm:p-6"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <h2 className="display-condensed text-lg font-bold text-balance sm:text-xl">
                    {point.name}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Official vs not is encoded three ways — tint, icon,
                        and words — so it survives greyscale, same as
                        `/enlaces`. */}
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
                      {official
                        ? SOURCE_LABELS[lang][point.source]
                        : t.links.notOfficial}
                    </span>
                    <StatusBadge status={point.status} lang={lang} />
                  </div>
                </div>

                {point.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {point.description}
                  </p>
                ) : null}

                {/* Where and when. Set as an instrument readout rather than
                    prose — these are the two values someone re-reads in the
                    car. */}
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
                      <Phone
                        className="size-3.5 shrink-0 translate-y-0.5 text-down"
                        aria-hidden
                      />
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

                {/* The reason the page exists. */}
                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="label-signage text-muted-foreground">
                    {c.needsHeading}
                  </h3>
                  {point.needs.length === 0 ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {c.noNeeds}
                    </p>
                  ) : (
                    <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {point.needs.map((need) => (
                        <li key={need} className="flex items-baseline gap-2">
                          <Check
                            className="size-3.5 shrink-0 translate-y-0.5 text-ok"
                            aria-hidden
                          />
                          <span className="text-sm leading-relaxed">{need}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Rule 3: who told us, and when. */}
                <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-border pt-3 font-mono text-[0.6875rem] text-muted-foreground">
                  {point.source_name ? (
                    <span>
                      {c.sourceLabel}{" "}
                      <span className="font-semibold text-foreground">
                        {point.source_name}
                      </span>
                    </span>
                  ) : null}
                  {point.source_name ? (
                    <span className="text-border" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <span>
                    {c.updatedLabel}{" "}
                    <time dateTime={point.updated_at} className="text-foreground">
                      {formatDateTime(point.updated_at, lang)}
                    </time>
                  </span>
                  {point.source_url && hostnameOf(point.source_url) ? (
                    <>
                      <span className="text-border" aria-hidden>
                        ·
                      </span>
                      <a
                        href={point.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {hostnameOf(point.source_url)}
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Only once there is somewhere to go. Logistics advice above an empty
          list is an instruction to do nothing. */}
      {points.length > 0 ? (
        <section className="mt-12">
          <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
            {c.beforeYouGo.heading}
          </h2>
          <ul className="mt-4 space-y-2">
            {c.beforeYouGo.items.map((item) => (
              <li
                key={item}
                className="border-l-2 border-border bg-muted/40 py-2.5 pr-4 pl-4 text-sm leading-relaxed text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Rule 10: money and goods are two different asks, and neither page is
          the only option offered. */}
      <DonateBlock lang={lang} className="mt-12" />
    </div>
  );
}
