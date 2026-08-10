import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { getUpdateBySlug } from "@/lib/data";
import {
  SERVICE_LABELS,
  SEVERITY_LABELS,
  SOURCE_LABELS,
  formatDateTime,
  getDictionary,
} from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import type { SeverityLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/actualizaciones/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { data: update } = await getUpdateBySlug(slug);
  if (!update) return {};
  return {
    title: update.title,
    description: update.summary ?? undefined,
  };
}

const SEVERITY_STYLES: Record<SeverityLevel, string> = {
  info: "bg-muted text-muted-foreground border-border",
  warning: "bg-warn-muted text-warn-foreground border-warn/40",
  critical: "bg-down-muted text-down-foreground border-down/40",
};

const SEVERITY_RULE: Record<SeverityLevel, string> = {
  info: "border-border",
  warning: "border-warn",
  critical: "border-down",
};

const CHIP = "label-signage inline-flex items-center rounded-sm border px-1.5 py-1";

export default async function UpdatePage({
  params,
}: PageProps<"/actualizaciones/[slug]">) {
  const { slug } = await params;
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: update } = await getUpdateBySlug(slug);
  if (!update) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 pb-16 sm:py-14">
      <Link
        href="/"
        className="label-signage inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {t.updates.backToFeed}
      </Link>

      {/* The severity rule doubles as the dispatch's top edge. */}
      <header
        className={cn("mt-6 border-t-2 pt-5", SEVERITY_RULE[update.severity])}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(CHIP, SEVERITY_STYLES[update.severity])}>
            {SEVERITY_LABELS[lang][update.severity]}
          </span>
          {update.services.map((service) => (
            <span
              key={service}
              className={cn(
                CHIP,
                "border-transparent bg-secondary text-secondary-foreground",
              )}
            >
              {SERVICE_LABELS[lang][service]}
            </span>
          ))}
        </div>

        <h1 className="display-condensed mt-4 text-4xl leading-[1.05] font-extrabold text-balance uppercase sm:text-5xl">
          {update.title}
        </h1>

        {update.summary ? (
          <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
            {update.summary}
          </p>
        ) : null}

        {/* Source and time, on every claim. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-y border-border py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
          {update.published_at ? (
            <time dateTime={update.published_at}>
              {formatDateTime(update.published_at, lang)}
            </time>
          ) : null}
          <span className="text-border" aria-hidden>
            ·
          </span>
          <span>{SOURCE_LABELS[lang][update.source]}</span>
          {update.source_name ? (
            <span className="font-semibold text-foreground">
              {update.source_name}
            </span>
          ) : null}
        </div>
      </header>

      {update.body ? (
        <div className="mt-8 space-y-4 text-[1.0625rem] leading-relaxed">
          {update.body.split("\n\n").map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line">
              {renderEmphasis(paragraph)}
            </p>
          ))}
        </div>
      ) : null}

      {update.source_url ? (
        <a
          href={update.source_url}
          target="_blank"
          rel="noreferrer noopener"
          className="label-signage mt-8 inline-flex items-center gap-1.5 border border-border px-3 py-2 underline-offset-4 hover:bg-muted"
        >
          {t.updates.viewSource}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </article>
  );
}

/**
 * Minimal **bold** support. Deliberately not a Markdown renderer: update bodies
 * can come from partner submissions, and a full HTML pipeline here would be an
 * injection surface on a site people are trusting in an emergency.
 */
function renderEmphasis(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith("**") && chunk.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      chunk
    ),
  );
}
