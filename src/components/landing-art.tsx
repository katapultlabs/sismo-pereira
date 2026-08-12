import { cn } from "@/lib/utils";

/*
 * The landing page's artwork: topographic contour fields, computed from fixed
 * maths rather than `Math.random()` so server and client render byte-identical
 * markup (the same constraint as `Seismograph`).
 *
 * These are schematic terrain patterns, not maps. The one component here that
 * carries information — `EpicentreDiagram` — renders only facts the site
 * already publishes (the epicentre is in Chocó, ~55 km west of Pereira, ~107 km
 * deep) and says on its face that it is not to scale. Nothing else in this
 * file describes anything: it is `aria-hidden` ornament, kept because inventing
 * documentary photography of a real disaster is exactly what EDITORIAL.md
 * rules out.
 */

/** One closed contour ring: a circle whose radius wobbles with the angle. */
function ringPath(cx: number, cy: number, radius: number, seed: number): string {
  const points: string[] = [];
  const STEPS = 96;

  for (let i = 0; i <= STEPS; i++) {
    const a = (i / STEPS) * Math.PI * 2;
    const wobble =
      1 +
      0.09 * Math.sin(3 * a + seed * 1.7) +
      0.05 * Math.sin(7 * a + seed * 0.9) +
      0.03 * Math.sin(11 * a + seed * 2.3);
    const r = radius * wobble;
    points.push(
      `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`,
    );
  }

  return `M ${points.join(" L ")} Z`;
}

function contourField(cx: number, cy: number, count: number, gap: number) {
  return Array.from({ length: count }, (_, k) =>
    ringPath(cx, cy, gap * (k + 1), k),
  );
}

/* Two overlapping summits — a real topographic sheet has more than one peak,
   and two systems fill the rectangle corner to corner where a single
   concentric set thins out at the edges. */
const HERO_RINGS = [
  ...contourField(360, 250, 20, 58),
  ...contourField(1020, 650, 18, 62),
];

/**
 * The seismic field: an isoseismal (equal-shaking) contour map of the event.
 * One epicentre west of centre, rings tight at the core and loosening
 * outward the way shaking intensity actually falls off, plus a ragged
 * coastline to the west (the Pacific, past Chocó). Restrained on purpose —
 * mostly the ember accent with the innermost rings warming toward the alarm
 * red, all thin and low-contrast so the headline reads clean over it.
 *
 * Meaningful, not documentary: it draws only what the site already states —
 * an epicentre in Chocó, to the west — and carries no scale or legend, so it
 * stays ornament rather than a map that could be misread.
 */
const EPI_X = 470;
const EPI_Y = 440;

/** Radii that start tight and expand — dense core, sparse skirt. */
const SEISMIC_RINGS = Array.from({ length: 26 }, (_, k) =>
  ringPath(EPI_X, EPI_Y, 11 * Math.pow(k + 1, 1.32), k),
);

/** A wobbling near-vertical line down the left third — the coastline. */
const COASTLINE = (() => {
  const pts: string[] = [];
  for (let y = -30; y <= 870; y += 11) {
    const x =
      205 +
      42 * Math.sin(y * 0.016) +
      20 * Math.sin(y * 0.061 + 1.3) +
      10 * Math.sin(y * 0.14 + 0.7);
    pts.push(`${x.toFixed(1)} ${y}`);
  }
  return `M ${pts.join(" L ")}`;
})();

export function SeismicField({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1240 840"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
      className={cn("h-full w-full", className)}
    >
      {/* Coastline to the west. */}
      <path
        d={COASTLINE}
        fill="none"
        className="text-muted-foreground"
        stroke="currentColor"
        strokeWidth={1}
        strokeOpacity={0.45}
        vectorEffect="non-scaling-stroke"
      />

      {/* Isoseismal rings, warm core to cool skirt, fading outward. */}
      {SEISMIC_RINGS.map((d, i) => {
        const t = i / (SEISMIC_RINGS.length - 1);
        const stroke = t < 0.16 ? "var(--down)" : "var(--ember)";
        // Peak legibility of the core, gentle fade to the edges.
        const opacity = Math.max(0.12, 0.7 - t * 0.62);
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={stroke}
            strokeOpacity={opacity}
            strokeWidth={i % 5 === 0 ? 1 : 0.6}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

/**
 * Full-bleed contour backdrop for the hero. Strokes inherit `currentColor`,
 * so the parent sets the tone (e.g. `text-foreground/60` at low opacity).
 */
export function TerrainContours({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1240 840"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
      className={cn("h-full w-full", className)}
    >
      {HERO_RINGS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={i % 4 === 0 ? 1.1 : 0.6}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

const DIAGRAM_RINGS = contourField(150, 208, 6, 26);

/**
 * Schematic locator: the epicentre in Chocó relative to Pereira. Deliberately
 * a diagram, not a map — the caption the page renders under it says "not to
 * scale", and the only quantities on it are the ones the site already
 * publishes on the hero readout.
 */
export function EpicentreDiagram({
  epicentreLabel,
  cityLabel,
  distanceLabel,
  title,
  className,
}: {
  epicentreLabel: string;
  cityLabel: string;
  distanceLabel: string;
  /** Accessible description of the whole figure. */
  title: string;
  className?: string;
}) {
  return (
    <svg
      /* Fitted to the drawing's true extents — clipping the outer ring at
         the card edge read as a bug, not as a crop. */
      viewBox="-40 30 600 360"
      role="img"
      aria-label={title}
      className={cn("h-auto w-full", className)}
    >
      {/* Terrain around the epicentre. */}
      <g className="text-foreground/60" opacity={0.45}>
        {DIAGRAM_RINGS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth={i % 3 === 0 ? 1 : 0.55}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {/* Distance rule between the two marks. */}
      <g className="text-muted-foreground">
        <line
          x1={162}
          y1={200}
          x2={428}
          y2={124}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 5"
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={295}
          y={148}
          textAnchor="middle"
          fill="currentColor"
          fontSize={12}
          letterSpacing="0.1em"
          className="font-mono"
        >
          {distanceLabel}
        </text>
      </g>

      {/* Epicentre mark — the same square the masthead uses, in ember. */}
      <g className="text-ember">
        <rect x={144} y={190} width={11} height={11} fill="currentColor" />
        <rect
          x={138.5}
          y={184.5}
          width={22}
          height={22}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.45}
        />
        <text
          x={150}
          y={232}
          textAnchor="middle"
          fill="currentColor"
          fontSize={11}
          fontWeight={600}
          letterSpacing="0.14em"
          className="font-mono uppercase"
        >
          {epicentreLabel}
        </text>
      </g>

      {/* Pereira. */}
      <g className="text-foreground">
        <rect x={430} y={118} width={9} height={9} fill="currentColor" />
        <text
          x={448}
          y={128}
          fill="currentColor"
          fontSize={11}
          fontWeight={600}
          letterSpacing="0.14em"
          className="font-mono uppercase"
        >
          {cityLabel}
        </text>
      </g>
    </svg>
  );
}
