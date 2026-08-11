"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";
import type { ServiceReport } from "@/lib/types";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const PEREIRA: [number, number] = [-75.6961, 4.8133];

/**
 * Status colours live in `globals.css` as oklch tokens, and a WebGL canvas
 * cannot read a CSS class. Rather than hardcode hexes that would silently drift
 * from the tokens, resolve each one through a canvas context — assigning any
 * CSS colour to `fillStyle` and reading it back returns a normalized hex.
 *
 * The fallbacks are only reached if the token is missing or the browser cannot
 * parse oklch; they are approximations of the same three colours, and if you
 * are changing the tokens you should change these too.
 */
function resolveToken(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return fallback;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = "#000";
    ctx.fillStyle = raw;
    const resolved = ctx.fillStyle;
    return typeof resolved === "string" && resolved !== "#000000"
      ? resolved
      : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Every household report for this operator's service, plotted.
 *
 * Rendered as a GeoJSON circle layer rather than DOM markers: a comuna-wide
 * outage is hundreds of points, and hundreds of absolutely-positioned divs
 * turns a pan into a slideshow on the hardware a control room actually has.
 */
export function ReportMap({ reports }: { reports: ServiceReport[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  // Init once.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    (async () => {
      try {
        const { Map, NavigationControl } = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        const instance = new Map({
          container: containerRef.current,
          style: STYLE_URL,
          center: PEREIRA,
          zoom: 11,
          attributionControl: { compact: true },
        });
        map = instance;
        mapRef.current = instance;

        instance.addControl(
          new NavigationControl({ showCompass: false }),
          "top-right",
        );

        instance.on("load", () => {
          instance.addSource("reports", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          instance.addLayer({
            id: "reports-circles",
            type: "circle",
            source: "reports",
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                4,
                16,
                9,
              ],
              "circle-color": [
                "match",
                ["get", "status"],
                "outage",
                resolveToken("--down", "#c9372c"),
                "degraded",
                resolveToken("--warn", "#d68a1e"),
                "operational",
                resolveToken("--ok", "#2c7a4b"),
                "#888888",
              ],
              // A hazard gets a heavy ring rather than a fourth fill colour:
              // it is a different axis from "do you have power", and encoding
              // it as another hue would read as a fourth power state.
              "circle-stroke-width": ["case", ["get", "hazard"], 3, 1],
              "circle-stroke-color": [
                "case",
                ["get", "hazard"],
                resolveToken("--down", "#c9372c"),
                "#ffffff",
              ],
              "circle-opacity": ["case", ["get", "acknowledged"], 0.35, 0.85],
            },
          });

          if (!cancelled) setReady(true);
        });

        instance.on("error", () => {
          if (!cancelled) setFailed(true);
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Feed data in separately so a realtime update repaints without rebuilding
  // the map — and so panning is not reset every time a report arrives.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const features = reports
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [r.lng as number, r.lat as number],
        },
        properties: {
          status: r.status,
          hazard: r.hazard,
          acknowledged: r.acknowledged_at != null,
        },
      }));

    const source = map.getSource("reports");
    if (source && "setData" in source) {
      (source as { setData: (d: unknown) => void }).setData({
        type: "FeatureCollection",
        features,
      });
    }
  }, [reports, ready]);

  if (failed) {
    return (
      <p className="border border-warn/40 bg-warn-muted p-3 text-xs text-warn-foreground">
        No se pudo cargar el mapa. La tabla de abajo tiene los mismos reportes.
      </p>
    );
  }

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-sm border border-border sm:h-[28rem]">
      {/* `h-full`, not `absolute inset-0` — see the note in location-picker.tsx:
          MapLibre's own `position: relative` collapses an absolutely-positioned
          container to zero height. */}
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Mapa de reportes de energía"
      />
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
          <p className="label-signage text-muted-foreground">Cargando el mapa…</p>
        </div>
      ) : null}
    </div>
  );
}
