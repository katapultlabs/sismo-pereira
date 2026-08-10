import type { Metadata } from "next";
import { Phone } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getResources } from "@/lib/data";
import { EMERGENCY_LINES } from "@/lib/fallback-data";
import { RESOURCE_LABELS, getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import type { Resource, ResourceKind } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).resources.heading };
}

export default async function ResourcesPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: resources, degraded } = await getResources();

  const grouped = resources.reduce<Map<ResourceKind, Resource[]>>((acc, r) => {
    const list = acc.get(r.kind) ?? [];
    list.push(r);
    acc.set(r.kind, list);
    return acc;
  }, new Map());

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-16 sm:py-14">
      <SectionHeading
        as="h1"
        title={t.resources.heading}
        subtitle={t.resources.subheading}
      />

      {/*
       * Emergency lines are static, national, and always correct — they lead,
       * and they are set larger than anything else on the site. Someone
       * reaching this page in a panic should be able to hit a number without
       * reading a word, so each plate is a full-size tap target with the
       * numeral, not the label, as the dominant element.
       */}
      <section className="mt-8">
        <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
          {t.resources.linesHeading}
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EMERGENCY_LINES.map((line, i) => (
            <a
              key={line.number}
              href={`tel:${line.number}`}
              className="animate-rise group flex items-center gap-3 border border-border bg-card p-4 transition-colors hover:border-down hover:bg-down-muted"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Phone
                className="size-5 shrink-0 text-down transition-transform group-hover:scale-110"
                aria-hidden
              />
              <span className="min-w-0">
                <span
                  data-readout
                  className="block font-mono text-2xl leading-none font-semibold tracking-tight"
                >
                  {line.number}
                </span>
                <span className="label-signage mt-1.5 block truncate text-muted-foreground">
                  {line.label}
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {degraded ? (
        <div className="mt-8">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {resources.length === 0 ? (
        <p className="mt-8 border border-dashed border-border p-10 text-center text-sm leading-relaxed text-muted-foreground">
          {t.resources.empty}
        </p>
      ) : (
        <div className="mt-12 space-y-10">
          {[...grouped.entries()].map(([kind, rows]) => (
            <section key={kind}>
              <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
                {RESOURCE_LABELS[lang][kind]}
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {rows.map((resource) => (
                  <article
                    key={resource.id}
                    className="flex flex-col gap-2 border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="display-condensed text-base font-bold text-balance">
                        {resource.name}
                      </h3>
                      <StatusBadge status={resource.status} lang={lang} />
                    </div>
                    {resource.description ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {resource.description}
                      </p>
                    ) : null}
                    {resource.address ? (
                      <p className="text-sm">{resource.address}</p>
                    ) : null}

                    {resource.hours || resource.capacity != null ? (
                      <dl className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
                        {resource.hours ? (
                          <div className="flex gap-1">
                            <dt>{t.resources.hours}:</dt>
                            <dd className="font-semibold text-foreground">
                              {resource.hours}
                            </dd>
                          </div>
                        ) : null}
                        {resource.capacity != null ? (
                          <div className="flex gap-1">
                            <dt>{t.resources.capacity}:</dt>
                            <dd data-readout className="font-semibold text-foreground">
                              {resource.occupancy ?? "—"}/{resource.capacity}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}

                    {resource.phone ? (
                      <a
                        href={`tel:${resource.phone}`}
                        className="mt-auto inline-flex items-center gap-1.5 pt-1 font-mono text-sm font-semibold underline-offset-4 hover:underline"
                      >
                        <Phone className="size-3.5 text-down" aria-hidden />
                        {resource.phone}
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
