import Link from "next/link";
import { Download, Inbox, ShieldAlert, TriangleAlert } from "lucide-react";

import { LiveRefresh } from "@/components/panel/live-refresh";
import { PanelReportRow } from "@/components/panel/report-row";
import { ReportMap } from "@/components/panel/report-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getOperatorReports, PANEL_WINDOW_HOURS } from "@/lib/panel-data";
import { getServerSupabase } from "@/lib/supabase/server";
import { signOut } from "@/lib/moderation";

export const metadata = {
  title: "Panel del operador",
  robots: { index: false },
};

/* Live operational data: never cached. */
export const dynamic = "force-dynamic";

/*
 * One console per service, selected by `?servicio=`. RLS is the authority on
 * what actually comes back (`can_see_service_reports`): an electricity account
 * opening the water console sees the same honest empty state as one with no
 * organization at all. The switcher is navigation, not authorization.
 */
const PANEL_SERVICES = {
  luz: {
    service: "electricity" as const,
    title: "Panel de energía",
    sub: "Reportes de residentes sobre el servicio de energía",
    tiles: { outage: "sin luz", degraded: "intermitente", operational: "con luz" },
    hazardsHeading: "Cables o postes caídos",
  },
  agua: {
    service: "water" as const,
    title: "Panel de acueducto",
    sub: "Reportes de residentes sobre el servicio de agua",
    tiles: {
      outage: "sin agua",
      degraded: "presión baja",
      operational: "con agua",
    },
    hazardsHeading: "Fugas o daños reportados",
  },
};
type PanelKey = keyof typeof PANEL_SERVICES;

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { servicio } = await searchParams;
  const key: PanelKey = servicio === "agua" ? "agua" : "luz";
  const panel = PANEL_SERVICES[key];

  const supabase = await getServerSupabase();

  if (!supabase) {
    return (
      <Shell panel={key}>
        <Alert>
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>Supabase no está configurado</AlertTitle>
          <AlertDescription>
            Sin base de datos no hay reportes que mostrar.
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
      <Shell panel={key}>
        <Alert>
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>Inicia sesión</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Este panel es para el personal de la empresa operadora del
              servicio.
            </p>
            <Button size="sm" render={<Link href="/admin/login" />}>
              Ir al inicio de sesión
            </Button>
          </AlertDescription>
        </Alert>
      </Shell>
    );
  }

  const { reports, error } = await getOperatorReports(panel.service);

  if (error) {
    return (
      <Shell user={user.email} panel={key}>
        <Alert className="border-down/40 bg-down-muted text-down-foreground">
          <ShieldAlert className="size-4" aria-hidden />
          <AlertTitle>No pudimos cargar los reportes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Shell>
    );
  }

  // Hazards first, and separately: a downed cable is a different job from a
  // dark house, and burying it in a reverse-chronological list loses it.
  const hazards = reports.filter((r) => r.hazard && r.acknowledged_at == null);
  const pending = reports.filter((r) => !r.hazard && r.acknowledged_at == null);
  const done = reports.filter((r) => r.acknowledged_at != null);

  const counts = {
    outage: reports.filter((r) => r.status === "outage").length,
    degraded: reports.filter((r) => r.status === "degraded").length,
    operational: reports.filter((r) => r.status === "operational").length,
  };

  return (
    <Shell user={user.email} panel={key}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/25 pb-2">
          <h2 className="label-signage text-muted-foreground">
            Últimas {PANEL_WINDOW_HOURS} horas
          </h2>
          <div className="flex items-center gap-4">
            <LiveRefresh />
            <Button
              size="sm"
              variant="outline"
              className="label-signage gap-1.5 rounded-sm"
              render={<a href={`/panel/export?servicio=${key}`} download />}
            >
              <Download className="size-3.5" aria-hidden />
              Descargar CSV
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2">
          <Tile
            value={counts.outage}
            label={panel.tiles.outage}
            className="border-down/40 bg-down-muted text-down-foreground"
          />
          <Tile
            value={counts.degraded}
            label={panel.tiles.degraded}
            className="border-warn/40 bg-warn-muted text-warn-foreground"
          />
          <Tile
            value={counts.operational}
            label={panel.tiles.operational}
            className="border-ok/40 bg-ok-muted text-ok-foreground"
          />
        </dl>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Estos son reportes de residentes, no mediciones de la red. Cada punto
          es lo que una persona dijo desde su casa, con la hora en que lo dijo.
        </p>

        <ReportMap reports={reports} />
      </section>

      {reports.length === 0 ? (
        <p className="flex flex-col items-center gap-2 border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          <Inbox className="size-6" aria-hidden />
          No hay reportes en las últimas {PANEL_WINDOW_HOURS} horas.
          <span className="text-xs">
            Si esperabas ver reportes, confirma que tu cuenta está asociada a la
            organización que opera este servicio.
          </span>
        </p>
      ) : null}

      {hazards.length > 0 ? (
        <section className="space-y-3">
          <h2 className="label-signage flex items-center gap-2 border-b border-down/40 pb-2 text-down-foreground">
            <TriangleAlert className="size-4" aria-hidden />
            {panel.hazardsHeading} ({hazards.length})
          </h2>
          <ul className="space-y-3">
            {hazards.map((r) => (
              <PanelReportRow key={r.id} report={r} />
            ))}
          </ul>
        </section>
      ) : null}

      {pending.length > 0 ? (
        <section className="space-y-3">
          <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
            Pendientes ({pending.length})
          </h2>
          <ul className="space-y-3">
            {pending.map((r) => (
              <PanelReportRow key={r.id} report={r} />
            ))}
          </ul>
        </section>
      ) : null}

      {done.length > 0 ? (
        <section className="space-y-3">
          <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
            Atendidos ({done.length})
          </h2>
          <ul className="space-y-3">
            {done.map((r) => (
              <PanelReportRow key={r.id} report={r} />
            ))}
          </ul>
        </section>
      ) : null}
    </Shell>
  );
}

function Tile({
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

function Shell({
  children,
  user,
  panel = "luz",
}: {
  children: React.ReactNode;
  user?: string | null;
  panel?: PanelKey;
}) {
  const copy = PANEL_SERVICES[panel];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/25 pt-3">
        <div>
          <h1 className="display-condensed text-3xl font-extrabold uppercase">
            {copy.title}
          </h1>
          <p className="text-sm text-muted-foreground">{copy.sub}</p>
          {user ? (
            <p className="font-mono text-xs text-muted-foreground">{user}</p>
          ) : null}
          {/* Console switcher — navigation only; RLS decides what each
              account can actually read. */}
          <nav className="mt-2 flex gap-3" aria-label="Servicio">
            {(Object.keys(PANEL_SERVICES) as PanelKey[]).map((k) => (
              <Link
                key={k}
                href={k === "luz" ? "/panel" : `/panel?servicio=${k}`}
                aria-current={k === panel ? "page" : undefined}
                className={
                  k === panel
                    ? "label-signage border-b-2 border-foreground pb-0.5 text-foreground"
                    : "label-signage border-b-2 border-transparent pb-0.5 text-muted-foreground hover:text-foreground"
                }
              >
                {PANEL_SERVICES[k].title.replace("Panel de ", "")}
              </Link>
            ))}
          </nav>
        </div>
        {user ? (
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="label-signage rounded-sm"
            >
              Cerrar sesión
            </Button>
          </form>
        ) : null}
      </header>

      {/*
        Said on the operator's own screen, not just on the public page: these
        are residents' words, and treating them as network telemetry is the
        mistake this console could most easily cause.
      */}
      <p className="border-l-2 border-foreground/25 pl-3 text-xs leading-relaxed text-muted-foreground">
        Los datos de contacto de esta página no son públicos. Úsalos para
        confirmar y atender el reporte, y no los publiques ni los reenvíes fuera
        de la operación.
      </p>

      {children}
    </div>
  );
}
