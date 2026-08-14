import Link from "next/link";
import { ArrowRight, ExternalLink, HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * The donation drive.
 *
 * Hardcoded, like `EMERGENCY_LINES` and `MedicalClosures`. A `links` row would
 * only ever appear on `/enlaces`, and it would vanish the moment Supabase did
 * — this is the one appeal that has to survive a degraded read (Rule 7),
 * because an appeal that disappears during the aftershock is one nobody sees.
 *
 * **Every CTA in here points inward, to `/donar`.** That page is the single
 * exit point to the campaign. Routing through it means the verification, the
 * open questions, and the operator's declared stake in Vaki are all on screen
 * *before* anyone leaves the site, rather than discovered afterwards. It costs
 * a click; the alternative is a site that amplifies a donation link on every
 * page and discloses its interest nowhere.
 */

/** The campaign. Only `DonateAction`, rendered on `/donar`, links to it. */
export const DONATE_URL = "https://helpcolombia.vaki.org/";

/** Printed for the reader to compare against the address bar. A literal
 *  rather than parsed from `DONATE_URL`: this string is the check, so it
 *  should be legible in the diff that changes it. */
export const DONATE_HOST = "helpcolombia.vaki.org";

/**
 * Vaki Global Ltd is the Colombian crowdfunding platform; Vaki Foundation is
 * the US entity that fronts the campaign. That relationship is what `/donar`
 * lays out — here we name the operator and nothing more.
 */
export const DONATE_OPERATOR = "Vaki (Vaki Global Ltd)";

/** Where every internal donate CTA goes. */
export const DONATE_PATH = "/donar";

/**
 * The full plate, for pages where the appeal is content rather than chrome.
 * Same inverted substrate as the bar so the two read as one voice.
 */
export function DonateBlock({
  lang,
  className,
}: {
  lang: Lang;
  className?: string;
}) {
  const t = getDictionary(lang);

  return (
    <section
      aria-label={t.donate.eyebrow}
      /* `flex flex-col` + `my-auto` on the body: when a page stretches this
         plate to match a neighbouring column, the appeal centres instead of
         leaving a dead band above the note. At natural height, no change. */
      className={cn(
        "flex flex-col border border-foreground/25 bg-foreground text-background",
        className,
      )}
    >
      <div className="my-auto flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="label-signage flex items-center gap-2 text-background/70">
            <HeartHandshake className="size-3.5" aria-hidden />
            {t.donate.eyebrow}
          </p>

          <h2 className="display-condensed mt-3 text-2xl font-extrabold text-balance uppercase sm:text-3xl">
            {t.donate.title}
          </h2>

          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-pretty text-background/85">
            {t.donate.body}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-background/70">
            {t.donate.scope}
          </p>

          <p className="mt-4 font-mono text-[0.6875rem] text-background/70">
            {t.links.operator}{" "}
            <span className="font-semibold text-background">
              {DONATE_OPERATOR}
            </span>
          </p>
        </div>

        <Button
          size="lg"
          /* Full-bleed tap target on a phone; natural width once the plate is
             wide enough that a 900px-wide button just looks stretched. */
          className="label-signage h-11 shrink-0 gap-2 rounded-sm bg-background px-6 text-foreground hover:bg-background/85 sm:self-start lg:self-auto"
          render={<Link href={DONATE_PATH} />}
        >
          {t.donate.cta}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>

      {/* Set apart on its own rule: it qualifies the appeal above rather than
          continuing it, and must not read as part of the pitch. */}
      <p className="border-t border-background/20 px-6 py-3 text-xs leading-relaxed text-background/70 sm:px-8">
        {t.donate.blockNote}
      </p>
    </section>
  );
}

/**
 * The footer's row. Deliberately *not* a third ink plate — the bar is already
 * on every page and the block may be too, and a third inverted slab in one
 * scroll stops reading as emphasis and starts reading as decoration.
 */
export function DonateFooterLink({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <Link
      href={DONATE_PATH}
      className="group flex items-center gap-3 border border-border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted"
    >
      <HeartHandshake
        className="size-5 shrink-0 transition-transform group-hover:scale-110"
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-tight font-semibold">
          {t.donate.title}
        </span>
        <span className="mt-1 block text-[0.8125rem] leading-tight text-muted-foreground">
          {t.donate.learnMore}
        </span>
      </span>
      <span className="label-signage inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-foreground px-2.5 py-2 text-background">
        {t.donate.cta}
        <ArrowRight className="size-3" aria-hidden />
      </span>
    </Link>
  );
}

/**
 * The one outbound CTA on the site, rendered only on `/donar`.
 *
 * This is where the bare hostname belongs: it is the click that actually
 * leaves for a page asking for money, so it is the click where a reader needs
 * something to compare against the address bar (Rule 9).
 */
export function DonateAction({
  lang,
  className,
}: {
  lang: Lang;
  className?: string;
}) {
  const t = getDictionary(lang);

  return (
    <section
      className={cn(
        "border border-foreground/25 bg-foreground p-6 text-background sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="label-signage flex items-center gap-2 text-background/70">
            <HeartHandshake className="size-3.5" aria-hidden />
            {t.donate.eyebrow}
          </p>

          <h2 className="display-condensed mt-3 text-2xl font-extrabold text-balance uppercase sm:text-3xl">
            {t.donate.page.actionTitle}
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-pretty text-background/85">
            {t.donate.page.actionBody}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.6875rem] text-background/70">
            <span>
              {t.links.operator}{" "}
              <span className="font-semibold text-background">
                {DONATE_OPERATOR}
              </span>
            </span>
            <span className="text-background/40" aria-hidden>
              ·
            </span>
            <span
              data-readout
              className="inline-flex items-center gap-1 font-semibold text-background"
            >
              {DONATE_HOST}
              <ExternalLink className="size-3" aria-hidden />
            </span>
          </div>
        </div>

        <Button
          size="lg"
          className="label-signage h-12 shrink-0 gap-2 rounded-sm bg-background px-7 text-base text-foreground hover:bg-background/85 sm:self-start lg:self-auto"
          render={
            <a href={DONATE_URL} target="_blank" rel="noreferrer noopener" />
          }
        >
          {t.donate.cta}
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only"> ({t.links.newTab})</span>
        </Button>
      </div>
    </section>
  );
}
