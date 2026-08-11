// lucide-react v1 removed brand icons, so this uses a generic code glyph.
import { Code } from "lucide-react";
import Link from "next/link";

import { DonateFooterLink } from "@/components/donate-banner";
import { EMERGENCY_LINES } from "@/lib/fallback-data";
import { getDictionary, type Lang } from "@/lib/i18n";

const REPO_URL = "https://github.com/katapultlabs/sismo-pereira";

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <footer className="mt-auto border-t-2 border-foreground/25 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Above the columns, not inside one: none of the three headings
            ("Líneas de emergencia", "Organizaciones") would be honest over it. */}
        <DonateFooterLink lang={lang} />

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="display-condensed flex items-baseline gap-2 text-base uppercase">
              <span className="size-2 translate-y-px bg-down" aria-hidden />
              <span className="font-extrabold">Sismo</span>
              <span className="font-normal text-muted-foreground">Pereira</span>
            </p>
            <p className="label-signage mt-2 text-muted-foreground/70">
              {t.nav.tagline}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t.footer.disclaimer}
            </p>
          </div>

          <div>
            <p className="label-signage border-b border-border pb-2 text-muted-foreground">
              {t.resources.linesHeading}
            </p>
            <ul className="mt-2">
              {EMERGENCY_LINES.map((line) => (
                <li key={line.number}>
                  <a
                    href={`tel:${line.number}`}
                    className="flex items-baseline gap-3 border-b border-border/60 py-1.5 hover:bg-down-muted"
                  >
                    <span
                      data-readout
                      className="w-9 shrink-0 font-mono text-sm font-semibold"
                    >
                      {line.number}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {line.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-signage border-b border-border pb-2 text-muted-foreground">
              {t.nav.partners}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/organizaciones"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t.partners.contactHeading}
                </Link>
              </li>
              <li>
                <Link
                  href="/reportar"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t.reports.submitCta}
                </Link>
              </li>
              <li>
                <Link
                  href="/enlaces"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t.links.heading}
                </Link>
              </li>
              <li>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
                >
                  <Code className="size-3.5" aria-hidden />
                  {t.footer.sourceCode}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
