"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";

import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * Keeps the console current without anyone reloading it.
 *
 * Deliberately dumb: a new row triggers `router.refresh()` and the server
 * re-renders with fresh data, rather than the client patching a local copy.
 * The rows carry phone numbers and coordinates, and re-rendering on the server
 * keeps RLS the only thing deciding what this session can see — a client-side
 * cache of report rows would be a second, weaker copy of that decision.
 *
 * Realtime applies RLS to authenticated subscribers, so a session outside the
 * operating organization receives no events at all.
 */
export function LiveRefresh() {
  const router = useRouter();
  const [live, setLive] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("panel-service-reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_reports" },
        () => router.refresh(),
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <span
      className="label-signage flex items-center gap-1.5 text-muted-foreground"
      title={
        live
          ? "Conectado: los reportes nuevos aparecen solos."
          : "Sin conexión en vivo. Recarga la página para ver reportes nuevos."
      }
    >
      <Radio
        className={`size-3.5 ${live ? "text-ok" : "text-muted-foreground"}`}
        aria-hidden
      />
      {live ? "En vivo" : "Sin conexión en vivo"}
    </span>
  );
}
