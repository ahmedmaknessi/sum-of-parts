import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import {
  COLORS,
  DURATION,
  EASE,
  FONT,
  SAFE_AREA,
  SPACE,
  STROKE,
  TEXT_OPACITY,
  TYPE,
} from "../brand/tokens";
import { mix, progress } from "../lib/motion";
import { LogoMark } from "./LogoMark";

type EndCardProps = {
  readonly subscribeTitle?: string;
  readonly subscribePrompt?: string;
  /** Small labels above the two video slots. */
  readonly leftLabel?: string;
  readonly rightLabel?: string;
  readonly style?: React.CSSProperties;
};

/**
 * Where YouTube end screen elements should be placed, in px of the 1920x1080
 * frame. Line the YouTube Studio end screen editor up with these.
 */
export const END_CARD_LAYOUT = {
  subscribe: { x: SAFE_AREA.x, y: 128, size: 160 },
  slots: [
    { x: SAFE_AREA.x, y: 480, width: 792, height: 446 },
    { x: SAFE_AREA.x + 792 + 80, y: 480, width: 792, height: 446 },
  ],
} as const;

const SLOT_LABEL_GAP = 24;

const EndCardInner: React.FC<EndCardProps> = ({
  subscribeTitle = "Subscribe",
  subscribePrompt = "One money question, answered with data.",
  leftLabel = "Watch next",
  rightLabel = "You might also like",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { subscribe, slots } = END_CARD_LAYOUT;

  const logoIn = progress(frame, fps, { duration: DURATION.base });
  const textIn = progress(frame, fps, { start: 0.15, duration: DURATION.base });
  const slotIn = (i: number) =>
    progress(frame, fps, {
      start: 0.4 + i * DURATION.stagger * 2,
      duration: DURATION.slow,
      easing: EASE.inOut,
    });
  const labels = [leftLabel, rightLabel];

  return (
    <AbsoluteFill
      style={{ fontFamily: FONT.family, color: COLORS.primary, ...style }}
    >
      {/* Subscribe row */}
      <div
        style={{
          position: "absolute",
          left: subscribe.x,
          top: subscribe.y,
          height: subscribe.size,
          display: "flex",
          alignItems: "center",
          gap: SPACE.lg - SPACE.sm,
        }}
      >
        <LogoMark
          size={subscribe.size}
          style={{ opacity: logoIn, scale: mix(0.9, 1, logoIn) }}
        />
        <div
          style={{
            opacity: textIn,
            translate: `${mix(-16, 0, textIn)}px 0px`,
          }}
        >
          <div
            style={{
              fontSize: TYPE.h2,
              fontWeight: FONT.weight.heading,
              lineHeight: 1.05,
            }}
          >
            {subscribeTitle}
          </div>
          <div
            style={{
              marginTop: SPACE.xs,
              fontSize: TYPE.label + 4,
              opacity: TEXT_OPACITY.secondary,
            }}
          >
            {subscribePrompt}
          </div>
        </div>
      </div>

      {/* Two video slots, left empty for YouTube end screen elements */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        {slots.map((slot, i) => {
          const p = slotIn(i);
          return (
            <rect
              key={slot.x}
              x={slot.x}
              y={slot.y}
              width={slot.width}
              height={slot.height}
              fill={COLORS.muted}
              fillOpacity={p}
              stroke={COLORS.mutedStrong}
              strokeWidth={STROKE.hairline}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
              shapeRendering="crispEdges"
            />
          );
        })}
      </svg>
      {slots.map((slot, i) => {
        const p = slotIn(i);
        return (
          <div
            key={slot.x}
            style={{
              position: "absolute",
              left: slot.x,
              top: slot.y - SLOT_LABEL_GAP - TYPE.caption,
              fontSize: TYPE.caption,
              fontWeight: FONT.weight.heading,
              opacity: p * TEXT_OPACITY.secondary,
            }}
          >
            {labels[i]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const endCardSchema = {
  subscribeTitle: {
    type: "text-content",
    default: "Subscribe",
    description: "Subscribe title",
  },
  subscribePrompt: {
    type: "text-content",
    default: "One money question, answered with data.",
    description: "Subscribe prompt",
  },
  leftLabel: {
    type: "text-content",
    default: "Watch next",
    description: "Left slot label",
  },
  rightLabel: {
    type: "text-content",
    default: "You might also like",
    description: "Right slot label",
  },
} as const satisfies InteractivitySchema;

/** End card: subscribe prompt next to the logo, plus two slots for YouTube video suggestions. */
export const EndCard = Interactive.withSchema({
  Component: EndCardInner,
  componentName: "<EndCard>",
  schema: endCardSchema,
  wrapInSequence: true,
});
