/**
 * Generates the paper grain tile: public/paper/grain.png (512x512, seamless).
 *
 *   npx tsx scripts/make-paper-texture.ts
 *
 * Each pixel is white or black with a small alpha: fine fibre noise plus soft
 * blotches, so the same tile lightens and darkens any card colour a little.
 * Laid over cards at PAPER.grain.opacity. Deterministic: same file every run.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";

const SIZE = 512;

/** Deterministic hash noise in [0, 1). */
const hash = (x: number, y: number, seed: number) => {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Smooth value noise that tiles over the 512px tile (cell count must divide it). */
const valueNoise = (x: number, y: number, cells: number, seed: number) => {
  const cell = SIZE / cells;
  const gx = x / cell;
  const gy = y / cell;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const tx = gx - x0;
  const ty = gy - y0;
  const s = (t: number) => t * t * (3 - 2 * t);
  const at = (i: number, j: number) => hash(((i % cells) + cells) % cells, ((j % cells) + cells) % cells, seed);
  const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * s(tx);
  const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * s(tx);
  return a + (b - a) * s(ty);
};

const rgba = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const fine = hash(x, y, 7) - 0.5; // speckle
    const fibre = valueNoise(x, y, 128, 3) - 0.5; // short fibres
    const blotch = valueNoise(x, y, 8, 11) - 0.5; // soft unevenness
    const v = fine * 0.55 + fibre * 0.6 + blotch * 0.3; // about -0.7 .. 0.7
    const i = (y * SIZE + x) * 4;
    const light = v > 0 ? 255 : 0;
    rgba[i] = light;
    rgba[i + 1] = light;
    rgba[i + 2] = light;
    rgba[i + 3] = Math.min(255, Math.round(Math.abs(v) * 90));
  }
}

// --- Minimal PNG encoder (RGBA, 8-bit, no interlace) ---
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filter: none
  rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.join("public", "paper", "grain.png");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`${out}: ${SIZE}x${SIZE}, ${(png.length / 1024).toFixed(0)} KB`);
