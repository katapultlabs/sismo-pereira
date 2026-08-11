"use client";

import { useActionState, useState } from "react";
import { Megaphone, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  continueBroadcast,
  startBroadcast,
  type BroadcastState,
} from "@/lib/whatsapp/actions";
import type { Update } from "@/lib/types";
import type { Zone } from "@/lib/types";

const INITIAL: BroadcastState = { ok: false };

/**
 * Compose a broadcast from an already-published update.
 *
 * The form deliberately cannot compose free text. A broadcast goes to people
 * who are not in a conversation with us, at scale, and the only thing worth
 * sending them is something that already passed the publishing bar — so the
 * source is a published update and its own URL, never a message typed here.
 */
export function WhatsAppBroadcastForm({
  updates,
  zones,
  siteUrl,
  templateName,
}: {
  updates: Update[];
  zones: Zone[];
  siteUrl: string;
  templateName: string;
}) {
  const [state, formAction, pending] = useActionState(startBroadcast, INITIAL);
  const [continueState, continueAction, continuePending] = useActionState(
    continueBroadcast,
    INITIAL,
  );
  const [selected, setSelected] = useState<string>(updates[0]?.id ?? "");

  const update = updates.find((u) => u.id === selected) ?? null;
  const url = update?.slug
    ? `${siteUrl}/actualizaciones/${update.slug}`
    : siteUrl;

  const latest = continueState.broadcastId ? continueState : state;

  if (updates.length === 0) {
    return (
      <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay actualizaciones publicadas para difundir. Publica una primero —
        una difusión no es un canal para escribir texto nuevo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="updateId" value={update?.id ?? ""} />
        <input type="hidden" name="title" value={update?.title ?? ""} />
        <input type="hidden" name="url" value={url} />

        <div className="space-y-1.5">
          <label htmlFor="wa-update" className="label-signage text-muted-foreground">
            Actualización publicada
          </label>
          <select
            id="wa-update"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm"
          >
            {updates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="wa-zone" className="label-signage text-muted-foreground">
              Zona (opcional)
            </label>
            <select
              id="wa-zone"
              name="zoneSlug"
              className="w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Todas las zonas</option>
              {zones.map((zone) => (
                <option key={zone.slug} value={zone.slug}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wa-lang" className="label-signage text-muted-foreground">
              Idioma (opcional)
            </label>
            <select
              id="wa-lang"
              name="lang"
              className="w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="label-signage text-muted-foreground">
            Enlace que recibirán
          </span>
          <Input value={url} readOnly className="font-mono text-xs" />
        </div>

        <p className="rounded-sm border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          Se envía con la plantilla aprobada{" "}
          <code className="font-mono">{templateName}</code>. WhatsApp arma el
          texto final a partir de esa plantilla — aquí solo se define el título
          y el enlace que van dentro. Solo se envía a quien escribió{" "}
          <strong>ALERTAS</strong>.
        </p>

        <Button type="submit" disabled={pending} className="gap-1.5">
          <Megaphone className="size-4" aria-hidden />
          {pending ? "Enviando…" : "Enviar difusión"}
        </Button>
      </form>

      {latest.broadcastId ? (
        <div className="space-y-2 rounded-sm border border-border p-3">
          <p className="font-mono text-xs">
            enviados {latest.sent ?? 0} · fallidos {latest.failed ?? 0} ·
            pendientes {latest.remaining ?? 0}
          </p>
          {latest.message ? (
            <p className="text-xs text-destructive">{latest.message}</p>
          ) : null}
          {(latest.remaining ?? 0) > 0 ? (
            <form action={continueAction}>
              <input type="hidden" name="broadcastId" value={latest.broadcastId} />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={continuePending}
                className="gap-1.5"
              >
                <Play className="size-3.5" aria-hidden />
                Continuar con los {latest.remaining} restantes
              </Button>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground">Difusión completa.</p>
          )}
        </div>
      ) : null}

      {state.message && !state.broadcastId ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </div>
  );
}
