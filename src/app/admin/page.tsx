import Link from "next/link";
import { Inbox, ShieldAlert } from "lucide-react";

import { ModerationRow } from "@/components/moderation-row";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServerSupabase } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang";
import { signOut } from "@/lib/moderation";

export const metadata = { title: "Moderación", robots: { index: false } };

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

export default async function AdminPage() {
  const lang = await getLang();
  const supabase = await getServerSupabase();

  if (!supabase) {
    return (
      <Shell>
        <Alert>
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>Supabase no está configurado</AlertTitle>
          <AlertDescription>
            Configura <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para
            habilitar la moderación.
          </AlertDescription>
        </Alert>
      </Shell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <Alert>
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>Inicia sesión</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Esta página es solo para moderadores.</p>
            <Button size="sm" render={<Link href="/admin/login" />}>
              Ir al inicio de sesión
            </Button>
          </AlertDescription>
        </Alert>
      </Shell>
    );
  }

  // RLS decides this, not us: a non-moderator session simply sees nothing.
  const { data: reports, error } = await supabase
    .from("reports")
    // Kept on one line: supabase-js infers the row type from this string
    // literal, and concatenation widens it to `string` and breaks inference.
    .select("id, category, service, zone_slug, address_hint, description, contact_name, contact_phone, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <Shell user={user.email}>
        <Alert className="border-down/40 bg-down-muted text-down-foreground">
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>No tienes permisos de moderación</AlertTitle>
          <AlertDescription>
            Tu cuenta existe pero no tiene el rol <code>moderator</code> o{" "}
            <code>admin</code>.
          </AlertDescription>
        </Alert>
      </Shell>
    );
  }

  const pending = (reports ?? []) as PendingReport[];

  return (
    <Shell user={user.email}>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Cola de revisión</h2>
        <Badge variant="secondary">{pending.length}</Badge>
      </div>

      {pending.length === 0 ? (
        <p className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          <Inbox className="size-6" aria-hidden />
          No hay reportes pendientes.
        </p>
      ) : (
        <div className="space-y-3">
          {pending.map((report) => (
            <ModerationRow key={report.id} report={report} lang={lang} />
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: string | null;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Moderación</h1>
          {user ? (
            <p className="text-sm text-muted-foreground">{user}</p>
          ) : null}
        </div>
        {user ? (
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        ) : null}
      </header>
      {children}
    </div>
  );
}
