/**
 * Scene list for the BrandShowcase. The ONLY place scene timing lives.
 * Durations are in seconds, in playback order. Change a number here and the
 * sequence and the composition's total length both update.
 */
export const SCENES = {
  logoIntro: 3.5,
  brandSystem: 5,
  titleCard: 4.5,
  counters: 5,
  barChart: 7,
  lineChart: 8,
  endCard: 6,
} as const;

/** Crossfade between scenes, in seconds. */
export const TRANSITION_SECONDS = 0.5;
