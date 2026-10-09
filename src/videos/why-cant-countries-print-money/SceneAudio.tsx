import { Audio } from "@remotion/media";
import type React from "react";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import MIX from "./audio-mix.json";
import { TIMELINE } from "./timeline";

/** Built by `npm run audio -- why-cant-countries-print-money`. */
export const MUSIC_FILE = "audio/why-cant-countries-print-money/music-bed.wav";
export const SFX_FILE = "audio/why-cant-countries-print-money/sfx-track.wav";

/**
 * Voice, music and sound effects for [from, to) of video 03, cut exactly as
 * Video03 plays them. The music fades in and out over `musicFade` frames so a
 * clip never starts or stops mid-note.
 */
export const SceneAudio: React.FC<{ readonly from: number; readonly to: number; readonly musicFade?: number }> = ({
  from,
  to,
  musicFade = 12,
}) => {
  const { fps } = useVideoConfig();
  const len = to - from;
  return (
    <>
      {TIMELINE.audioSegments.map((seg, i) => {
        const segStart = seg.atFrame;
        const segEnd = seg.atFrame + seg.toFrame - seg.fromFrame;
        const a = Math.max(from, segStart);
        const b = Math.min(to, segEnd);
        if (a >= b) return null;
        return (
          <Audio
            key={i}
            name="Voiceover"
            src={staticFile(MIX.file)}
            volume={MIX.voiceVolume}
            from={a - from}
            trimBefore={seg.fromFrame + (a - segStart)}
            durationInFrames={b - a}
            premountFor={fps}
          />
        );
      })}
      <Audio
        name="Music"
        src={staticFile(MUSIC_FILE)}
        trimBefore={from}
        durationInFrames={len}
        volume={(f) => interpolate(f, [0, musicFade, len - musicFade, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      <Audio name="Sound effects" src={staticFile(SFX_FILE)} trimBefore={from} durationInFrames={len} />
    </>
  );
};
