import { cn } from "@/lib/utils";

const WIDTH = 1200;
const HEIGHT = 24;
const MID = HEIGHT / 2;

/**
 * The site's one piece of ornament: a seismograph trace, used as the masthead's
 * bottom edge in place of a plain rule.
 *
 * Deliberately computed from fixed maths rather than `Math.random()` so server
 * and client render byte-identical markup — a random trace would hydrate as a
 * mismatch. It is decorative and carries no data, so it is `aria-hidden` and
 * describes nothing; inventing a "live" waveform on a site whose editorial rule
 * is *never fabricate a reading* would be exactly the wrong ornament.
 */
function buildTrace() {
  const points: string[] = [];

  for (let x = 0; x <= WIDTH; x += 3) {
    const t = x / WIDTH;

    // Three arrival bursts under Gaussian envelopes — a main shock and two
    // aftershocks — so the line has a narrative rather than uniform noise.
    const envelope =
      Math.exp(-(((t - 0.17) / 0.032) ** 2)) +
      Math.exp(-(((t - 0.53) / 0.019) ** 2)) * 0.62 +
      Math.exp(-(((t - 0.8) / 0.042) ** 2)) * 0.84;

    const carrier =
      Math.sin(x * 0.9) * 0.6 + Math.sin(x * 2.3) * 0.28 + Math.sin(x * 0.37) * 0.12;

    // Ambient tremor: the line is never perfectly flat.
    const ambient = Math.sin(x * 0.21) * 0.05 + Math.sin(x * 0.061) * 0.03;

    const y = MID - (envelope * carrier + ambient) * (MID - 1);
    points.push(`${x} ${y.toFixed(2)}`);
  }

  return `M ${points.join(" L ")}`;
}

const TRACE = buildTrace();

export function Seismograph({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className={cn("h-2 w-full text-down/50", className)}
    >
      <path
        d={TRACE}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="animate-trace"
        /* Comfortably longer than the real path so the dash fully clears it. */
        style={{ "--trace-length": "4200" } as React.CSSProperties}
      />
    </svg>
  );
}
