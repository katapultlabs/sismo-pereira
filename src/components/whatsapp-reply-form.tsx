"use client";

import { useActionState } from "react";
import { Ban, Send, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToThread, setBlocked, type ActionState } from "@/lib/whatsapp/actions";

const INITIAL: ActionState = { ok: false };

/**
 * Free-text reply box for one thread.
 *
 * Disabled outright when the 24-hour service window has closed, with the
 * reason spelled out. Meta would reject the send anyway; saying so before the
 * moderator types two paragraphs is the difference between a rule and a trap.
 */
export function WhatsAppReplyForm({
  contactId,
  windowOpen,
  blocked,
  lastInboundAt,
}: {
  contactId: string;
  windowOpen: boolean;
  blocked: boolean;
  lastInboundAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(replyToThread, INITIAL);
  const [blockState, blockAction, blockPending] = useActionState(setBlocked, INITIAL);

  return (
    <div className="space-y-3 border-t border-foreground/25 pt-4">
      {blocked ? (
        <p className="rounded-sm border border-down/40 bg-down-muted px-3 py-2 text-sm text-down-foreground">
          Este número está bloqueado. No se envían respuestas automáticas ni
          manuales, pero la conversación se conserva.
        </p>
      ) : !windowOpen ? (
        <p className="rounded-sm border border-warn/40 bg-warn-muted px-3 py-2 text-sm text-warn-foreground">
          <strong>Ventana de 24 h cerrada.</strong> WhatsApp solo permite
          plantillas aprobadas cuando han pasado más de 24 horas desde el último
          mensaje de la persona
          {lastInboundAt ? "" : " (nunca nos ha escrito)"}. Para volver a abrirla
          tiene que escribir de nuevo.
        </p>
      ) : null}

      <form action={formAction} className="space-y-2">
        <input type="hidden" name="contactId" value={contactId} />
        <label htmlFor="wa-reply" className="label-signage text-muted-foreground">
          Responder
        </label>
        <Textarea
          id="wa-reply"
          name="body"
          rows={3}
          maxLength={3000}
          disabled={!windowOpen || blocked || pending}
          placeholder={
            windowOpen && !blocked
              ? "Escribe la respuesta. Pregunta dónde y a qué hora — es lo que permite verificar."
              : "No disponible"
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={!windowOpen || blocked || pending}
            className="gap-1.5"
          >
            <Send className="size-3.5" aria-hidden />
            Enviar
          </Button>
          {state.message ? (
            <span className="text-xs text-destructive">{state.message}</span>
          ) : null}
          {state.ok ? (
            <span className="text-xs text-muted-foreground">Enviado.</span>
          ) : null}
        </div>
      </form>

      <form action={blockAction}>
        <input type="hidden" name="contactId" value={contactId} />
        <input type="hidden" name="blocked" value={blocked ? "false" : "true"} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          disabled={blockPending}
          className="gap-1.5 text-muted-foreground"
        >
          {blocked ? (
            <>
              <Undo2 className="size-3.5" aria-hidden />
              Desbloquear número
            </>
          ) : (
            <>
              <Ban className="size-3.5" aria-hidden />
              Bloquear número
            </>
          )}
        </Button>
        {blockState.message ? (
          <span className="ml-2 text-xs text-destructive">{blockState.message}</span>
        ) : null}
      </form>
    </div>
  );
}
