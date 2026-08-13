import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Info, ShieldCheck, Users } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { SectionHeading } from "@/components/section-heading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getLinks } from "@/lib/data";
import {
  LINK_CATEGORIES,
  LINK_CATEGORY_LABELS,
  SOURCE_LABELS,
  getDictionary,
} from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import type { SiteLink } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).links.heading };
}

/**
 * The domain, shown to the reader so they can check it against the address bar.
 *
 * Returns null for anything that is not parseable https, and the caller drops
 * that row entirely. A malformed URL must never reach `new URL()` unguarded on
 * a page that is contractually not allowed to throw — see `query()` in
 * `src/lib/data.ts`.
 */
function displayHost(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default async function LinksPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data, degraded } = await getLinks();

  const links = data
    .map((link) => ({ link, host: displayHost(link.url) }))
    .filter((entry): entry is { link: SiteLink; host: string } =>
      entry.host !== null,
    );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading
        as="h1"
        title={t.links.heading}
        subtitle={t.links.subheading}
      />

      {/* The notice says we checked who runs each destination and nothing
          more. `/verificacion` is where "checked" is actually defined, so the
          claim and its standard sit together rather than the claim alone. */}
      <Alert className="mt-8 rounded-sm">
        <Info className="size-4" aria-hidden />
        <AlertDescription>
          {t.links.externalNotice}{" "}
          <Link
            href="/verificacion"
            className="font-semibold underline underline-offset-4"
          >
            {t.verification.cardLink}
          </Link>
        </AlertDescription>
      </Alert>

      {degraded ? (
        <div className="mt-4">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {links.length === 0 ? (
        <p className="mt-8 border border-dashed border-border p-10 text-center text-sm leading-relaxed text-muted-foreground">
          {t.links.empty}
        </p>
      ) : (
        <div className="mt-12 space-y-10">
          {LINK_CATEGORIES.map((category) => {
            const rows = links.filter((e) => e.link.category === category);
            if (rows.length === 0) return null;

            return (
              <section
                key={category}
                /* The home page's action board sends anyone searching for a
                   person straight to this block, so it needs a stable anchor.
                   `scroll-mt` clears the sticky masthead. */
                id={
                  category === "missing_persons"
                    ? "personas-desaparecidas"
                    : undefined
                }
                className="scroll-mt-20"
              >
                <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
                  {LINK_CATEGORY_LABELS[lang][category]}
                </h2>

                {/*
                 * We deliberately do not run a registry, so this list is our
                 * entire answer to someone searching for a person. Saying that
                 * plainly here stops the page from reading as though a name
                 * could be filed with us.
                 */}
                {category === "missing_persons" ? (
                  <p className="mt-4 border border-warn/40 bg-warn-muted p-3 text-sm leading-relaxed text-warn-foreground">
                    {t.links.missingPersonsNote}
                  </p>
                ) : null}

                <ul className="mt-4 space-y-2">
                  {rows.map(({ link, host }, i) => {
                    const official = link.source === "official";
                    return (
                      <li
                        key={link.id}
                        className="animate-rise relative border border-border bg-card transition-colors hover:border-foreground/30"
                        style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                      >
                        <div className="flex flex-col gap-2 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                            <h3 className="display-condensed text-base font-bold text-balance">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                /* Whole-row target — same idiom as UpdateCard. */
                                className="underline-offset-4 after:absolute after:inset-0 hover:underline"
                              >
                                {link.title}
                                <span className="sr-only"> ({t.links.newTab})</span>
                              </a>
                            </h3>

                            {/* Official vs not is encoded three ways — tint,
                                icon, and words — so it survives greyscale. */}
                            <span
                              className={cn(
                                "label-signage inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-1",
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
                                ? SOURCE_LABELS[lang][link.source]
                                : t.links.notOfficial}
                            </span>
                          </div>

                          {link.description ? (
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {link.description}
                            </p>
                          ) : null}

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
                            <span>
                              {t.links.operator}{" "}
                              <span className="font-semibold text-foreground">
                                {link.operator}
                              </span>
                            </span>
                            <span className="text-border" aria-hidden>
                              ·
                            </span>
                            {/* The domain is an instrument value here: it is
                                what a reader compares against the address bar
                                when a lookalike is going round WhatsApp. */}
                            <span
                              data-readout
                              className="inline-flex items-center gap-1 font-semibold text-foreground"
                            >
                              {host}
                              <ExternalLink className="size-3" aria-hidden />
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
