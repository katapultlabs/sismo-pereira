import type { Metadata } from "next";
import { Info } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { ServiceStatusCard } from "@/components/service-status-card";
import { getServiceStatus } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).status.heading };
}

export default async function ServicesPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: statuses, degraded } = await getServiceStatus();
  const hasUnknown = statuses.some((s) => s.status === "unknown");

  return (
    <div className="pb-12">
      <h1 className="display-condensed text-center text-3xl font-extrabold uppercase sm:text-4xl">
        {t.status.heading}
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-pretty text-muted-foreground">
        {t.status.subheading}
      </p>

      {degraded ? (
        <div className="mt-6">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {/* The caveat lives with the readings it qualifies — the same info card
          the home board carries. */}
      {hasUnknown ? (
        <div className="mt-6 flex items-start gap-2.5 rounded-sm border border-border bg-muted/40 p-4">
          <Info
            className="mt-px size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {t.status.unknownNotice}
          </p>
        </div>
      ) : null}

      {/* Each zone reading as a card — the home board's idiom — in two
          columns. */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {statuses.map((status) => (
          <ServiceStatusCard
            key={status.id}
            status={status}
            lang={lang}
            showZone
          />
        ))}
      </div>
    </div>
  );
}
