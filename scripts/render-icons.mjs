/*
 * Renders the AquíAyuda pin mark to PNG/ICO.
 *
 * ImageMagick here has no rsvg delegate and its internal SVG renderer drops
 * stroked paths entirely, so the raster fallbacks are drawn procedurally
 * instead. Geometry is kept in the same 32-unit space as `src/app/icon.svg`
 * so the two stay identical by construction. (One knowing difference: the
 * monogram's strokes are rasterised with round caps where the SVG uses butt
 * caps — invisible at any size the favicon is served at.)
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

// ── Palette — matches the vars in icon.svg ─────────────────────────────────
// The plate is ink in both themes (see icon.svg for why), so raster outputs
// need only the one palette: page ink, and the --brand volt.
const PAL = { plate: [0x0f, 0x0f, 0x0f], pin: [0xfe, 0xf2, 0x04] };

// ── Geometry, in the icon.svg 32-unit space ────────────────────────────────
const C = 16;
const PLATE_R = 6; // icon-scale echo of --radius

/*
 * Two cuts of the same mark. The full one matches `icon.svg`: pin head + tail
 * with the "AA" monogram knocked back to the plate. At 16px the monogram's
 * ~1.8-unit strokes get under a pixel of ink each and turn to noise, so the
 * small cut drops the letters and grows the pin to fill the plate.
 */
const FULL = {
  head: { cx: 16, cy: 13, r: 8.2 },
  tail: [
    [11, 17.9],
    [21, 17.9],
    [16, 27],
  ],
  // Two A's: legs are one stroked path apex-to-apex, the bar a second.
  letters: {
    cxs: [13.1, 18.9],
    halfW: 2.1,
    top: 9.6,
    bottom: 16.4,
    legW: 1.8,
    barY: 14.2,
    barHalf: 1.25,
    barW: 1.5,
  },
};
const SMALL = {
  head: { cx: 16, cy: 12.6, r: 9.4 },
  tail: [
    [10.8, 18.4],
    [21.2, 18.4],
    [16, 29.2],
  ],
  letters: null,
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

function inTriangle(x, y, [[ax, ay], [bx, by], [cx, cy]]) {
  const s1 = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
  const s2 = (cx - bx) * (y - by) - (cy - by) * (x - bx);
  const s3 = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);
  return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
}

function inPin(x, y, g) {
  const { cx, cy, r } = g.head;
  if (Math.hypot(x - cx, y - cy) <= r) return true;
  return inTriangle(x, y, g.tail);
}

/** Distance from (x,y) to the segment (x1,y1)-(x2,y2). */
function segDist(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = clamp01(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

/** Is (x,y) inside the knocked-out "AA" monogram's ink? */
function inLetters(x, y, L) {
  if (!L) return false;
  for (const cx of L.cxs) {
    // The two legs, apex at (cx, top).
    if (segDist(x, y, cx - L.halfW, L.bottom, cx, L.top) <= L.legW / 2) return true;
    if (segDist(x, y, cx, L.top, cx + L.halfW, L.bottom) <= L.legW / 2) return true;
    // The crossbar.
    if (segDist(x, y, cx - L.barHalf, L.barY, cx + L.barHalf, L.barY) <= L.barW / 2)
      return true;
  }
  return false;
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
          if (!plateCoverage(x, y, rounded)) continue;
          // Paint order matches icon.svg: plate, pin, monogram knockout.
          const c =
            inPin(x, y, g) && !inLetters(x, y, g.letters) ? pal.pin : pal.plate;
          acc[0] += c[0];
          acc[1] += c[1];
          acc[2] += c[2];
          accA += 1;
        }
      }
      const n = ss * ss;
      const o = (py * size + pxi) * 4;
      if (accA === 0) {
        px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0;
        continue;
      }
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
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
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
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(entries.length, 4);
  let offset = dir.length;
  entries.forEach((e, i) => {
    const o = 6 + i * 16;
    dir[o] = e.size >= 256 ? 0 : e.size;
    dir[o + 1] = e.size >= 256 ? 0 : e.size;
    dir[o + 2] = 0;
    dir[o + 3] = 0;
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
  ico(sizes.map((s) => ({ size: s, data: png(s, render(s, PAL, true)) }))),
);
writeFileSync(`${out}/apple-icon.png`, png(180, render(180, PAL, false)));

/*
 * Optional second argument: a directory for preview renders. The 16px and
 * 32px ones are nearest-neighbour blow-ups, because the only way to judge a
 * favicon is to look at the pixels it actually gets.
 */
const pv = process.argv[3];
if (pv) {
  writeFileSync(`${pv}/pv-256.png`, png(256, render(256, PAL, true)));
  for (const s of [16, 32]) {
    // Nearest-neighbour blow-up so the actual tab-size pixels are visible.
    const src = render(s, PAL, true),
      f = 8,
      big = Buffer.alloc(s * f * s * f * 4);
    for (let y = 0; y < s * f; y++)
      for (let x = 0; x < s * f; x++) {
        const so = (Math.floor(y / f) * s + Math.floor(x / f)) * 4;
        src.copy(big, (y * s * f + x) * 4, so, so + 4);
      }
    writeFileSync(`${pv}/pv-${s}-zoom.png`, png(s * f, big));
  }
}
console.log("wrote favicon.ico, apple-icon.png");
