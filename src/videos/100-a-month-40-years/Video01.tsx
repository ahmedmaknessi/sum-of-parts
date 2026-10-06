import { Audio } from "@remotion/media";
import type React from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASE } from "../../brand/tokens";
import { Background } from "../../components";
import { ramp } from "../../lib/motion";
import { MattressChip } from "./parts/MattressBar";
import { InVideo01 } from "./SceneRoot";
import { S01Hook } from "./scenes/S01Hook";
import { S02Logo } from "./scenes/S02Logo";
import { S03Rules } from "./scenes/S03Rules";
import { S04Mattress } from "./scenes/S04Mattress";
import { S05Compounding } from "./scenes/S05Compounding";
import { S06Why7 } from "./scenes/S06Why7";
import { S07Curve } from "./scenes/S07Curve";
import { S08Decades } from "./scenes/S08Decades";
import { S09TippingPoint } from "./scenes/S09TippingPoint";
import { S10CostOfWaiting } from "./scenes/S10CostOfWaiting";
import { S11WhereItCameFrom } from "./scenes/S11WhereItCameFrom";
import { S12FinePrint } from "./scenes/S12FinePrint";
import { S13Takeaway } from "./scenes/S13Takeaway";
import { S14EndCard } from "./scenes/S14EndCard";
import MIX from "./audio-mix.json";
import {
  getScene,
  slotDuration,
  TIMELINE,
  TRANSITION_FRAMES,
  type SceneId,
} from "./timeline";

const [VOICE_1, VOICE_2] = TIMELINE.audioSegments;
/**
 * Voiceover loudness (scripts/mix-audio.ts): played from the peak-safe copy of
 * the voiceover with the measured gain, so it lands at about -16 LUFS.
 * Same length as the source mp3, so the timeline's frame cuts apply unchanged.
 */
const VOICE_FILE = staticFile(MIX.file);
const VOICE_VOLUME = MIX.voiceVolume;

type FadeProps = {
  readonly id: SceneId;
  /** Frames to fade in from the scene start (0 = no fade). */
  readonly fadeIn: number;
  /** Frames to fade out after the scene end (cross-fade into the next scene). */
  readonly fadeOut: number;
  readonly children: React.ReactNode;
};

/** Fades a scene in at its start and out across the cross-fade after its end. */
const SlotFade: React.FC<FadeProps> = ({ id, fadeIn, fadeOut, children }) => {
  const frame = useCurrentFrame();
  const s = getScene(id);
  const end = s.endFrame - s.startFrame;
  const opacity =
    (fadeIn > 0 ? ramp(frame, 0, fadeIn, EASE.inOut) : 1) *
    (1 - ramp(frame, end, fadeOut, EASE.inOut));
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** One scene, placed by timeline.json. Cross-fades default to TRANSITION_FRAMES. */
const SceneSlot: React.FC<{
  readonly id: SceneId;
  readonly fadeIn?: number;
  readonly fadeOut?: number;
  readonly children: React.ReactNode;
}> = ({
  id,
  fadeIn = TRANSITION_FRAMES,
  fadeOut = TRANSITION_FRAMES,
  children,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence
      name={id}
      from={getScene(id).startFrame}
      durationInFrames={slotDuration(id)}
      premountFor={fps}
    >
      <SlotFade id={id} fadeIn={fadeIn} fadeOut={fadeOut}>
        {children}
      </SlotFade>
    </Sequence>
  );
};

/** Scene 05 ends on a "hard cut-like" transition: a 4-frame dissolve instead of 10. */
const QUICK_CUT_FRAMES = 4;

/** An element that stays on screen across several scenes, fading out at the end. */
const Overlay: React.FC<{
  readonly name: string;
  readonly from: number;
  readonly to: number;
  readonly children: React.ReactNode;
}> = ({ name, from, to, children }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence
      name={name}
      from={from}
      durationInFrames={to - from + TRANSITION_FRAMES}
      premountFor={fps}
    >
      <OverlayFade end={to - from}>{children}</OverlayFade>
    </Sequence>
  );
};

const OverlayFade: React.FC<{
  readonly end: number;
  readonly children: React.ReactNode;
}> = ({ end, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ opacity: 1 - ramp(frame, end, TRANSITION_FRAMES, EASE.inOut) }}
    >
      {children}
    </AbsoluteFill>
  );
};

type Video01Props = {
  /** Leave the voiceover out (QA frame renders: sparse image sequences can't mix audio). */
  readonly muted?: boolean;
};

export const Video01: React.FC<Video01Props> = ({ muted = false }) => {
  const { fps } = useVideoConfig();
  return (
    <Background>
      <InVideo01.Provider value>
        {muted ? null : (
          <>
            <Audio
              name="Voiceover, scene 1"
              src={VOICE_FILE}
              volume={VOICE_VOLUME}
              from={VOICE_1.atFrame}
              trimBefore={VOICE_1.fromFrame}
              durationInFrames={VOICE_1.toFrame - VOICE_1.fromFrame}
              premountFor={fps}
            />
            <Audio
              name="Voiceover, scenes 3 to 13"
              src={VOICE_FILE}
              volume={VOICE_VOLUME}
              from={VOICE_2.atFrame}
              trimBefore={VOICE_2.fromFrame}
              durationInFrames={VOICE_2.toFrame - VOICE_2.fromFrame}
              premountFor={fps}
            />
          </>
        )}

        <SceneSlot id="s01-hook" fadeIn={0}>
          <S01Hook />
        </SceneSlot>
        <SceneSlot id="s02-logo">
          <S02Logo />
        </SceneSlot>
        <SceneSlot id="s03-rules">
          <S03Rules />
        </SceneSlot>
        <SceneSlot id="s04-mattress">
          <S04Mattress />
        </SceneSlot>
        <SceneSlot id="s05-compounding" fadeOut={QUICK_CUT_FRAMES}>
          <S05Compounding />
        </SceneSlot>
        <SceneSlot id="s06-why-7" fadeIn={QUICK_CUT_FRAMES}>
          <S06Why7 />
        </SceneSlot>
        <SceneSlot id="s07-curve">
          <S07Curve />
        </SceneSlot>
        <SceneSlot id="s08-decades">
          <S08Decades />
        </SceneSlot>
        <SceneSlot id="s09-tipping-point">
          <S09TippingPoint />
        </SceneSlot>
        <SceneSlot id="s10-cost-of-waiting">
          <S10CostOfWaiting />
        </SceneSlot>
        <SceneSlot id="s11-where-it-came-from">
          <S11WhereItCameFrom />
        </SceneSlot>
        <SceneSlot id="s12-fine-print">
          <S12FinePrint />
        </SceneSlot>
        <SceneSlot id="s13-takeaway">
          <S13Takeaway />
        </SceneSlot>
        <SceneSlot id="end-card">
          <S14EndCard />
        </SceneSlot>

        <Overlay
          name="Baseline chip"
          from={getScene("s04-mattress").endFrame}
          to={getScene("s06-why-7").endFrame}
        >
          <MattressChip />
        </Overlay>
      </InVideo01.Provider>
    </Background>
  );
};
