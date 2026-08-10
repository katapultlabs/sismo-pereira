// lucide-react v1 removed brand icons, so this uses a generic code glyph.
import { Code } from "lucide-react";

import { EMERGENCY_LINES } from "@/lib/fallback-data";
import { getDictionary, localePath, type Lang } from "@/lib/i18n";
import Link from "next/link";

const REPO_URL = "https://github.com/katapultlabs/sismo-pereira";

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="font-semibold tracking-tight">Sismo Pereira</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.footer.disclaimer}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t.resources.linesHeading}</p>
            <ul className="space-y-1 text-sm">
              {EMERGENCY_LINES.map((line) => (
                <li key={line.number} className="flex items-baseline gap-2">
                  <a
                    href={`tel:${line.number}`}
                    className="font-mono font-semibold text-foreground underline-offset-4 hover:underline"
                  >
                    {line.number}
                  </a>
                  <span className="text-muted-foreground">{line.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t.nav.partners}</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link
                  href={localePath(lang, "/organizaciones")}
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t.partners.contactHeading}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath(lang, "/reportar")}
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t.reports.submitCta}
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
