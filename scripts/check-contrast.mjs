#!/usr/bin/env node
/**
 * Verifies the WCAG contrast of every foreground/surface pairing declared in
 * `src/app/globals.css`, for both themes.
 *
 * This exists because the status palette has silently regressed before (commit
 * 9e9d22c, "fix: contrast failure in status/severity tints"). The token roles
 * — `--x` / `--x-contrast` / `--x-muted` / `--x-foreground` — are easy to pair
 * up wrongly, and the failure is invisible to anyone not looking for it. On a
 * site where a misread status is a travel decision, that is worth a build gate.
 *
 * Run: pnpm check:contrast
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = resolve(HERE, "../src/app/globals.css");

/** WCAG AA for normal-size text. Large text would be 3:1; we hold everything
 *  to the stricter bar because status labels are set small. */
const MIN_RATIO = 4.5;

// ── colour conversion ──────────────────────────────────────────────────────

/** `oklch(L C H)` or `oklch(L C H / A%)` → {l, c, h, alpha}. */
function parseOklch(value) {
  const m = value
    .trim()
    .match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/);
  if (!m) return null;
  const l = m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const alpha =
    m[4] === undefined ? 1 : m[5] === "%" ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { l, c: parseFloat(m[2]), h: parseFloat(m[3]), alpha };
}

/** Oklch → linear-light sRGB (Björn Ottosson's matrices), clamped to gamut. */
function oklchToLinearSrgb({ l: L, c: C, h: H }) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ].map((v) => Math.min(1, Math.max(0, v)));
}

/** Composite a translucent colour over an opaque backdrop, in linear light. */
function composite(fg, bg) {
  if (fg.alpha >= 1) return oklchToLinearSrgb(fg);
  const f = oklchToLinearSrgb(fg);
  const b = oklchToLinearSrgb(bg);
  return f.map((v, i) => v * fg.alpha + b[i] * (1 - fg.alpha));
}

/** WCAG 2.x relative luminance from linear-light sRGB. */
const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function contrast(fgLinear, bgLinear) {
  const a = luminance(fgLinear);
  const b = luminance(bgLinear);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

// ── token extraction ───────────────────────────────────────────────────────

/**
 * Pulls custom-property declarations out of a specific top-level rule. Scans
 * brace depth so the `@theme inline` block and nested at-rules don't bleed in.
 */
function extractTokens(css, selector) {
  const start = css.indexOf(selector + " {");
  if (start === -1) throw new Error(`no \`${selector}\` block in globals.css`);

  let depth = 0;
  let end = start;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const body = css.slice(start, end);
  const tokens = {};
  for (const [, name, value] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    const parsed = parseOklch(value);
    if (parsed) tokens[name] = parsed;
  }
  return tokens;
}

// ── the pairings that must hold ────────────────────────────────────────────

/** [foreground token, surface token, human description] */
const PAIRS = [
  ["foreground", "background", "body text on the page"],
  ["muted-foreground", "background", "secondary text on the page"],
  ["muted-foreground", "card", "secondary text on a card"],
  ["muted-foreground", "muted", "secondary text on a muted surface"],
  ["card-foreground", "card", "text on a card"],
  ["popover-foreground", "popover", "text in a popover"],
  ["primary-foreground", "primary", "text on a primary button"],
  ["secondary-foreground", "secondary", "text on a secondary surface"],
  ["accent-foreground", "accent", "text on an accent surface"],
  ["sidebar-foreground", "sidebar", "text in the sidebar"],
  ["destructive", "card", "destructive text on a card"],
  ["destructive", "background", "destructive text on the page"],
];

// Status tokens carry the site's actual meaning; check both of their surfaces.
for (const status of ["ok", "warn", "down", "fixing"]) {
  PAIRS.push([
    `${status}-foreground`,
    `${status}-muted`,
    `${status}: label on its tinted surface`,
  ]);
  PAIRS.push([
    `${status}-contrast`,
    status,
    `${status}: text on its solid fill`,
  ]);
  // Tinted status surfaces also host plain body copy (alerts, cards).
  PAIRS.push([
    "foreground",
    `${status}-muted`,
    `${status}: body text on its tinted surface`,
  ]);
}

// ── run ────────────────────────────────────────────────────────────────────

const css = readFileSync(CSS, "utf8");
const themes = {
  light: extractTokens(css, ":root"),
  dark: extractTokens(css, ".dark"),
};

let failures = 0;
let checked = 0;

for (const [themeName, tokens] of Object.entries(themes)) {
  const page = tokens.background;
  const lines = [];

  for (const [fgName, bgName, description] of PAIRS) {
    const fg = tokens[fgName];
    const bg = tokens[bgName];
    if (!fg || !bg) {
      console.error(`  ✗ ${themeName}: missing token --${!fg ? fgName : bgName}`);
      failures++;
      continue;
    }

    const ratio = contrast(composite(fg, bg), composite(bg, page));
    const pass = ratio >= MIN_RATIO;
    checked++;
    if (!pass) failures++;

    lines.push(
      `  ${pass ? "✓" : "✗"} ${ratio.toFixed(2).padStart(5)}:1  ${description}` +
        `  (--${fgName} on --${bgName})`,
    );
  }

  console.log(`\n${themeName}`);
  console.log(lines.join("\n"));
}

console.log(
  `\n${checked - failures}/${checked} pairings meet WCAG AA (${MIN_RATIO}:1).`,
);

if (failures > 0) {
  console.error(
    `\n${failures} contrast failure(s). Adjust the tokens in src/app/globals.css.`,
  );
  process.exit(1);
}
