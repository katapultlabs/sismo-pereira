/*
 * Renders the Sismo Pereira epicentre sigil to PNG/ICO.
 *
 * ImageMagick here has no rsvg delegate and its internal SVG renderer drops
 * stroked circles entirely, so the raster fallbacks are drawn procedurally
 * instead. Geometry is kept in the same 32-unit space as `src/app/icon.svg`
 * so the two stay identical by construction.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

// ── Palette ────────────────────────────────────────────────────────────────
const WARM = { plate: [0x1a, 0x12, 0x09], bone: [0xf6, 0xf2, 0xea], epi: [0xef, 0x3b, 0x32] };
const COLD = { plate: [0x0d, 0x11, 0x17], bone: [0xf1, 0xf0, 0xed], epi: [0xf8, 0x51, 0x49] };

// ── Geometry, in the icon.svg 32-unit space ────────────────────────────────
const C = 16;
const PLATE_R = 3;      // --radius, tight on purpose

/*
 * Two cuts of the same mark. The full one matches `icon.svg`. At 16px a
 * 12-tick ring has ~1.3px of ink per tick and degrades to grey noise, and
 * the 6-unit square rounds off into a blob — so the small cut drops the
 * ticks, thickens the ripple to a clean 2px band, and squares up the
 * epicentre on the pixel grid. Same three elements, fewer of them.
 */
const FULL = {
  outer: { r: 12.2, w: 2.2, a: 0.42, dashes: 12 },
  inner: { r: 7.4, w: 2.6, a: 0.88 },
  epi: 3,
};
const SMALL = {
  outer: null,
  inner: { r: 10.5, w: 3.4, a: 1 },
  epi: 4,
};
const geomFor = (size) => (size <= 16 ? SMALL : FULL);

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Coverage of a rounded rect at (x,y), 0..1 via distance to the shape. */
function plateCoverage(x, y, rounded) {
  if (!rounded) return x >= 0 && x <= 32 && y >= 0 && y <= 32 ? 1 : 0;
  const dx = Math.abs(x - C) - (16 - PLATE_R);
  const dy = Math.abs(y - C) - (16 - PLATE_R);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const d = outside + Math.min(Math.max(dx, dy), 0) - PLATE_R;
  return d <= 0 ? 1 : 0;
}

function ringAlpha(x, y, r, w, dashes) {
  const d = Math.abs(Math.hypot(x - C, y - C) - r);
  if (d > w / 2) return 0;
  if (!dashes) return 1;
  // Even angular ticks — the seismograph chart-paper ruling, wrapped.
  let a = Math.atan2(y - C, x - C) / (2 * Math.PI);
  if (a < 0) a += 1;
  const t = (a * dashes) % 1;
  return t < 0.5 ? 1 : 0;
}

function over(dst, src, a) {
  for (let i = 0; i < 3; i++) dst[i] = src[i] * a + dst[i] * (1 - a);
}

function render(size, pal, rounded, ss = 8) {
  const g = geomFor(size);
  const px = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      const acc = [0, 0, 0];
      let accA = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = ((pxi + (sx + 0.5) / ss) / size) * 32;
          const y = ((py + (sy + 0.5) / ss) / size) * 32;
          const inPlate = plateCoverage(x, y, rounded);
          if (!inPlate) continue;
          const c = [...pal.plate];
          if (g.outer && ringAlpha(x, y, g.outer.r, g.outer.w, g.outer.dashes)) {
            over(c, pal.bone, g.outer.a);
          }
          if (ringAlpha(x, y, g.inner.r, g.inner.w, 0)) over(c, pal.bone, g.inner.a);
          if (Math.abs(x - C) <= g.epi && Math.abs(y - C) <= g.epi) {
            c[0] = pal.epi[0]; c[1] = pal.epi[1]; c[2] = pal.epi[2];
          }
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
          accA += 1;
        }
      }
      const n = ss * ss;
      const o = (py * size + pxi) * 4;
      if (accA === 0) { px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0; continue; }
      px[o] = Math.round(acc[0] / accA);
      px[o + 1] = Math.round(acc[1] / accA);
      px[o + 2] = Math.round(acc[2] / accA);
      px[o + 3] = Math.round(clamp01(accA / n) * 255);
    }
  }
  return px;
}

// ── PNG ────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** ICO wrapping PNG payloads — supported by every browser that matters. */
function ico(entries) {
  const dir = Buffer.alloc(6 + entries.length * 16);
  dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(entries.length, 4);
  let offset = dir.length;
  entries.forEach((e, i) => {
    const o = 6 + i * 16;
    dir[o] = e.size >= 256 ? 0 : e.size;
    dir[o + 1] = e.size >= 256 ? 0 : e.size;
    dir[o + 2] = 0; dir[o + 3] = 0;
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.data.length;
  });
  return Buffer.concat([dir, ...entries.map((e) => e.data)]);
}

const out = process.argv[2] ?? "src/app";
const sizes = [16, 32, 48];
writeFileSync(
  `${out}/favicon.ico`,
  ico(sizes.map((s) => ({ size: s, data: png(s, render(s, WARM, true)) }))),
);
writeFileSync(`${out}/apple-icon.png`, png(180, render(180, WARM, false)));

/*
 * Optional second argument: a directory for preview renders. The 16px and
 * 32px ones are nearest-neighbour blow-ups, because the only way to judge a
 * favicon is to look at the pixels it actually gets.
 */
const pv = process.argv[3];
if (pv) {
  writeFileSync(`${pv}/pv-256-warm.png`, png(256, render(256, WARM, true)));
  writeFileSync(`${pv}/pv-256-cold.png`, png(256, render(256, COLD, true)));
  for (const s of [16, 32]) {
    // Nearest-neighbour blow-up so the actual tab-size pixels are visible.
    const src = render(s, WARM, true), f = 8, big = Buffer.alloc(s * f * s * f * 4);
    for (let y = 0; y < s * f; y++)
      for (let x = 0; x < s * f; x++) {
        const so = (Math.floor(y / f) * s + Math.floor(x / f)) * 4;
        src.copy(big, (y * s * f + x) * 4, so, so + 4);
      }
    writeFileSync(`${pv}/pv-${s}-zoom.png`, png(s * f, big));
  }
}
console.log("wrote favicon.ico, apple-icon.png");
