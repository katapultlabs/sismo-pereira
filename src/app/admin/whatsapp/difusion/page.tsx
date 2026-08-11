import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { ADMIN_TABS, AdminShell } from "@/components/admin-shell";
import { WhatsAppBroadcastForm } from "@/components/whatsapp-broadcast-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getModerator } from "@/lib/auth";
import { getUpdates, getZones } from "@/lib/data";
import { formatDateTime } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { getServerSupabase } from "@/lib/supabase/server";
import { getBroadcastTemplate } from "@/lib/whatsapp/config";

export const metadata = { title: "Difusión", robots: { index: false } };
export const dynamic = "force-dynamic";

// A chunk of 200 recipients at ~120 ms each, plus the Graph round trips.
export const maxDuration = 300;

interface BroadcastRow {
  id: string;
  body_preview: string;
  status: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default async function BroadcastPage() {
  const lang = await getLang();
  const moderator = await getModerator();

  if (!moderator) {
    return (
      <AdminShell title="Difusión" tabs={ADMIN_TABS} active="/admin/whatsapp/difusion">
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

  const template = getBroadcastTemplate();
  const supabase = await getServerSupabase();

  const [{ data: updates }, { data: zones }] = await Promise.all([
    getUpdates(20),
    getZones(),
  ]);

  // `head: true` counts server-side rather than shipping every row back just
  // to call `.length` on it.
  const { count: subscriberCount, error: subscriberError } = supabase
    ? await supabase
        .from("whatsapp_contacts")
        .select("id", { count: "exact", head: true })
        .eq("subscription", "subscribed")
        .eq("blocked", false)
    : { count: null, error: null };

  const { data: historyRows, error: historyError } = supabase
    ? await supabase
        .from("whatsapp_broadcasts")
        .select("id, body_preview, status, recipient_count, sent_count, failed_count, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: null, error: null };

  const history = (historyRows ?? []) as BroadcastRow[];
  const readError = subscriberError ?? historyError;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sismopereira.org";

  return (
    <AdminShell
      title="Difusión"
      user={moderator.email}
      tabs={ADMIN_TABS}
      active="/admin/whatsapp/difusion"
    >
      <div className="flex items-center gap-3 border-b border-foreground/25 pb-2">
        <h2 className="label-signage text-muted-foreground">Suscriptores</h2>
        <span
          data-readout
          className="label-signage ml-auto rounded-sm bg-secondary px-1.5 py-1 text-secondary-foreground"
        >
          {/* "?" not "0": a failed count must never read as an empty list. */}
          {subscriberError ? "?" : (subscriberCount ?? 0)}
        </span>
      </div>

      {readError ? (
        <Alert className="border-down/40 bg-down-muted text-down-foreground">
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>No se pudo leer la lista de suscriptores</AlertTitle>
          <AlertDescription>
            {readError.message} — no difundas hasta saber a cuántas personas
            llegaría.
          </AlertDescription>
        </Alert>
      ) : null}

      {!template ? (
        <Alert className="rounded-sm">
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>La difusión está desactivada</AlertTitle>
          <AlertDescription>
            Falta <code className="font-mono">WHATSAPP_BROADCAST_TEMPLATE</code>.
            Fuera de la ventana de 24 h WhatsApp solo entrega plantillas
            aprobadas, así que sin una plantilla no hay difusión posible. Ver{" "}
            <code className="font-mono">docs/WHATSAPP.md</code>.
          </AlertDescription>
        </Alert>
      ) : (
        <WhatsAppBroadcastForm
          updates={updates}
          zones={zones}
          siteUrl={siteUrl}
          templateName={template.name}
        />
      )}

      {history.length > 0 ? (
        <section className="space-y-2">
          <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
            Historial
          </h2>
          <ul className="divide-y divide-border">
            {history.map((row) => (
              <li key={row.id} className="space-y-1 py-3">
                <p className="text-sm">{row.body_preview}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(row.created_at, lang)} · {row.status} ·{" "}
                  {row.sent_count}/{row.recipient_count} enviados
                  {row.failed_count > 0 ? ` · ${row.failed_count} fallidos` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AdminShell>
  );
}
