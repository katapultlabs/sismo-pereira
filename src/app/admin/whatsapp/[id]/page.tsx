import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ShieldAlert } from "lucide-react";

import { ADMIN_TABS, AdminShell } from "@/components/admin-shell";
import { WhatsAppReplyForm } from "@/components/whatsapp-reply-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModerator } from "@/lib/auth";
import { formatDateTime } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { getServerSupabase } from "@/lib/supabase/server";
import { isWithinServiceWindow } from "@/lib/whatsapp/config";
import { cn } from "@/lib/utils";

export const metadata = { title: "Conversación", robots: { index: false } };
export const dynamic = "force-dynamic";

interface Contact {
  id: string;
  wa_id: string;
  phone_e164: string;
  display_name: string | null;
  lang: string;
  zone_slug: string | null;
  subscription: string;
  blocked: boolean;
  last_inbound_at: string | null;
  inbound_count: number;
  moderator_note: string | null;
}

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  message_type: string;
  body: string | null;
  media_id: string | null;
  media_mime: string | null;
  media_filename: string | null;
  delivery: string;
  error_detail: string | null;
  handled_as: string | null;
  report_id: string | null;
  occurred_at: string;
}

export default async function WhatsAppThreadPage({
  params,
}: PageProps<"/admin/whatsapp/[id]">) {
  const { id } = await params;
  const lang = await getLang();
  const moderator = await getModerator();

  if (!moderator) {
    return (
      <AdminShell title="Conversación" tabs={ADMIN_TABS} active="/admin/whatsapp">
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
  if (!supabase) notFound();

  const { data: contactRow } = await supabase
    .from("whatsapp_contacts")
    .select("id, wa_id, phone_e164, display_name, lang, zone_slug, subscription, blocked, last_inbound_at, inbound_count, moderator_note")
    .eq("id", id)
    .maybeSingle();

  if (!contactRow) notFound();
  const contact = contactRow as Contact;

  const { data: messageRows } = await supabase
    .from("whatsapp_messages")
    .select("id, direction, message_type, body, media_id, media_mime, media_filename, delivery, error_detail, handled_as, report_id, occurred_at")
    .eq("contact_id", id)
    .order("occurred_at", { ascending: true })
    .limit(300);

  const messages = (messageRows ?? []) as Message[];
  const windowOpen = isWithinServiceWindow(contact.last_inbound_at);

  // Opening the thread is what "reading" means here. Written directly rather
  // than through the server action, because `revalidatePath` may not be called
  // during render — and RLS already limits this update to moderators.
  await supabase.from("whatsapp_contacts").update({ unread_count: 0 }).eq("id", contact.id);

  return (
    <AdminShell
      title="Conversación"
      user={moderator.email}
      tabs={ADMIN_TABS}
      active="/admin/whatsapp"
    >
      <Link
        href="/admin/whatsapp"
        className="label-signage inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Bandeja
      </Link>

      <div className="space-y-2 border-b border-foreground/25 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">
            {contact.display_name ?? "Sin nombre"}
          </h2>
          <a
            href={`tel:${contact.phone_e164}`}
            className="font-mono text-sm underline underline-offset-4"
          >
            {contact.phone_e164}
          </a>
          <Badge variant="outline">{contact.lang.toUpperCase()}</Badge>
          {contact.zone_slug ? (
            <Badge variant="outline">{contact.zone_slug}</Badge>
          ) : null}
          {contact.subscription === "subscribed" ? (
            <Badge variant="outline">Alertas</Badge>
          ) : null}
          {contact.blocked ? <Badge variant="outline">Bloqueado</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Este número no se publica. Úsalo solo para verificar este reporte —
          no lo copies al texto de una actualización.
        </p>
      </div>

      <ol className="space-y-3">
        {messages.map((message) => {
          const outbound = message.direction === "outbound";
          return (
            <li
              key={message.id}
              className={cn(
                "max-w-[85%] space-y-1 rounded-sm border px-3 py-2",
                outbound
                  ? "ml-auto border-border bg-secondary"
                  : "border-foreground/20 bg-card",
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {message.body ?? "—"}
              </p>

              {message.media_id ? (
                <p className="font-mono text-xs text-muted-foreground">
                  {/* Media is referenced, never mirrored — see docs/WHATSAPP.md. */}
                  {message.media_filename ?? message.message_type}
                  {message.media_mime ? ` · ${message.media_mime}` : null} · id{" "}
                  {message.media_id}
                </p>
              ) : null}

              <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <time dateTime={message.occurred_at}>
                  {formatDateTime(message.occurred_at, lang)}
                </time>
                <span>{message.delivery}</span>
                {message.handled_as ? <span>{message.handled_as}</span> : null}
                {message.report_id ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 underline underline-offset-4"
                  >
                    <FileText className="size-3" aria-hidden />
                    en la cola
                  </Link>
                ) : null}
              </p>

              {message.error_detail ? (
                <p className="text-xs text-destructive">{message.error_detail}</p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {messages.length === 0 ? (
        <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Sin mensajes.
        </p>
      ) : null}

      <WhatsAppReplyForm
        contactId={contact.id}
        windowOpen={windowOpen}
        blocked={contact.blocked}
        lastInboundAt={contact.last_inbound_at}
      />
    </AdminShell>
  );
}
