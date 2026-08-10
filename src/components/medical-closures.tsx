import { Ban, Phone } from "lucide-react";

import {
  MEDICAL_CENTRES_CLOSED,
  PMU_REPORT,
} from "@/lib/fallback-data";
import { formatDateTime, getDictionary, type Lang } from "@/lib/i18n";

/**
 * The "do not go" list.
 *
 * Deliberately *not* rendered as `resources` rows. A closed hospital sitting in
 * the same grid as shelters and aid points reads as a hospital directory at a
 * glance, which is the opposite of the message — so this is its own block, in
 * `down`, with a Ban icon and the reason spelled out on every line. Colour,
 * icon and text all say the same thing, per the three-way encoding rule.
 *
 * No addresses and no phone numbers here on purpose: the only actionable fact
 * is that the door is closed. The one number offered is 123.
 */
export function MedicalClosures({ lang }: { lang: Lang }) {
  const t = getDictionary(lang).resources.medical;

  return (
    <section className="mt-10 border border-down/40 bg-down-muted">
      <div className="flex items-start gap-3 border-b border-down/25 p-4 sm:p-5">
        <Ban className="mt-0.5 size-6 shrink-0 text-down" aria-hidden />
        <div className="min-w-0">
          <h2 className="display-condensed text-xl font-extrabold text-balance uppercase text-down-foreground sm:text-2xl">
            {t.heading}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-pretty text-down-foreground">
            {t.lede}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-down/20">
        {MEDICAL_CENTRES_CLOSED.map((centre) => (
          <li
            key={centre.name}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5"
          >
            <span className="display-condensed text-base font-bold text-down-foreground">
              {centre.name}
            </span>
            <span className="label-signage text-down-foreground">
              {t.reasons[centre.reason]}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-down/25 p-4 sm:p-5">
        <a
          href="tel:123"
          className="inline-flex items-center gap-2 font-semibold text-down-foreground underline-offset-4 hover:underline"
        >
          <Phone className="size-4 shrink-0 text-down" aria-hidden />
          {t.advice}
        </a>
        <p className="text-sm leading-relaxed text-down-foreground">
          {t.noAlternative}
        </p>
        <p className="font-mono text-[0.6875rem] leading-relaxed text-down-foreground">
          {t.sourceLabel}: {PMU_REPORT.sourceName} · {t.reportedLabel}:{" "}
          <span data-readout>
            {formatDateTime(PMU_REPORT.reportedAt, lang)}
          </span>
        </p>
      </div>
    </section>
  );
}
