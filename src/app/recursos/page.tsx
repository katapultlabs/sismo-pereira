import type { Metadata } from "next";
import { Phone } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.resources.heading}
        </h1>
        <p className="text-muted-foreground">{t.resources.subheading}</p>
      </header>

      {/* Emergency lines are static, national, and always correct — they lead. */}
      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {t.resources.linesHeading}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EMERGENCY_LINES.map((line) => (
            <a
              key={line.number}
              href={`tel:${line.number}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-down/40 hover:bg-down-muted"
            >
              <Phone className="size-5 shrink-0 text-down" aria-hidden />
              <span className="min-w-0">
                <span className="block font-mono text-lg font-semibold">
                  {line.number}
                </span>
                <span className="block truncate text-sm text-muted-foreground">
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
        <p className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm leading-relaxed text-muted-foreground">
          {t.resources.empty}
        </p>
      ) : (
        <div className="mt-10 space-y-8">
          {[...grouped.entries()].map(([kind, rows]) => (
            <section key={kind} className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {RESOURCE_LABELS[lang][kind]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {rows.map((resource) => (
                  <Card key={resource.id} className="gap-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{resource.name}</h3>
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
                    <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                      {resource.hours ? (
                        <Badge variant="outline">
                          {t.resources.hours}: {resource.hours}
                        </Badge>
                      ) : null}
                      {resource.capacity != null ? (
                        <Badge variant="outline">
                          {t.resources.capacity}: {resource.occupancy ?? "—"}/
                          {resource.capacity}
                        </Badge>
                      ) : null}
                    </div>
                    {resource.phone ? (
                      <a
                        href={`tel:${resource.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                      >
                        <Phone className="size-3.5" aria-hidden />
                        <span className="font-mono">{resource.phone}</span>
                      </a>
                    ) : null}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
