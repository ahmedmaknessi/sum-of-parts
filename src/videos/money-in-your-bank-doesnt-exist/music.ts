/**
 * Music arrangement for video 02: "Pizzicato Polka" (Strauss), Envato Elements
 * pack in public/music/<slug>/ (git-ignored). The full mix plays on light
 * moments, two low stems under dense explanations, one quiet stem for the
 * bank run. Ducked under the voice and mixed by `npm run audio -- <slug>`.
 */
import { getScene, sceneTiming, TIMELINE } from "./timeline";

const DIR = "music/money-in-your-bank-doesnt-exist";

export type MusicMode = "full" | "thin" | "sparse" | "open";

export const MUSIC = {
  files: {
    full: `${DIR}/pizzicato-polka-by-strauss_main-full.wav`,
    /** Lowest, steadiest stems (by spectral centroid): the "thin" bed. */
    thin: [`${DIR}/stems/pizzicato-polka-by-strauss_stem-04.wav`, `${DIR}/stems/pizzicato-polka-by-strauss_stem-05.wav`],
    sparse: [`${DIR}/stems/pizzicato-polka-by-strauss_stem-05.wav`],
  },
  /** Loudness of the bed before ducking (LUFS). Ducked under the voice by `duckDb`. */
  targetLufs: -25,
  duckDb: 7,
  /** Relative level per mode (dB); "open" = no voice (logo, end card): full mix, not ducked. */
  modeDb: { full: 0, thin: -2, sparse: -6, open: 1 } as Record<MusicMode, number>,
  crossfadeSec: 1,
  fadeOutSec: 3,
} as const;

/** [fromFrame, mode]: the mode in force from each frame on. */
export const MUSIC_SECTIONS: readonly (readonly [number, MusicMode])[] = (() => {
  const at = (id: Parameters<typeof getScene>[0]) => getScene(id).startFrame;
  const trust = getScene("s11-trust").startFrame + sceneTiming("s11-trust").cue("fallApart");
  return [
    [0, "full"],
    [at("s02-logo"), "open"],
    [at("s03-textbook"), "full"],
    [at("s04-twist"), "thin"],
    [at("s07-destroyed"), "full"],
    [at("s08-cash"), "thin"],
    [at("s10-infinite"), "full"],
    [trust, "sparse"],
    [at("s12-insurance"), "full"],
    [at("end-card"), "open"],
    [TIMELINE.totalFrames, "open"],
  ] as const;
})();
