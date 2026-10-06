/**
 * Scene timing helpers. Each video keeps its scene durations, in seconds, in
 * one `scenes.ts` file. Everything else (sequence lengths, the composition's
 * total duration) is derived from that file, so retiming a video to a new
 * voiceover means editing one place.
 */

/** Scene name -> duration in seconds. */
export type SceneDurations = Readonly<Record<string, number>>;

export const toFrames = (seconds: number, fps: number): number =>
  Math.max(1, Math.round(seconds * fps));

/**
 * Total composition length in frames for a series of scenes joined by
 * transitions of `transitionSeconds` (transitions overlap adjacent scenes).
 */
export const getTotalFrames = (
  scenes: SceneDurations,
  fps: number,
  transitionSeconds = 0,
): number => {
  const durations = Object.values(scenes);
  const sceneFrames = durations.reduce((sum, s) => sum + toFrames(s, fps), 0);
  const transitionFrames =
    transitionSeconds > 0 ? toFrames(transitionSeconds, fps) : 0;
  return sceneFrames - Math.max(durations.length - 1, 0) * transitionFrames;
};
