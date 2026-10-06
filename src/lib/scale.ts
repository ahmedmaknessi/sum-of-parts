/** Rounds a step up to 1, 2, 2.5 or 5 times a power of ten. */
const niceStep = (rawStep: number): number => {
  if (rawStep <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
};

export type NiceDomain = {
  readonly min: number;
  readonly max: number;
  readonly ticks: readonly number[];
};

/**
 * Expands [min, max] to round numbers and returns evenly spaced ticks,
 * e.g. [0, 87] with 4 ticks -> 0, 25, 50, 75, 100.
 */
export const niceDomain = (min: number, max: number, tickCount = 4): NiceDomain => {
  const safeMax = max === min ? min + 1 : max;
  const step = niceStep((safeMax - min) / tickCount);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let t = niceMin; t <= niceMax + step / 2; t += step) {
    ticks.push(Number(t.toPrecision(12)));
  }
  return { min: niceMin, max: niceMax, ticks };
};

/** Maps a value from a domain onto a pixel range. */
export const linearScale =
  (domain: readonly [number, number], range: readonly [number, number]) =>
  (value: number): number => {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    if (d1 === d0) {
      return r0;
    }
    return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
  };
