import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { COLORS, EASE, FONT, TYPE } from "../brand/tokens";
import { mix, progress } from "../lib/motion";
import { LogoMark, type SliceProgress } from "./LogoMark";

type LogoIntroProps = {
  readonly channelName: string;
  /** Logo size in px. */
  readonly logoSize?: number;
  readonly style?: React.CSSProperties;
};

/** Timing in seconds. Total is about 3 seconds; hold frames after 2.4s. */
const T = {
  sliceStart: 0.1,
  sliceDuration: 0.7,
  sliceStagger: 0.1,
  pullStart: 1.05,
  pullDuration: 0.5,
  revealStart: 1.55,
  revealDuration: 0.8,
} as const;

/** Vertical distance the mark travels up to make room for the name. */
const LIFT = 90;

const LogoIntroInner: React.FC<LogoIntroProps> = ({
  channelName,
  logoSize = 260,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slice = (i: number) =>
    progress(frame, fps, {
      start: T.sliceStart + i * T.sliceStagger,
      duration: T.sliceDuration,
      easing: EASE.out,
    });
  const sliceProgress: SliceProgress = [slice(0), slice(1), slice(2), slice(3)];

  const assembleRotation = progress(frame, fps, {
    start: T.sliceStart,
    duration: T.sliceDuration + 3 * T.sliceStagger,
    easing: EASE.inOut,
  });

  const pull = progress(frame, fps, {
    start: T.pullStart,
    duration: T.pullDuration,
    easing: EASE.inOut,
  });

  const reveal = progress(frame, fps, {
    start: T.revealStart,
    duration: T.revealDuration,
    easing: EASE.inOut,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT.family,
        color: COLORS.primary,
        ...style,
      }}
    >
      <LogoMark
        size={logoSize}
        sliceProgress={sliceProgress}
        pullProgress={pull}
        rotation={mix(-45, 0, assembleRotation)}
        style={{ translate: `0px ${-LIFT * reveal}px` }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          marginTop: logoSize / 2 - LIFT + 40,
          fontSize: TYPE.h2,
          fontWeight: FONT.weight.heading,
          letterSpacing: "-0.01em",
          opacity: reveal,
          translate: `0px ${mix(24, 0, reveal)}px`,
        }}
      >
        {channelName}
      </div>
    </AbsoluteFill>
  );
};

const logoIntroSchema = {
  channelName: {
    type: "text-content",
    default: "Sum of Parts",
    description: "Channel name",
  },
  logoSize: {
    type: "number",
    default: 260,
    min: 80,
    max: 600,
    step: 1,
    description: "Logo size",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

/** Logo intro: the four slices assemble, the amber slice pulls out, the channel name fades in. About 3 seconds. */
export const LogoIntro = Interactive.withSchema({
  Component: LogoIntroInner,
  componentName: "<LogoIntro>",
  schema: logoIntroSchema,
  wrapInSequence: true,
});
