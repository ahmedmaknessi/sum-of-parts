import { interpolate } from "remotion";
import { DURATION, EASE } from "../brand/tokens";

type ProgressOptions = {
  /** When the animation starts, in seconds from the start of the sequence. */
  readonly start?: number;
  /** How long the animation lasts, in seconds. */
  readonly duration?: number;
  readonly easing?: (t: number) => number;
};

/**
 * Returns an eased 0 to 1 progress value for an animation window.
 * Clamped on both sides, so it is 0 before `start` and 1 after it ends.
 */
export const progress = (
  frame: number,
  fps: number,
  { start = 0, duration = DURATION.base, easing = EASE.out }: ProgressOptions = {},
): number => {
  const startFrame = start * fps;
  const endFrame = startFrame + Math.max(duration * fps, 1);
  return interpolate(frame, [startFrame, endFrame], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/**
 * Frame-based version of progress(): eased 0 to 1 from `startFrame` over
 * `durationFrames`. Use it when timing comes from timeline cue frames.
 */
export const ramp = (
  frame: number,
  startFrame: number,
  durationFrames: number,
  easing: (t: number) => number = EASE.out,
): number =>
  interpolate(frame, [startFrame, startFrame + Math.max(durationFrames, 1)], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Linear blend between two numbers. */
export const mix = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

/**
 * Fade-out progress for the last `duration` seconds of a sequence:
 * 1 while visible, easing to 0 at the final frame.
 */
export const exitOpacity = (
  frame: number,
  fps: number,
  durationInFrames: number,
  duration: number = DURATION.fast,
): number => {
  const endFrame = durationInFrames - 1;
  const startFrame = Math.max(endFrame - duration * fps, 0);
  if (endFrame <= startFrame) {
    return 1;
  }
  return interpolate(frame, [startFrame, endFrame], [1, 0], {
    easing: EASE.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};
