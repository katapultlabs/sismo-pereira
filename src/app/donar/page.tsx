import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info, ShieldCheck, Quote, Scale } from "lucide-react";

import { DonateAction } from "@/components/donate-banner";
import { SectionHeading } from "@/components/section-heading";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).donate.page.heading };
}

/*
 * The single exit point to the campaign.
 *
 * Every donate CTA on the site lands here rather than on Vaki, so that three
 * things are read before anyone leaves: what we checked ourselves, what is
 * merely the campaign's own claim, and the fact that this site's operator is
 * an investor in Vaki.
 *
 * The ordering is deliberate and is the whole editorial argument of the page.
 * The appeal comes first, because someone who has already decided should not
 * have to read an essay to act. Everything after it is arranged so that our
 * own verified findings, the campaign's unverified claims, and the open
 * questions are three visibly separate things — collapsing them into one
 * confident block is precisely the move this site exists not to make (Rule 3).
 *
 * No superlatives. "The most trustworthy option" and "funds routed the best
 * possible way" are not claims we can source, and a page that asserts them
 * would be worth less to a donor than one that shows its work.
 */
export default async function DonatePage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const p = t.donate.page;

  return (
    <div className="pb-12">
      <h1 className="display-condensed text-center text-3xl font-extrabold uppercase sm:text-4xl">
        {p.heading}
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-pretty text-muted-foreground">
        {p.lede}
      </p>

      {/* Rule 3: a claim carries its time as well as its source. This page is
          a snapshot of one afternoon's checking, and says so. */}
      <p
        data-readout
        className="label-signage mt-4 text-center text-muted-foreground"
      >
        {p.checkedOn}
      </p>

      <DonateAction lang={lang} className="mt-8" />

      {/* ------------------------------------------------------------------ */}
      {/* 01 — What we checked ourselves                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="mt-14">
        <SectionHeading
          centered
          title={p.verifiedHeading}
          subtitle={p.verifiedLede}
        />

        <ul className="mt-5 space-y-2">
          {p.verified.map((item, i) => (
            <li
              key={item.title}
              className="animate-rise rounded-sm border border-border bg-card p-4"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <h3 className="flex items-start gap-2.5 text-sm leading-snug font-semibold">
                <ShieldCheck
                  className="mt-px size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                {item.title}
              </h3>
              <p className="mt-2 pl-6.5 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
              <p className="mt-2 pl-6.5 font-mono text-[0.6875rem] text-muted-foreground">
                {t.status.source}{" "}
                <span className="font-semibold text-foreground">
                  {item.source}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 02 — What the campaign says (their voice, not ours)                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="mt-14">
        <SectionHeading
          centered
          title={p.claimsHeading}
          subtitle={p.claimsLede}
        />

        {/* A different container from section 01 on purpose: a reader
            skimming must be able to tell our findings from their marketing
            without reading the heading. */}
        <ul className="mt-5 space-y-2">
          {p.claims.map((item) => (
            <li
              key={item.title}
              className="rounded-sm border border-border bg-muted/40 p-4"
            >
              <h3 className="flex items-start gap-2.5 text-sm leading-snug font-semibold">
                <Quote
                  className="mt-px size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                {item.title}
              </h3>
              <p className="mt-1.5 pl-6.5 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 03 — Open questions                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="mt-14">
        <SectionHeading centered title={p.gapsHeading} subtitle={p.gapsLede} />

        {/* Dashed, achromatic, and unalarming. These are absences, not
            findings — spending a status hue on them would overstate them. */}
        <ul className="mt-5 space-y-2">
          {p.gaps.map((gap) => (
            <li
              key={gap}
              className="flex items-start gap-2.5 rounded-sm border border-dashed border-border p-4 text-sm leading-relaxed text-muted-foreground"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {gap}
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Declaration of interest                                             */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * Not a footnote. This page recommends a campaign run by a company the
       * site's operator has money in, and a reader who learns that elsewhere
       * has been misled by omission — which would cost more credibility than
       * the recommendation could ever buy.
       */}
      <section className="mt-14 rounded-sm border border-border bg-muted/40 p-6 sm:p-8">
        <h2 className="display-condensed flex items-center gap-2.5 text-xl font-extrabold uppercase">
          <Scale className="size-5 shrink-0" aria-hidden />
          {p.disclosureHeading}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pretty">
          {p.disclosureBody}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Alternatives                                                        */}
      {/* ------------------------------------------------------------------ */}
      {/* A donation page with exactly one option is an advertisement. */}
      <section className="mt-8 rounded-sm border border-border p-6 sm:p-8">
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
