import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getUpdateBySlug } from "@/lib/data";
import {
  SERVICE_LABELS,
  SEVERITY_LABELS,
  SOURCE_LABELS,
  formatDateTime,
  getDictionary,
} from "@/lib/i18n";
import { getLang } from "@/lib/lang";

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

export default async function UpdatePage({
  params,
}: PageProps<"/actualizaciones/[slug]">) {
  const { slug } = await params;
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: update } = await getUpdateBySlug(slug);
  if (!update) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {t.updates.backToFeed}
      </Link>

      <header className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              update.severity === "critical"
                ? "border-down/40 bg-down-muted text-down-foreground"
                : update.severity === "warning"
                  ? "border-warn/40 bg-warn-muted text-warn-foreground"
                  : ""
            }
          >
            {SEVERITY_LABELS[lang][update.severity]}
          </Badge>
          {update.services.map((service) => (
            <Badge key={service} variant="secondary">
              {SERVICE_LABELS[lang][service]}
            </Badge>
          ))}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {update.title}
        </h1>

        {update.summary ? (
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
            {update.summary}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-y py-3 text-sm text-muted-foreground">
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
            <span className="font-medium text-foreground">
              {update.source_name}
            </span>
          ) : null}
        </div>
      </header>

      {update.body ? (
        <div className="mt-8 space-y-4">
          {update.body.split("\n\n").map((paragraph, i) => (
            <p key={i} className="leading-relaxed whitespace-pre-line">
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
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
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
