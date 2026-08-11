import { ExternalLink, HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * The donation drive.
 *
 * Hardcoded, like `EMERGENCY_LINES` and `MedicalClosures`, for two reasons.
 * A `links` row would only ever appear on `/enlaces`, and it would vanish the
 * moment Supabase did — this is the one outbound link that has to survive a
 * degraded read (Rule 7), because an appeal that disappears during the
 * aftershock is an appeal nobody sees.
 *
 * Everything `/enlaces` prints on a row, this prints too: who operates the
 * destination, its bare hostname, and an explicit statement that verifying an
 * operator is not vouching for a campaign. Amplifying a donation link on every
 * page without that apparatus is precisely how a lookalike domain gets a free
 * ride off our credibility.
 */

const DONATE_URL = "https://helpcolombia.vaki.org/";

/** Printed for the reader to compare against the address bar. Kept as a
 *  literal rather than parsed from `DONATE_URL`: this string is the check, so
 *  it should be legible in the diff that changes it. */
const DONATE_HOST = "helpcolombia.vaki.org";

/**
 * Vaki Global Ltd is the Colombian crowdfunding platform the campaign runs on,
 * and the campaign sits on its own domain. That is the claim we can make and
 * have checked — the campaign page's separate claim to route funds through a
 * US 501(c)(3) is theirs, and is attributed as theirs in `donate.scope`.
 */
const DONATE_OPERATOR = "Vaki (Vaki Global Ltd)";

/** Shared anchor props — every route out of here opens a new tab. */
const externalProps = {
  href: DONATE_URL,
  target: "_blank",
  rel: "noreferrer noopener",
} as const;

/**
 * The slim, site-wide strip. Sits directly under the masthead on every page.
 *
 * Inverted ink rather than a saturated fill: the chrome is achromatic so that
 * the only saturated colour on the site is a service status, and a donation
 * CTA competing with four status hues for the same attention would cost more
 * than it gains. Solid foreground-on-background is the loudest device the
 * palette allows without spending chroma.
 */
export function DonateBar({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <aside
      aria-label={t.donate.eyebrow}
      className="border-b border-foreground/25 bg-foreground text-background"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:gap-4">
        <HeartHandshake className="hidden size-4 shrink-0 sm:block" aria-hidden />

        {/* `min-w-0` so the title truncates before the CTA is pushed off a
            320px screen — the button is the only element here that matters. */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-semibold">
            <span className="label-signage mr-2 hidden text-background/70 md:inline">
              {t.donate.eyebrow}
            </span>
            {t.donate.barTitle}
          </p>
          {/* Shown at every width, including 320. It costs a second line on a
              phone, which is where nearly all of this traffic is and therefore
              exactly where a lookalike domain does its damage — the check is
              worth more than the line. */}
          <p
            data-readout
            className="mt-0.5 truncate font-mono text-[0.6875rem] leading-none text-background/70"
          >
            {DONATE_HOST}
          </p>
        </div>

        <Button
          size="sm"
          className="label-signage shrink-0 gap-1.5 rounded-sm bg-background text-foreground hover:bg-background/85"
          render={<a {...externalProps} />}
        >
          {t.donate.cta}
          <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only"> ({t.links.newTab})</span>
        </Button>
      </div>
    </aside>
  );
}

/**
 * The full plate, for pages where the appeal is content rather than chrome.
 *
 * Same inverted substrate as the bar so the two read as one voice, with the
 * provenance apparatus set as an instrument readout the way `/enlaces` sets
 * its rows.
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
      className={cn(
        "border border-foreground/25 bg-foreground text-background",
        className,
      )}
    >
      <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
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

          {/* Operator and bare domain, the same two facts every `/enlaces` row
              carries — this is what a reader checks against the address bar. */}
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
          className="label-signage h-11 shrink-0 gap-2 rounded-sm bg-background px-6 text-foreground hover:bg-background/85"
          render={<a {...externalProps} />}
        >
          {t.donate.cta}
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only"> ({t.links.newTab})</span>
        </Button>
      </div>

      {/* Set apart on its own rule: it qualifies the claim above rather than
          continuing it, and it must not read as part of the pitch. */}
      <p className="border-t border-background/20 px-6 py-3 text-xs leading-relaxed text-background/70 sm:px-8">
        {t.donate.verifyNote}
      </p>
    </section>
  );
}

/**
 * The footer's row. Deliberately *not* a third ink plate — the bar is already
 * on every page and the block may be too, and a third inverted slab in one
 * scroll stops reading as emphasis and starts reading as decoration. A ruled
 * row on the normal surface is enough this far down the page.
 */
export function DonateFooterLink({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <a
      {...externalProps}
      className="group flex items-center gap-3 border border-border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted"
    >
      <HeartHandshake className="size-5 shrink-0 transition-transform group-hover:scale-110" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-tight font-semibold">
          {t.donate.title}
          <span className="sr-only"> ({t.links.newTab})</span>
        </span>
        <span
          data-readout
          className="mt-1 block font-mono text-[0.6875rem] leading-none text-muted-foreground"
        >
          {DONATE_HOST}
        </span>
      </span>
      <span className="label-signage inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-foreground px-2.5 py-2 text-background">
        {t.donate.cta}
        <ExternalLink className="size-3" aria-hidden />
      </span>
    </a>
  );
}
