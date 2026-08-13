import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info, ShieldCheck, Users } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).verification.heading };
}

/*
 * The verification standard, in one place.
 *
 * **Why this page exists.** The site sends people somewhere — a car park with
 * a boot full of water, a payment form, a registry someone is searching for a
 * relative in. "Verificado" and a date were doing all of the work on those
 * cards, and a reader could see both and still not know what had been checked.
 * Rule 9 says an outbound link is a claim; this is where the claim is spelled
 * out once instead of being re-implied on every card.
 *
 * **It replaced a worse answer.** Collection points used to credit the person
 * who did the checking by name. That reads as a personal vouch: it asks a
 * reader to decide whether they trust a stranger, which is not a question they
 * can answer and not the one that decides anything. The method and the date
 * are the facts that help, so the cards name the site and link here.
 *
 * **Static, hardcoded, no query.** Nothing on it comes from the database, so
 * it is the one page guaranteed to be readable when everything else degrades
 * (Rule 7) — which matters, because it is what a suspicious reader opens.
 *
 * Deliberately **not in the masthead nav**: that bar is full at six items and
 * a seventh means reworking it, not tightening the gap. This is reached from
 * the cards that make the claim, which is where the question actually occurs.
 */
export default async function VerificationPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const v = t.verification;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading as="h1" title={v.heading} subtitle={v.lede} />

      {/* What the word means. First, because every card on the site leans on
          it and nothing has ever defined it. */}
      <section className="mt-8 border-2 border-foreground/20 bg-muted/40 p-6 sm:p-8">
        <h2 className="display-condensed flex items-center gap-2.5 text-lg font-extrabold uppercase">
          <ShieldCheck className="size-5 shrink-0" aria-hidden />
          {v.meansHeading}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pretty">
          {v.meansBody}
        </p>
      </section>

      {/* The checks. Bordered cards with a source line's weight — the same
          container `/donar` uses for a finding, so "this was checked" looks
          the same everywhere on the site. */}
      <section className="mt-12">
        <SectionHeading index="01" title={v.checksHeading} />
        <ul className="mt-5 space-y-2">
          {v.checks.map((check) => (
            <li key={check.title} className="border border-border bg-card p-5">
              <h3 className="flex items-start gap-2.5 text-sm leading-snug font-semibold">
                <ShieldCheck
                  className="mt-px size-4 shrink-0 text-ok"
                  aria-hidden
                />
                {check.title}
              </h3>
              <p className="mt-2 pl-6.5 text-sm leading-relaxed text-muted-foreground">
                {check.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* The limits, in dashed boxes — the site's established container for an
          absence rather than a finding. Spending a status hue on them would
          overstate them, and hiding them would make the section above a
          guarantee. */}
      <section className="mt-12">
        <SectionHeading index="02" title={v.limitsHeading} subtitle={v.limitsLede} />
        <ul className="mt-5 space-y-2">
          {v.limits.map((limit) => (
            <li
              key={limit}
              className="flex items-start gap-2.5 border border-dashed border-border p-4 text-sm leading-relaxed text-muted-foreground"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {limit}
            </li>
          ))}
        </ul>
      </section>

      {/* The badge, explained where it is not competing with a card. */}
      <section className="mt-12">
        <SectionHeading index="03" title={v.badgeHeading} />
        <div className="mt-5 border-l-2 border-warn/40 bg-warn-muted/50 py-4 pr-5 pl-5">
          <span className="label-signage inline-flex items-center gap-1 rounded-sm border border-warn/40 bg-warn-muted px-1.5 py-1 text-warn-foreground">
            <Users className="size-3" aria-hidden />
            {t.links.notOfficial}
          </span>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pretty">
            {v.badgeBody}
          </p>
        </div>
      </section>

      {/* Who. The answer to the question this page was built to retire. */}
      <section className="mt-12">
        <SectionHeading index="04" title={v.whoHeading} />
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-pretty">
          {v.whoBody}
        </p>
      </section>

      {/* Correction is part of the standard, not an afterthought — a stale
          "verificado" is the failure this page is most exposed to. Points at
          `/reportar`, the channel that already exists: Rule 4 means there is
          no published address or inbox to offer instead. */}
      <section className="mt-12 border border-border p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="display-condensed text-xl font-extrabold uppercase">
              {v.wrongHeading}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {v.wrongBody}
            </p>
          </div>
          <Link
            href="/reportar"
            className="label-signage inline-flex shrink-0 items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {v.wrongCta}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
