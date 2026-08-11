import { TriangleAlert } from "lucide-react";

import {
  formatDateTime,
  formatRelative,
  getDictionary,
  type Lang,
} from "@/lib/i18n";
import type { ServiceReportDensity } from "@/lib/types";

/**
 * What neighbours are reporting, by zone.
 *
 * This is *not* the status board and is styled so nobody mistakes it for one:
 * no status badge, no "official" chrome, and a standing note pointing at
 * /servicios for the operator's own word. See docs/EDITORIAL.md Rule 3 — the
 * board says "the operator told us", this says "residents told us", and
 * laundering the second into the first is the failure mode.
 *
 * Every number here is a count of households over a rolling 12-hour window,
 * not of submissions. The view does the de-duplication; see the migration.
 */
export function ReportDensity({
  rows,
  lang,
}: {
  rows: ServiceReportDensity[];
  lang: Lang;
}) {
  const t = getDictionary(lang).luz;

  if (rows.length === 0) {
    return (
      <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t.densityEmpty}
      </p>
    );
  }

  const totals = rows.reduce(
    (acc, r) => ({
      outage: acc.outage + Number(r.outage_count),
      degraded: acc.degraded + Number(r.degraded_count),
      operational: acc.operational + Number(r.operational_count),
      hazard: acc.hazard + Number(r.hazard_count),
    }),
    { outage: 0, degraded: 0, operational: 0, hazard: 0 },
  );

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-3 gap-2">
        <Total
          value={totals.outage}
          label={t.householdsOutage}
          className="border-down/40 bg-down-muted text-down-foreground"
        />
        <Total
          value={totals.degraded}
          label={t.householdsDegraded}
          className="border-warn/40 bg-warn-muted text-warn-foreground"
        />
        <Total
          value={totals.operational}
          label={t.householdsOperational}
          className="border-ok/40 bg-ok-muted text-ok-foreground"
        />
      </dl>

      {totals.hazard > 0 ? (
        <p className="flex items-center gap-2 border border-down/40 bg-down-muted p-3 text-sm text-down-foreground">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          <span>
            <span data-readout className="font-mono font-semibold">
              {totals.hazard}
            </span>{" "}
            {t.hazards}
          </span>
        </p>
      ) : null}

      <ul className="divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <ZoneRow key={`${row.service}-${row.zone_slug ?? "none"}`} row={row} lang={lang} />
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t.densityNotOfficial}
      </p>
    </div>
  );
}

function Total({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className: string;
}) {
  return (
    <div className={`border p-3 ${className}`}>
      <dt className="label-signage text-[0.65rem] opacity-80">{label}</dt>
      <dd data-readout className="mt-1 font-mono text-2xl font-semibold">
        {value}
      </dd>
    </div>
  );
}

function ZoneRow({ row, lang }: { row: ServiceReportDensity; lang: Lang }) {
  const t = getDictionary(lang).luz;

  const outage = Number(row.outage_count);
  const degraded = Number(row.degraded_count);
  const operational = Number(row.operational_count);
  const total = outage + degraded + operational || 1;

  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold">{row.zone_name ?? t.noZone}</p>
        <p className="font-mono text-xs text-muted-foreground">
          <span data-readout className="text-foreground">
            {Number(row.total_count)}
          </span>{" "}
          {t.households} ·{" "}
          <time
            dateTime={row.last_reported_at}
            title={formatDateTime(row.last_reported_at, lang)}
          >
            {formatRelative(row.last_reported_at, lang)}
          </time>
        </p>
      </div>

      {/*
        Proportion, encoded as width AND as the numbers underneath — a bar
        alone is unreadable in greyscale or on a cracked screen, which is the
        device a lot of this audience is holding.
      */}
      <div
        className="mt-2 flex h-2 w-full overflow-hidden rounded-sm bg-muted"
        aria-hidden
      >
        {outage > 0 ? (
          <span className="block bg-down" style={{ width: pct(outage) }} />
        ) : null}
        {degraded > 0 ? (
          <span className="block bg-warn" style={{ width: pct(degraded) }} />
        ) : null}
        {operational > 0 ? (
          <span className="block bg-ok" style={{ width: pct(operational) }} />
        ) : null}
      </div>

      <p className="mt-1.5 font-mono text-xs text-muted-foreground">
        {outage} {t.householdsOutage} · {degraded} {t.householdsDegraded} ·{" "}
        {operational} {t.householdsOperational}
        {Number(row.hazard_count) > 0 ? (
          <span className="text-down-foreground">
            {" "}
            · {Number(row.hazard_count)} {t.hazards}
          </span>
        ) : null}
      </p>
    </li>
  );
}
