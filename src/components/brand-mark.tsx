/**
 * The AquíAyuda pin — the brand mark from the AyudasAquí design brief: a map
 * pin carrying the "AA" monogram.
 *
 * Two lockups, one per theme, both straight from the brief's sheet: on light
 * chrome the pin is ink with the monogram knocked out; on dark chrome the pin
 * is the brand volt with ink letters. A volt pin on white would need an edge
 * to hold its silhouette, and an ink pin on black would vanish — each theme
 * gets the variant that survives its ground.
 *
 * Geometry lives in the same 32-unit space as `src/app/icon.svg` and
 * `scripts/render-icons.mjs`. The three are kept identical by hand — change
 * one, change the others (the `seed.sql` / `fallback-data.ts` rule).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Pin silhouette: head + tail, drawn as a union so the raster renderer
          can test the same two shapes. */}
      <g className="fill-foreground dark:fill-brand">
        <circle cx="16" cy="12.5" r="10" />
        <path d="M9.9 18.4 H22.1 L16 29.5 Z" />
      </g>
      {/* The monogram — two stroked A's, apexes joined, bars separate. */}
      <g
        className="stroke-background dark:stroke-brand-contrast"
        fill="none"
        strokeWidth="2.1"
      >
        <path d="M9.8 16.6 L12.4 8.2 L15 16.6" />
        <path d="M17 16.6 L19.6 8.2 L22.2 16.6" />
      </g>
      <g
        className="stroke-background dark:stroke-brand-contrast"
        fill="none"
        strokeWidth="1.7"
      >
        <path d="M10.9 14 H13.9" />
        <path d="M18.1 14 H21.1" />
      </g>
    </svg>
  );
}
