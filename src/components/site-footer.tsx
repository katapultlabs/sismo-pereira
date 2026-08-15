import { ArrowUpRight, Code, Phone } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { EMERGENCY_LINES } from "@/lib/fallback-data";
import { getDictionary, type Lang } from "@/lib/i18n";

const REPO_URL = "https://github.com/katapultlabs/aquiayuda";

const LINK =
  "text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * The footer as a bordered directory: four ruled columns of links closed by a
 * single life-safety CTA row, with the wordmark set above it. Shared by every
 * page.
 */
export function SiteFooter({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  const columns = [
    {
      heading: t.footer.sections,
      links: [
        { label: t.nav.services, href: "/servicios" as const },
        { label: t.nav.reports, href: "/reportes" as const },
        { label: t.nav.resources, href: "/recursos" as const },
        { label: t.nav.links, href: "/enlaces" as const },
        { label: t.nav.partners, href: "/organizaciones" as const },
      ],
    },
    {
      heading: t.footer.act,
      links: [
        { label: t.reports.submitCta, href: "/reportar" as const },
        { label: t.donate.title, href: "/donar" as const },
        { label: t.partners.contactHeading, href: "/organizaciones" as const },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="px-3 py-3">
        {/* Wordmark, centred. */}
        <div className="flex justify-center pt-1 pb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandMark className="h-[1.375rem] w-[1.375rem] shrink-0" />
            <span className="display-condensed text-lg leading-none">
              <span className="font-extrabold">AquíAyuda</span>
              <span className="ml-1.5 font-normal text-muted-foreground">
                Pereira
              </span>
            </span>
          </Link>
        </div>

        {/* The directory box: four ruled columns, then the CTA row. Spans the
            full width of the footer, matching the full-bleed page. */}
        <div className="overflow-hidden rounded-sm border border-border">
          <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
            {columns.map((col) => (
              <div key={col.heading} className="bg-background p-5 sm:p-6">
                <h2 className="display-condensed text-sm font-bold uppercase">
                  {col.heading}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className={LINK}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Emergency lines — a fixed numeral column. */}
            <div className="bg-background p-5 sm:p-6">
              <h2 className="display-condensed text-sm font-bold uppercase">
                {t.resources.linesHeading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {EMERGENCY_LINES.map((line) => (
                  <li key={line.number}>
                    <a
                      href={`tel:${line.number}`}
                      className="flex items-baseline gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span
                        data-readout
                        className="w-8 shrink-0 font-mono font-semibold text-foreground"
                      >
                        {line.number}
                      </span>
                      {line.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* The site. */}
            <div className="bg-background p-5 sm:p-6">
              <h2 className="display-condensed text-sm font-bold uppercase">
                {t.footer.site}
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    <Code className="size-3.5" aria-hidden />
                    {t.footer.sourceCode}
                  </a>
                </li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-pretty text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>

          {/* Life-safety CTA row — the footer's one prominent action. */}
          <a
            href="tel:123"
            className="group flex items-center justify-between gap-4 border-t border-border bg-muted/40 px-5 py-4 transition-colors hover:bg-muted sm:px-6"
          >
            <span className="display-condensed flex items-center gap-2.5 text-base font-extrabold uppercase">
              <Phone className="size-4 shrink-0 text-down" aria-hidden />
              {t.footer.callCta}
            </span>
            <ArrowUpRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
              aria-hidden
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
