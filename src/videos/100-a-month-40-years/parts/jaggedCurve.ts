/**
 * Scene 12's "real markets don't climb in a smooth line" path. Decorative,
 * NOT market data (shown with an "Illustrative" tag): the smooth 7% curve
 * multiplied by three crashes and some seeded noise. Every disturbance is
 * zero at year 40, so the jagged path ends exactly on the same final value.
 */
import { DATA } from "../data";

/** Crash timing (years) and depth: purely visual placement. */
const CRASHES = [
  { at: 13, depth: 0.3 },
  { at: 24, depth: 0.35 },
  { at: 32, depth: 0.25 },
] as const;
const FALL_YEARS = 1.25;
const RECOVER_YEARS = 3.5;
const NOISE = 0.035;

const prng = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const crashFactor = (year: number) =>
  CRASHES.reduce((f, c) => {
    const t = year - c.at;
    const s =
      t < 0 ? 0 : t < FALL_YEARS ? t / FALL_YEARS : t < FALL_YEARS + RECOVER_YEARS ? 1 - (t - FALL_YEARS) / RECOVER_YEARS : 0;
    return f * (1 - c.depth * s);
  }, 1);

const YEARS = DATA.series.length;

const build = (): number[] => {
  const random = prng(2008);
  let wobble = 0;
  return DATA.curves.invested.map((value, month) => {
    const year = month / 12;
    wobble = wobble * 0.85 + (random() - 0.5) * NOISE;
    // Noise fades out over the last two years, so the end value is exact.
    const envelope = Math.min(1, (YEARS - year) / 2);
    return value * crashFactor(year) * (1 + wobble * envelope);
  });
};

/** Monthly values, index = month (same length as DATA.curves.invested). */
export const JAGGED_CURVE: readonly number[] = build();

/** Lowest point of each crash (fractional year + value), for the "Crash" labels and arrows. */
export const JAGGED_TROUGHS = CRASHES.map((c) => {
  const from = Math.round(c.at * 12);
  const to = Math.round((c.at + FALL_YEARS + RECOVER_YEARS) * 12);
  let best = from;
  for (let m = from; m <= to; m++) if (JAGGED_CURVE[m] < JAGGED_CURVE[best]) best = m;
  return { year: best / 12, value: JAGGED_CURVE[best], recoveredYear: c.at + FALL_YEARS + RECOVER_YEARS * 0.6 };
});
