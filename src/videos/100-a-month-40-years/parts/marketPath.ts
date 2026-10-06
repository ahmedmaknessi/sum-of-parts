/**
 * A stylized 100-year market path for Scene 06. Decorative, NOT index data:
 * a seeded random walk on a rising trend, with two designed crashes whose
 * depths come from ILLUSTRATIVE_DROPS so the "-30%" / "-40%" labels match.
 * Shown on screen with an "Illustrative" tag.
 */
import { ILLUSTRATIVE_DROPS } from "../data";

const STEPS_PER_YEAR = 4;
const YEARS = 100;

/** Crash timing in years from the start (purely visual placement). */
const CRASHES = [
  { at: 52, depth: -ILLUSTRATIVE_DROPS[0] },
  { at: 82, depth: -ILLUSTRATIVE_DROPS[1] },
] as const;
const FALL_YEARS = 1.5;
const RECOVER_YEARS = 4;

/** Deterministic PRNG (mulberry32), so every render draws the same path. */
const prng = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const crashFactor = (year: number) =>
  CRASHES.reduce((f, c) => {
    const t = year - c.at;
    const s = t < 0 ? 0 : t < FALL_YEARS ? t / FALL_YEARS : t < FALL_YEARS + RECOVER_YEARS ? 1 - (t - FALL_YEARS) / RECOVER_YEARS : 0;
    return f * (1 - c.depth * s);
  }, 1);

export type MarketPoint = { readonly year: number; readonly value: number };

const build = (): MarketPoint[] => {
  const random = prng(1926);
  const points: MarketPoint[] = [];
  let wobble = 0;
  for (let i = 0; i <= YEARS * STEPS_PER_YEAR; i++) {
    const year = i / STEPS_PER_YEAR;
    // Smoothly rising trend, drawn on a linear scale.
    const trend = 1 + 9 * (year / YEARS) ** 1.6;
    // Small mean-reverting jitter so the line looks like a market.
    wobble = wobble * 0.82 + (random() - 0.5) * 0.09;
    points.push({ year, value: trend * (1 + wobble) * crashFactor(year) });
  }
  return points;
};

export const MARKET_PATH: readonly MarketPoint[] = build();
export const MARKET_MAX = Math.max(...MARKET_PATH.map((p) => p.value));

/** The lowest point of each crash, for the "-30%" / "-40%" labels. */
export const MARKET_TROUGHS = CRASHES.map((c) => {
  const window = MARKET_PATH.filter((p) => p.year >= c.at && p.year <= c.at + FALL_YEARS + RECOVER_YEARS);
  return window.reduce((low, p) => (p.value < low.value ? p : low), window[0]);
});

/** Year range around each crash, for the amber flash. */
export const MARKET_CRASH_SPANS = CRASHES.map((c) => ({ from: c.at - 0.5, to: c.at + FALL_YEARS + RECOVER_YEARS }));

export const MARKET_YEARS = YEARS;
