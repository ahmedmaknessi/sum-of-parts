/**
 * SVG path builders for cut-paper shapes. Edges get a small, fixed wobble
 * (seeded, so a shape looks identical on every frame: nothing flickers).
 * Animate paper by moving or scaling the whole shape, never by rebuilding it.
 */
import { PAPER } from "../../brand/tokens";

/** Deterministic noise in [-1, 1] for a seed and an index. */
const jitter = (seed: number, i: number) => {
  let h = (seed * 2654435761 + i * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1;
};

type Pt = readonly [number, number];

/** Points along a straight edge from a to b, nudged sideways by the cut wobble. */
const cutEdge = (a: Pt, b: Pt, seed: number, wobble: number): Pt[] => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(len / PAPER.edge.step));
  // Unit normal to the edge.
  const nx = -(b[1] - a[1]) / (len || 1);
  const ny = (b[0] - a[0]) / (len || 1);
  return Array.from({ length: n }, (_, i) => {
    const t = i / n;
    const w = i === 0 ? 0 : jitter(seed, i) * wobble;
    return [a[0] + (b[0] - a[0]) * t + nx * w, a[1] + (b[1] - a[1]) * t + ny * w] as const;
  });
};

const toPath = (pts: readonly Pt[]) =>
  `M ${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")} Z`;

type RectOptions = {
  readonly seed?: number;
  readonly wobble?: number;
  /** Keep the top edge perfectly straight (a bar's value is read from it). */
  readonly straightTop?: boolean;
};

/** A cut-paper rectangle. */
export const paperRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  { seed = 1, wobble = PAPER.edge.wobble, straightTop = false }: RectOptions = {},
): string => {
  const tl: Pt = [x, y];
  const tr: Pt = [x + w, y];
  const br: Pt = [x + w, y + h];
  const bl: Pt = [x, y + h];
  return toPath([
    ...cutEdge(tl, tr, seed, straightTop ? 0 : wobble),
    ...cutEdge(tr, br, seed + 1, wobble),
    ...cutEdge(br, bl, seed + 2, wobble),
    ...cutEdge(bl, tl, seed + 3, wobble),
  ]);
};

/**
 * A cut-paper landscape layer: a wavy top edge from x0 to x1 (sum of gentle
 * waves around `baseY`), filled down to `bottom`.
 */
export const paperHill = (
  x0: number,
  x1: number,
  baseY: number,
  bottom: number,
  { seed = 1, amplitude = 40, waves = 2.5, wobble = PAPER.edge.wobble } = {},
): string => {
  const step = PAPER.edge.step;
  const n = Math.ceil((x1 - x0) / step);
  const phase = (jitter(seed, 999) + 1) * Math.PI;
  const top: Pt[] = Array.from({ length: n + 1 }, (_, i) => {
    const x = x0 + (i / n) * (x1 - x0);
    const t = (i / n) * Math.PI * 2 * waves;
    const y =
      baseY +
      amplitude * (0.65 * Math.sin(t + phase) + 0.35 * Math.sin(t * 2.3 + phase * 1.7)) +
      jitter(seed, i) * wobble;
    return [x, y] as const;
  });
  return toPath([...top, [x1, bottom], [x0, bottom]]);
};

/** A cut-paper circle (sun, coin, cloud puff). */
export const paperCircle = (
  cx: number,
  cy: number,
  r: number,
  { seed = 1, wobble = PAPER.edge.wobble } = {},
): string => {
  const n = Math.max(12, Math.round((2 * Math.PI * r) / PAPER.edge.step));
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r + jitter(seed, i) * wobble;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;
  });
  return toPath(pts);
};

/** A cut-paper cloud: overlapping puffs on a flat base, as one shape. */
export const paperCloud = (x: number, y: number, width: number, { seed = 1 } = {}): string => {
  const r = width / 4;
  return [
    paperCircle(x + r, y, r * 0.8, { seed }),
    paperCircle(x + r * 2, y - r * 0.45, r * 1.05, { seed: seed + 1 }),
    paperCircle(x + r * 3, y - r * 0.05, r * 0.85, { seed: seed + 2 }),
    paperRect(x + r * 0.6, y - r * 0.1, r * 2.8, r * 0.75, { seed: seed + 3 }),
  ].join(" ");
};
