"use client";

import { useActionState } from "react";
import { Check, Copy, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { moderateReport, type ModerationState } from "@/lib/moderation";
import {
  CATEGORY_LABELS,
  SERVICE_LABELS,
  formatDateTime,
  type Lang,
  type ReportCategory,
} from "@/lib/i18n";
import type { ServiceType } from "@/lib/types";

interface PendingReport {
  id: string;
  category: string;
  service: string | null;
  zone_slug: string | null;
  address_hint: string | null;
  description: string;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
}

const INITIAL: ModerationState = { ok: false };

export function ModerationRow({
  report,
  lang,
}: {
  report: PendingReport;
  lang: Lang;
}) {
  const [state, formAction, pending] = useActionState(moderateReport, INITIAL);

  // Once decided, collapse the row so the queue visibly shrinks as it's worked.
  if (state.ok) return null;

  return (
    <Card className="gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {CATEGORY_LABELS[lang][report.category as ReportCategory] ??
            report.category}
        </Badge>
        {report.service ? (
          <Badge variant="outline">
            {SERVICE_LABELS[lang][report.service as ServiceType]}
          </Badge>
        ) : null}
        {report.zone_slug ? (
          <Badge variant="outline">{report.zone_slug}</Badge>
        ) : null}
        <time
          dateTime={report.created_at}
          className="ml-auto text-xs text-muted-foreground"
        >
          {formatDateTime(report.created_at, lang)}
        </time>
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-line">
        {report.description}
      </p>

      {report.address_hint ? (
        <p className="text-sm text-muted-foreground">📍 {report.address_hint}</p>
      ) : null}

      {report.contact_name || report.contact_phone ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Contacto
          </span>
          {report.contact_name ? <span>{report.contact_name}</span> : null}
          {report.contact_phone ? (
            <>
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
            </>
          ) : null}
          <span className="w-full text-xs text-muted-foreground">
            No se publica. Úsalo solo para verificar.
          </span>
        </div>
      ) : null}

      <form action={formAction} className="flex flex-wrap items-center gap-2 pt-1">
        <input type="hidden" name="id" value={report.id} />
        <Input
          name="note"
          placeholder="Nota interna (opcional)"
          className="h-8 min-w-40 flex-1"
          maxLength={1000}
        />
        <Button
          type="submit"
          name="decision"
          value="verified"
          size="sm"
          disabled={pending}
          className="gap-1.5 bg-ok text-ok-foreground hover:bg-ok/90"
        >
          <Check className="size-3.5" aria-hidden />
          Publicar
        </Button>
        <Button
          type="submit"
          name="decision"
          value="rejected"
          size="sm"
          variant="outline"
          disabled={pending}
          className="gap-1.5"
        >
          <X className="size-3.5" aria-hidden />
          Rechazar
        </Button>
        <Button
          type="submit"
          name="decision"
          value="duplicate"
          size="sm"
          variant="ghost"
          disabled={pending}
        >
          Duplicado
        </Button>
      </form>

      {state.message ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </Card>
  );
}
