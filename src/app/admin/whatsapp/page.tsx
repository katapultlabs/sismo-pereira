import Link from "next/link";
import { Inbox, MessageSquare, ShieldAlert } from "lucide-react";

import { ADMIN_TABS, AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getModerator } from "@/lib/auth";
import { formatRelative } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { getServerSupabase } from "@/lib/supabase/server";
import { isWhatsAppConfigured } from "@/lib/whatsapp/config";

export const metadata = { title: "WhatsApp", robots: { index: false } };
export const dynamic = "force-dynamic";

interface Thread {
  id: string;
  wa_id: string;
  phone_e164: string;
  display_name: string | null;
  lang: string;
  subscription: string;
  blocked: boolean;
  unread_count: number;
  window_open: boolean;
  last_body: string | null;
  last_direction: "inbound" | "outbound" | null;
  last_at: string | null;
}

export default async function WhatsAppInboxPage() {
  const lang = await getLang();
  const moderator = await getModerator();

  if (!moderator) {
    return (
      <AdminShell title="WhatsApp" tabs={ADMIN_TABS} active="/admin/whatsapp">
        <Alert>
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>Solo para moderadores</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Inicia sesión con una cuenta con rol moderator o admin.</p>
            <Button size="sm" render={<Link href="/admin/login" />}>
              Ir al inicio de sesión
            </Button>
          </AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  const supabase = await getServerSupabase();
  // RLS decides what comes back: the view is `security_invoker`, so a
  // non-moderator session reads an empty inbox rather than phone numbers.
  const { data, error } = supabase
    ? await supabase
        .from("whatsapp_threads")
        // One line: supabase-js infers the row type from this string literal.
        .select("id, wa_id, phone_e164, display_name, lang, subscription, blocked, unread_count, window_open, last_body, last_direction, last_at")
        .order("last_at", { ascending: false, nullsFirst: false })
        .limit(100)
    : { data: null, error: null };

  const threads = (data ?? []) as Thread[];
  const unread = threads.reduce((n, t) => n + (t.unread_count > 0 ? 1 : 0), 0);

  return (
    <AdminShell
      title="WhatsApp"
      user={moderator.email}
      tabs={ADMIN_TABS}
      active="/admin/whatsapp"
    >
      {!isWhatsAppConfigured() ? (
        <Alert className="rounded-sm">
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>El canal de WhatsApp no está configurado</AlertTitle>
          <AlertDescription>
            Faltan variables de entorno. Las conversaciones guardadas siguen
            visibles, pero no se puede enviar ni recibir. Ver{" "}
            <code className="font-mono">docs/WHATSAPP.md</code>.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert className="border-down/40 bg-down-muted text-down-foreground">
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>No se pudo leer la bandeja</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-3 border-b border-foreground/25 pb-2">
        <h2 className="label-signage text-muted-foreground">Conversaciones</h2>
        <span
          data-readout
          className="label-signage ml-auto rounded-sm bg-secondary px-1.5 py-1 text-secondary-foreground"
        >
          {unread} / {threads.length}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Los números de teléfono no se publican nunca. Úsalos solo para verificar
        un reporte — ver <code className="font-mono">docs/EDITORIAL.md</code>,
        regla 4.
      </p>

      {threads.length === 0 ? (
        <p className="flex flex-col items-center gap-2 border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          <Inbox className="size-6" aria-hidden />
          Todavía no hay conversaciones.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/admin/whatsapp/${thread.id}`}
                className="flex flex-col gap-1 py-3 transition-colors hover:bg-secondary/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {thread.display_name ?? "Sin nombre"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {thread.phone_e164}
                  </span>
                  {thread.unread_count > 0 ? (
                    <Badge className="bg-warn text-warn-contrast">
                      {thread.unread_count} sin leer
                    </Badge>
                  ) : null}
                  {thread.blocked ? (
                    <Badge variant="outline">Bloqueado</Badge>
                  ) : null}
                  {thread.subscription === "subscribed" ? (
                    <Badge variant="outline">Alertas</Badge>
                  ) : null}
                  {!thread.window_open ? (
                    <Badge variant="outline" title="Fuera de la ventana de 24 h">
                      Ventana cerrada
                    </Badge>
                  ) : null}
                  {thread.last_at ? (
                    <time
                      dateTime={thread.last_at}
                      className="ml-auto font-mono text-xs text-muted-foreground"
                    >
                      {formatRelative(thread.last_at, lang)}
                    </time>
                  ) : null}
                </div>
                <p className="line-clamp-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MessageSquare
                    className="mt-0.5 size-3 shrink-0"
                    aria-hidden
                  />
                  {thread.last_direction === "outbound" ? "Tú: " : ""}
                  {thread.last_body ?? "—"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
