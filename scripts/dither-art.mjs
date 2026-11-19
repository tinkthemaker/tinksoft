// Renders the Grimoire masthead art: a Bayer 8x8 ordered-dither torchlit stone
// corridor (night: torchlight, day: ink engraving on transparent paper) and the
// top-strip tiles, as tiny indexed PNGs. Original art; deterministic; no
// dependencies beyond node:zlib.
//
// Run by hand when the art changes:  node scripts/dither-art.mjs
// It rewrites src/generated/dither-art.mjs, which Base.astro inlines.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateSync } from 'node:zlib';

const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];
const bayer = (x, y) => (BAYER[(y & 7) * 8 + (x & 7)] + 0.5) / 64;

// ---------- PNG: indexed, 1/2/4/8-bit, optional tRNS ----------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (bytes) => {
  let c = ~0;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return ~c >>> 0;
};
const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([length, body, sum]);
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function png(w, h, idx, palette, transparentIdx) {
  const bits = palette.length <= 2 ? 1 : palette.length <= 4 ? 2 : palette.length <= 16 ? 4 : 8;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w, 0);
  header.writeUInt32BE(h, 4);
  header[8] = bits;
  header[9] = 3; // indexed colour
  const rowBytes = Math.ceil((w * bits) / 8);
  const raw = Buffer.alloc(h * (1 + rowBytes));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const bit = x * bits;
      raw[y * (1 + rowBytes) + 1 + (bit >> 3)] |= idx[y * w + x] << (8 - bits - (bit & 7));
    }
  }
  const parts = [
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('PLTE', Buffer.from(palette.flatMap(rgb))),
  ];
  if (transparentIdx != null) {
    const alpha = Buffer.alloc(transparentIdx + 1, 255);
    alpha[transparentIdx] = 0;
    parts.push(chunk('tRNS', alpha));
  }
  parts.push(chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

// ---------- scene: ray-cast a box corridor ----------
const W = 120, H = 80, CX = W / 2, CY = H / 2 + 2, F = W / 2;
const HH = 0.8, ZF = 4.4; // half height, far wall depth
const TORCH_WORLD = [[-0.84, 0.14, 1.75], [0.84, 0.14, 1.75]];

const hash = (a, b, c) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function castPixel(px, py) {
  const dx = (px + 0.5 - CX) / F, dy = -(py + 0.5 - CY) / F;
  let t = ZF, s = 'far';
  if (dx < 0 && -1 / dx < t) { t = -1 / dx; s = 'L'; }
  if (dx > 0 && 1 / dx < t) { t = 1 / dx; s = 'R'; }
  if (dy > 0 && HH / dy < t) { t = HH / dy; s = 'C'; }
  if (dy < 0 && -HH / dy < t) { t = -HH / dy; s = 'G'; }
  const X = dx * t, Y = dy * t, Z = t;
  let n, block, kind = 'stone';
  if (s === 'L' || s === 'R') {
    n = [s === 'L' ? 1 : -1, 0, 0];
    const row = Math.floor((Y + HH) / 0.2), off = row % 2 ? 0.24 : 0;
    block = [s === 'L' ? 1 : 2, row, Math.floor((Z + off) / 0.48)];
  } else if (s === 'G') {
    n = [0, 1, 0];
    const row = Math.floor(Z / 0.5), off = row % 2 ? 0.25 : 0;
    block = [3, row, Math.floor((X + off + 2) / 0.5)];
  } else if (s === 'C') {
    n = [0, -1, 0];
    kind = 'ceil';
    block = [4, Math.floor(Z / 0.7), 0]; // beams across
  } else {
    n = [0, 0, -1];
    const r = Math.hypot(X, Y - 0.22);
    if (Math.abs(X) < 0.4 && (Y < 0.22 || r < 0.4)) { kind = 'void'; block = [5, 0, 0]; }
    else if (Y >= 0.22 && r < 0.54) { kind = 'arch'; block = [6, Math.floor((Math.atan2(Y - 0.22, X) / Math.PI) * 9), 0]; }
    else if (Y < 0.22 && Math.abs(X) < 0.54) { kind = 'arch'; block = [7, Math.floor((Y + HH) / 0.2), X < 0 ? 0 : 1]; }
    else {
      const row = Math.floor((Y + HH) / 0.2), off = row % 2 ? 0.24 : 0;
      block = [8, row, Math.floor((X + off + 2) / 0.48)];
    }
  }
  return { s, X, Y, Z, n, block, kind };
}

function light(c) {
  if (c.kind === 'void') return 0;
  let L = 0.06 * Math.exp(-(c.Z - 1) * 0.42); // ambient, fades with depth
  for (const [tx, ty, tz] of TORCH_WORLD) {
    const vx = tx - c.X, vy = ty - c.Y, vz = tz - c.Z, d = Math.hypot(vx, vy, vz);
    const lam = Math.max(0, (c.n[0] * vx + c.n[1] * vy + c.n[2] * vz) / d + 0.3) / 1.3;
    L += (1.5 * lam) / (1 + 4.2 * d * d); // tight pools of torchlight
  }
  const k = c.block;
  L *= 0.82 + 0.36 * hash(k[0], k[1], k[2]);
  if (c.kind === 'ceil') L *= 0.6;
  if (c.kind === 'arch') L *= 1.15;
  return 1 - Math.exp(-L * 1.9);
}

/** Luminance and mortar lines for every corridor pixel. */
function shadeScene() {
  const cells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push(castPixel(x, y));
  const key = (c) => c.s + c.block.join(',');
  const lum = new Float32Array(W * H), mortar = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, c = cells[i];
      lum[i] = light(c);
      if (c.kind === 'void') continue;
      const r = x + 1 < W ? cells[i + 1] : c, d = y + 1 < H ? cells[i + W] : c;
      const edge = key(r) !== key(c) || key(d) !== key(c);
      if (edge && !(c.kind === 'ceil' && r.s === 'C' && d.s === 'C' && key(r) === key(c))) mortar[i] = 1;
    }
  }
  return { lum, mortar };
}

/** Torch screen positions: [sx, sy] of each flame's bracket top. */
const torchSprites = () => TORCH_WORLD.map(([tx, ty, tz]) => [Math.round(CX + (F * tx) / tz), Math.round(CY - (F * ty) / tz)]);

// flame mask: 0 none, 1 outer, 2 mid, 3 core (rows top to bottom, centred on sx)
const FLAME = [
  [0, 0, 1, 0, 0],
  [0, 1, 2, 1, 0],
  [0, 1, 3, 2, 1],
  [1, 2, 3, 2, 1],
  [0, 1, 2, 1, 0],
];

function render({ lum, mortar }, levels, mortarIdx, flameIdx, bracketIdx, invert) {
  const N = levels.length, idx = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const v = invert ? 1 - lum[i] : lum[i];
      const k = Math.max(0, Math.min(N - 1, Math.floor(v * (N - 1) + bayer(x, y))));
      idx[i] = levels[k];
      if (mortar[i]) idx[i] = mortarIdx(lum[i]);
    }
  }
  for (const [sx, sy] of torchSprites()) {
    for (let j = 1; j <= 5; j++) {
      const yy = sy + j;
      if (yy < H) idx[yy * W + sx] = bracketIdx;
    }
    FLAME.forEach((row, r) => row.forEach((m, c) => {
      if (!m) return;
      const xx = sx - 2 + c, yy = sy - 5 + r;
      if (xx >= 0 && xx < W && yy >= 0) idx[yy * W + xx] = flameIdx[m - 1];
    }));
  }
  return idx;
}

const NIGHT = ['#0b0704', '#22130a', '#3d2210', '#663818', '#9a5523', '#cf7b2e', '#f0ac55', '#ffe3a3'];
const DAY = ['#000000', '#6b4a2a', '#1e140b', '#7e1a10']; // index 0 is transparent paper
const STRIP_NIGHT = ['#ffc66b', '#f0a03c', '#cf6d24', '#8a3a14', '#4d200e', '#2a170c', '#1c130c'];
const STRIP_DAY = ['#1e140b', '#3b2614', '#5e3d1f', '#7e5a33', '#9c7a4e', '#b99568'];

/** A 16px-wide tile that dithers from the first stop down into the last. */
function strip(h, stops) {
  const N = stops.length, idx = new Uint8Array(16 * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < 16; x++) {
      const t = y / (h - 1);
      idx[y * 16 + x] = Math.max(0, Math.min(N - 1, Math.floor(t * (N - 1) + bayer(x, y))));
    }
  }
  return png(16, h, idx, stops);
}

const pct = (v) => Number(v.toFixed(1));

export function renderArt() {
  const scene = shadeScene();
  const night = render(scene, [0, 1, 2, 3, 4, 5, 6], (l) => (l > 0.55 ? 2 : l > 0.25 ? 1 : 0), [5, 6, 7], 1, false);
  const day = render(scene, [0, 1, 2], () => 2, [3, 3, 0], 2, true);
  return {
    corridorNight: png(W, H, night, NIGHT),
    corridorDay: png(W, H, day, DAY, 0),
    stripNight: strip(14, STRIP_NIGHT),
    stripDay: strip(14, STRIP_DAY),
    // Flame centres as percentages of the scene, for the flicker halos.
    torches: torchSprites().map(([sx, sy]) => ({ x: pct(((sx + 0.5) / W) * 100), y: pct(((sy - 3 + 0.5) / H) * 100) })),
  };
}

const dataUri = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

export function artModuleSource(art) {
  const images = ['corridorNight', 'corridorDay', 'stripNight', 'stripDay']
    .map((key) => `  ${key}: '${dataUri(art[key])}',`)
    .join('\n');
  const torches = art.torches.map(({ x, y }) => `{ x: ${x}, y: ${y} }`).join(', ');
  return `// generated by node scripts/dither-art.mjs: do not edit by hand.
// The Grimoire corridor (night and day) and top-strip tiles as inline PNGs,
// plus the flame positions (percent of the scene) the flicker halos use.

export const ART = Object.freeze({
${images}
});

export const TORCHES = Object.freeze([${torches}]);
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const art = renderArt();
  const target = new URL('../src/generated/dither-art.mjs', import.meta.url);
  mkdirSync(new URL('.', target), { recursive: true });
  writeFileSync(target, artModuleSource(art));
  for (const key of ['corridorNight', 'corridorDay', 'stripNight', 'stripDay']) {
    console.log(`${key.padEnd(14)} ${String(art[key].length).padStart(5)} B png`);
  }
  console.log(`wrote ${fileURLToPath(target)}`);
}
