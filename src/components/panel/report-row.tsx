"use client";

import { useActionState } from "react";
import { Check, Copy, MapPin, TriangleAlert, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { acknowledgeReport, flagReport, type PanelActionState } from "@/lib/panel";
import {
  LOCATION_SOURCE_LABELS,
  OUTAGE_SINCE_LABELS,
  REPORTED_STATUS_LABELS,
  formatDateTime,
  formatRelative,
} from "@/lib/i18n";
import type { ServiceReport } from "@/lib/types";

const INITIAL: PanelActionState = { ok: false };

/**
 * One household report, as a dispatcher reads it.
 *
 * Spanish only, like `/admin`: this is an internal tool for a control room in
 * Pereira, and the bilingual machinery exists for the public bulletin.
 *
 * Every identifying field on this row — phone, matrícula, coordinates — is
 * visible here and nowhere public. See docs/EDITORIAL.md Rule 4.
 */
export function PanelReportRow({ report }: { report: ServiceReport }) {
  const [ackState, ackAction, ackPending] = useActionState(
    acknowledgeReport,
    INITIAL,
  );
  const [flagState, flagAction, flagPending] = useActionState(
    flagReport,
    INITIAL,
  );

  // Optimistically gone: a flagged report should leave the queue immediately,
  // the way a moderated report does.
  if (flagState.ok) return null;

  const acknowledged = ackState.ok
    ? report.acknowledged_at == null
    : report.acknowledged_at != null;

  const statusTone =
    report.status === "outage"
      ? "border-down/40 bg-down-muted text-down-foreground"
      : report.status === "degraded"
        ? "border-warn/40 bg-warn-muted text-warn-foreground"
        : "border-ok/40 bg-ok-muted text-ok-foreground";

  return (
    <li
      className={`space-y-2 border border-border p-4 ${
        acknowledged ? "opacity-60" : ""
      } ${report.hazard ? "border-l-4 border-l-down" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`label-signage border px-2 py-1 ${statusTone}`}>
          {REPORTED_STATUS_LABELS.es[report.status]}
        </span>

        {report.hazard ? (
          <span className="label-signage flex items-center gap-1 border border-down bg-down px-2 py-1 text-down-contrast">
            <TriangleAlert className="size-3" aria-hidden />
            Cable o poste caído
          </span>
        ) : null}

        {report.zone_slug ? (
          <Badge variant="outline">{report.zone_slug}</Badge>
        ) : null}

        {report.on_behalf ? (
          <Badge variant="secondary">Reporta por otra persona</Badge>
        ) : null}

        <time
          dateTime={report.created_at}
          title={formatDateTime(report.created_at, "es")}
          className="ml-auto font-mono text-xs text-muted-foreground"
        >
          {formatRelative(report.created_at, "es")}
        </time>
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <Field label="Desde">{OUTAGE_SINCE_LABELS.es[report.since]}</Field>

        <Field label="Teléfono">
          {report.contact_phone ? (
            <span className="flex items-center gap-1.5">
              <a
                href={`tel:${report.contact_phone}`}
                className="font-mono underline underline-offset-4"
              >
                {report.contact_phone}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Copiar teléfono"
                onClick={() =>
                  navigator.clipboard?.writeText(report.contact_phone ?? "")
                }
              >
                <Copy className="size-3" aria-hidden />
              </Button>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Field>

        <Field label="Matrícula">
          {report.matricula ? (
            <span className="font-mono">{report.matricula}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Field>

        <Field label="Ubicación">
          {report.lat != null && report.lng != null ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <a
                href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 font-mono underline underline-offset-4"
              >
                <MapPin className="size-3" aria-hidden />
                {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
              </a>
              <span className="text-xs text-muted-foreground">
                {report.location_source
                  ? LOCATION_SOURCE_LABELS.es[report.location_source]
                  : null}
                {report.location_accuracy_m != null
                  ? ` ±${Math.round(report.location_accuracy_m)} m`
                  : null}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Solo comuna</span>
          )}
        </Field>
      </dl>

      {report.address_hint ? (
        <p className="text-sm">
          <span className="label-signage mr-2 text-muted-foreground">
            Referencia
          </span>
          {report.address_hint}
        </p>
      ) : null}

      {report.note ? (
        <p className="border-l-2 border-border pl-3 text-sm leading-relaxed whitespace-pre-line">
          {report.note}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <form action={ackAction}>
          <input type="hidden" name="id" value={report.id} />
          <input
            type="hidden"
            name="acknowledged"
            value={acknowledged ? "false" : "true"}
          />
          <Button
            type="submit"
            size="sm"
            variant={acknowledged ? "ghost" : "outline"}
            disabled={ackPending}
            className="label-signage gap-1.5 rounded-sm"
          >
            {acknowledged ? (
              <>
                <Undo2 className="size-3.5" aria-hidden />
                Devolver a pendientes
              </>
            ) : (
              <>
                <Check className="size-3.5" aria-hidden />
                Marcar como atendido
              </>
            )}
          </Button>
        </form>

        <form action={flagAction}>
          <input type="hidden" name="id" value={report.id} />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={flagPending}
            className="label-signage rounded-sm text-muted-foreground"
          >
            Descartar
          </Button>
        </form>

        {ackState.message ? (
          <p className="text-xs text-destructive">{ackState.message}</p>
        ) : null}
        {flagState.message ? (
          <p className="text-xs text-destructive">{flagState.message}</p>
        ) : null}
      </div>
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="label-signage shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
