import { Audio } from "@remotion/media";
import type React from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { PaperBackground } from "../../components/paper/PaperBackground";
import { SHEET_FRAMES, SheetWipe } from "../money-in-your-bank-doesnt-exist/Video02";
import MIX from "./audio-mix.json";
import { SCENES } from "./scene-list";
import { InVideo03 } from "./SceneRoot";
import { THEME } from "./theme";
import { getScene, TIMELINE, type SceneId } from "./timeline";

const VOICE_FILE = staticFile(MIX.file);
/** Built by `npm run audio -- why-cant-countries-print-money`: levels and ducking are baked in. */
const MUSIC_FILE = staticFile("audio/why-cant-countries-print-money/music-bed.wav");
const SFX_FILE = staticFile("audio/why-cant-countries-print-money/sfx-track.wav");

/** A scene plays exactly from its start to its end; sheet wipes hide the cut. */
const SceneSlot: React.FC<{ readonly id: SceneId; readonly children: React.ReactNode }> = ({ id, children }) => {
  const { fps } = useVideoConfig();
  const s = getScene(id);
  return (
    <Sequence name={id} from={s.startFrame} durationInFrames={s.endFrame - s.startFrame} premountFor={fps}>
      {children}
    </Sequence>
  );
};

type Video03Props = {
  /** Leave the voiceover and sound out (QA frame renders). */
  readonly muted?: boolean;
};

export const Video03: React.FC<Video03Props> = ({ muted = false }) => {
  const { fps } = useVideoConfig();
  return (
    <PaperBackground board={THEME.board} ink={THEME.ink}>
      <InVideo03.Provider value>
        {muted ? null : (
          <>
            <Audio name="Music" src={MUSIC_FILE} />
            <Audio name="Sound effects" src={SFX_FILE} />
          </>
        )}
        {muted
          ? null
          : TIMELINE.audioSegments.map((seg, i) => (
              <Audio
                key={i}
                name={`Voiceover ${i + 1}`}
                src={VOICE_FILE}
                volume={MIX.voiceVolume}
                from={seg.atFrame}
                trimBefore={seg.fromFrame}
                durationInFrames={seg.toFrame - seg.fromFrame}
                premountFor={fps}
              />
            ))}

        {SCENES.map(({ id, Component }) => (
          <SceneSlot key={id} id={id}>
            <Component />
          </SceneSlot>
        ))}

        {TIMELINE.scenes.slice(1).map((s) => (
          <Sequence key={s.id} name={`Wipe into ${s.id}`} from={s.startFrame - SHEET_FRAMES / 2} durationInFrames={SHEET_FRAMES}>
            <SheetWipe />
          </Sequence>
        ))}
      </InVideo03.Provider>
    </PaperBackground>
  );
};
