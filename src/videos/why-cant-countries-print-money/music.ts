/**
 * Music arrangement for video 03: the same "Pizzicato Polka" (Strauss) pack as
 * video 02 (Envato Elements, public/music/money-in-your-bank-doesnt-exist/,
 * git-ignored). Full mix on the light island story, thin stems under the
 * Zimbabwe and US numbers, sparse when the separation breaks. Ducked under the
 * voice and mixed by `npm run audio -- why-cant-countries-print-money`.
 */
import { getScene, sceneTiming, TIMELINE } from "./timeline";

const DIR = "music/money-in-your-bank-doesnt-exist";

export type MusicMode = "full" | "thin" | "sparse" | "open";

export const MUSIC = {
  files: {
    full: `${DIR}/pizzicato-polka-by-strauss_main-full.wav`,
    thin: [`${DIR}/stems/pizzicato-polka-by-strauss_stem-04.wav`, `${DIR}/stems/pizzicato-polka-by-strauss_stem-05.wav`],
    sparse: [`${DIR}/stems/pizzicato-polka-by-strauss_stem-05.wav`],
  },
  targetLufs: -25,
  duckDb: 7,
  modeDb: { full: 0, thin: -2, sparse: -6, open: 1 } as Record<MusicMode, number>,
  crossfadeSec: 1,
  fadeOutSec: 3,
} as const;

/** [fromFrame, mode]: the mode in force from each frame on. */
export const MUSIC_SECTIONS: readonly (readonly [number, MusicMode])[] = (() => {
  const at = (id: Parameters<typeof getScene>[0]) => getScene(id).startFrame;
  const breaks = getScene("s09-who").startFrame + sceneTiming("s09-who").cue("breaks");
  return [
    [0, "thin"],
    [at("s02-logo"), "open"],
    [at("s03-island"), "full"],
    [at("s05-zimbabwe"), "thin"],
    [at("s07-reasons"), "full"],
    [at("s09-who"), "thin"],
    [breaks, "sparse"],
    [at("s10-takeaway"), "full"],
    [at("end-card"), "open"],
    [TIMELINE.totalFrames, "open"],
  ] as const;
})();
