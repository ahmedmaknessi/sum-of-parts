import { Audio } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../../brand/tokens";
import { PaperBackground } from "../../components/paper/PaperBackground";
import { PaperDefs, PaperShape } from "../../components/paper/PaperShape";
import { paperRect } from "../../components/paper/paperPath";
import { mix, ramp } from "../../lib/motion";
import { onTwos } from "../../lib/paper-motion";
import MIX from "./audio-mix.json";
import { InVideo02 } from "./SceneRoot";
import { S01Hook } from "./scenes/S01Hook";
import { S02Logo } from "./scenes/S02Logo";
import { S03Textbook } from "./scenes/S03Textbook";
import { S04Twist } from "./scenes/S04Twist";
import { S05Watch } from "./scenes/S05Watch";
import { S06TwoLayers } from "./scenes/S06TwoLayers";
import { S07Destroyed } from "./scenes/S07Destroyed";
import { S08Cash } from "./scenes/S08Cash";
import { S09Iou } from "./scenes/S09Iou";
import { S10Infinite } from "./scenes/S10Infinite";
import { S11Trust } from "./scenes/S11Trust";
import { S12Insurance } from "./scenes/S12Insurance";
import { S13Takeaway } from "./scenes/S13Takeaway";
import { S14EndCard } from "./scenes/S14EndCard";
import { THEME } from "./theme";
import { getScene, TIMELINE, type SceneId } from "./timeline";

const VOICE_FILE = staticFile(MIX.file);
/** Built by `npm run audio -- money-in-your-bank-doesnt-exist`: levels and ducking are baked in. */
const MUSIC_FILE = staticFile("audio/money-in-your-bank-doesnt-exist/music-bed.wav");
const SFX_FILE = staticFile("audio/money-in-your-bank-doesnt-exist/sfx-track.wav");

/** Every scene, in order. */
const SCENES: readonly { readonly id: SceneId; readonly Component: React.FC }[] = [
  { id: "s01-hook", Component: S01Hook },
  { id: "s02-logo", Component: S02Logo },
  { id: "s03-textbook", Component: S03Textbook },
  { id: "s04-twist", Component: S04Twist },
  { id: "s05-watch", Component: S05Watch },
  { id: "s06-two-layers", Component: S06TwoLayers },
  { id: "s07-destroyed", Component: S07Destroyed },
  { id: "s08-cash", Component: S08Cash },
  { id: "s09-iou", Component: S09Iou },
  { id: "s10-infinite", Component: S10Infinite },
  { id: "s11-trust", Component: S11Trust },
  { id: "s12-insurance", Component: S12Insurance },
  { id: "s13-takeaway", Component: S13Takeaway },
  { id: "end-card", Component: S14EndCard },
];

/** A scene plays exactly from its start to its end; transitions hide the cut. */
const SceneSlot: React.FC<{ readonly id: SceneId; readonly children: React.ReactNode }> = ({ id, children }) => {
  const { fps } = useVideoConfig();
  const s = getScene(id);
  return (
    <Sequence name={id} from={s.startFrame} durationInFrames={s.endFrame - s.startFrame} premountFor={fps}>
      {children}
    </Sequence>
  );
};

/** Frames a paper sheet takes to cross the frame; it fully covers it at the cut. */
export const SHEET_FRAMES = 24;
const SHEET_W = 2300;
const SHEET = paperRect(0, -60, SHEET_W, 1200, { seed: 900, torn: "ends" });

/** A large navy paper sheet slides across the frame, covering the cut between two scenes. */
export const SheetWipe: React.FC = () => {
  const frame = onTwos(useCurrentFrame());
  // Left edge travels from off-frame right to off-frame left; at the midpoint the sheet covers everything.
  const t = ramp(frame, 0, SHEET_FRAMES, EASE.inOut);
  const x = mix(1920 + 40, -SHEET_W - 40, t);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <PaperDefs />
        <g transform={`translate(${x} 0) rotate(-1.5)`}>
          <PaperShape d={SHEET} fill={THEME.ink} depth={2.4} shadowOpacity={THEME.shadow} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

type Video02Props = {
  /** Leave the voiceover and sound out (QA frame renders). */
  readonly muted?: boolean;
};

export const Video02: React.FC<Video02Props> = ({ muted = false }) => {
  const { fps } = useVideoConfig();
  return (
    <PaperBackground board={THEME.board} ink={THEME.ink}>
      <InVideo02.Provider value>
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

        {/* A sheet wipe at every cut between scenes */}
        {TIMELINE.scenes.slice(1).map((s) => (
          <Sequence key={s.id} name={`Wipe into ${s.id}`} from={s.startFrame - SHEET_FRAMES / 2} durationInFrames={SHEET_FRAMES}>
            <SheetWipe />
          </Sequence>
        ))}
      </InVideo02.Provider>
    </PaperBackground>
  );
};
