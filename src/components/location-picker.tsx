"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";
import { getDictionary, type Lang } from "@/lib/i18n";

/**
 * Pereira, roughly the Plaza de Bolívar. Only ever used as the starting view
 * when we have no fix — it is never submitted as a location, because a pin
 * nobody placed is invented data.
 */
const PEREIRA = { lat: 4.8133, lng: -75.6961 };

/**
 * Free vector tiles, no API key, no quota. See docs/DECISIONS.md for why this
 * rather than a keyed provider, and for the self-hosted PMTiles escape hatch if
 * it ever degrades.
 */
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  lang: Lang;
}

/**
 * Drag-the-map location picker.
 *
 * The pin is a fixed crosshair over the centre of the map and the *map* moves
 * under it, rather than a marker the user drags. On a phone that is the
 * difference between a one-thumb gesture and trying to grab a 30px target your
 * own finger is covering.
 *
 * Loaded only when the reporter asks for it — see `luz-report-form.tsx`. This
 * module pulls in MapLibre and its stylesheet, which is the heaviest thing on
 * the route by an order of magnitude, and most reports never need it.
 */
export default function LocationPicker({ lat, lng, onChange, lang }: Props) {
  const t = getDictionary(lang).luz;
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  // The map is created once. Re-centring it from the `lat`/`lng` props would
  // fight the user: those props are updated *by* this component on every pan.
  const [initial] = useState(() => ({
    lat: lat ?? PEREIRA.lat,
    lng: lng ?? PEREIRA.lng,
    zoomed: lat != null && lng != null,
  }));

  // Kept in a ref so a new callback identity from the parent never tears down
  // and rebuilds the map. Assigned in an effect, not during render — mutating
  // during render trips the React Compiler lint rules this project enforces.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    (async () => {
      try {
        // maplibre-gl v6 ships named exports only — there is no default.
        const { Map, NavigationControl } = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        // Bound to a const so the event handlers below close over a
        // non-nullable reference; `map` exists only for cleanup.
        const instance = new Map({
          container: containerRef.current,
          style: STYLE_URL,
          center: [initial.lng, initial.lat],
          // Street level when we already have a fix to refine; neighbourhood
          // level when the reporter is finding a place from scratch.
          zoom: initial.zoomed ? 17 : 13,
          attributionControl: { compact: true },
        });
        map = instance;

        instance.addControl(
          new NavigationControl({ showCompass: false }),
          "top-right",
        );

        instance.on("load", () => {
          if (!cancelled) setReady(true);
        });

        // Backstop. `load` is the signal we want, but if it never arrives the
        // overlay would hide a working map behind a grey box forever — which is
        // precisely the failure that shipped once already. `idle` fires once
        // rendering settles, so the map can never stay covered.
        instance.on("idle", () => {
          if (!cancelled) setReady(true);
        });

        // `moveend` rather than `move`: reporting every frame would rerender
        // the parent form on every pixel of a drag.
        instance.on("moveend", () => {
          if (cancelled) return;
          const c = instance.getCenter();
          onChangeRef.current(c.lat, c.lng);
        });

        // A failed style fetch (offline, OpenFreeMap down) lands here. The form
        // stays usable — the reporter falls back to comuna plus a landmark.
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
    };
  }, [initial]);

  if (failed) {
    return (
      <p className="border border-warn/40 bg-warn-muted p-3 text-xs text-warn-foreground">
        {t.mapFailed}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-64 w-full overflow-hidden rounded-sm border border-border sm:h-80">
        {/*
          `h-full` and NOT `absolute inset-0`. MapLibre puts its own
          `.maplibregl-map { position: relative }` on this element, which beats
          a same-specificity Tailwind `absolute` depending on stylesheet order.
          The element then has no height source at all and collapses to 0px —
          the map initialises, the canvas exists, and nothing is visible. This
          passed types, passed the build, and was only findable by clicking.
        */}
        <div
          ref={containerRef}
          className="h-full w-full"
          role="application"
          aria-label={t.mapAria}
        />

        {/*
          The crosshair. `pointer-events-none` so it never intercepts the drag
          it is describing.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="relative">
            <div className="size-5 rounded-full border-2 border-background bg-down shadow-md" />
            <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-down/40" />
          </div>
        </div>

        {!ready ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
            <p className="label-signage text-muted-foreground">{t.mapLoading}</p>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">{t.mapHint}</p>
    </div>
  );
}
