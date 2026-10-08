/**
 * Motion helpers for the papercut styles. "On twos" means a pose holds for
 * two frames (15 poses per second at 30fps), the handmade stop-motion feel.
 * Apply it to piece motion only; camera drifts and parallax stay smooth.
 * Everything random is seeded per piece, so every render is identical.
 */
import { EASE } from "../brand/tokens";
import { jitter } from "../components/paper/paperPath";
import { mix, ramp } from "./motion";

/** The frame a stop-motion pose shows: holds every pose for 2 frames. */
export const onTwos = (frame: number): number => frame - (frame % 2);

export type Placement = {
  /** 0 before the move, 1 when settled (may pass 1 slightly while overshooting). */
  readonly t: number;
  /** 0..1: how high the piece is lifted (drives its shadow depth). Peaks mid-move. */
  readonly lift: number;
  /** Rotation in degrees: a small settle wobble after landing, 0 when at rest. */
  readonly rotate: number;
};

/**
 * A paper piece placed by hand: moves in with a slight overshoot, lifted
 * while travelling, then settles with a small rotation wobble that dies out.
 * Evaluated on twos.
 */
export const placed = (
  frame: number,
  startFrame: number,
  durationFrames: number,
  { seed = 1, wobbleDeg = 2, overshoot = true } = {},
): Placement => {
  const f = onTwos(frame);
  const t = ramp(f, startFrame, durationFrames, overshoot ? EASE.settle : EASE.out);
  const travel = ramp(f, startFrame, durationFrames, EASE.inOut);
  const lift = Math.sin(Math.PI * travel);
  const since = f - (startFrame + durationFrames * 0.6);
  const direction = jitter(seed, 0) >= 0 ? 1 : -1;
  const rotate =
    since <= 0
      ? direction * wobbleDeg * travel
      : direction * wobbleDeg * Math.cos(since * 0.45) * Math.exp(-since / 7);
  return { t, lift, rotate };
};

/**
 * Idle life for a piece holding on screen: a tiny seeded rotation (degrees)
 * that drifts slowly, on twos. Keep `maxDeg` under 0.5.
 */
export const idleJitter = (frame: number, seed: number, maxDeg = 0.4): number => {
  const f = onTwos(frame) / 24;
  const i = Math.floor(f);
  const a = jitter(seed, i);
  const b = jitter(seed, i + 1);
  const s = f - i;
  return mix(a, b, s * s * (3 - 2 * s)) * maxDeg;
};
