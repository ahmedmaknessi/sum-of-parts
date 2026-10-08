import { Audio } from "@remotion/media";
import type React from "react";
import { staticFile, useVideoConfig } from "remotion";
import MIX from "./audio-mix.json";
import { SFX_TRACK_FILE, SFX_TRACK_VOLUME } from "./sfx";
import { TIMELINE } from "./timeline";

/** Voiceover and sound effects for [from, to) of the full video, cut exactly like Video01 plays them. */
export const SceneAudio: React.FC<{ readonly from: number; readonly to: number }> = ({ from, to }) => {
  const { fps } = useVideoConfig();
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
        name="Sound effects"
        src={staticFile(SFX_TRACK_FILE)}
        volume={SFX_TRACK_VOLUME}
        trimBefore={from}
        durationInFrames={to - from}
      />
    </>
  );
};
