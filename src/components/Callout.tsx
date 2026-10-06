import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { COLORS, EASE, FONT, STROKE, TYPE } from "../brand/tokens";
import { mix, progress } from "../lib/motion";
import type { Point } from "./chart-layout";

export type CalloutDirection = "up-left" | "up-right" | "down-left" | "down-right";

type CalloutProps = {
  /** Point to annotate, in px. Use getBarAnchor() or getLinePoint() for charts. */
  readonly target: Point;
  readonly text: string;
  /** Which way the leader line leaves the target. */
  readonly direction?: CalloutDirection;
  /** Length of the diagonal part of the leader line, in px. */
  readonly length?: number;
  /** Draw a ring around the target. */
  readonly ring?: boolean;
  /** Amber when this callout marks the key thing, cream otherwise. */
  readonly accent?: boolean;
  readonly style?: React.CSSProperties;
};

const RING_RADIUS = 22;
/** Horizontal run of the leader line before the text. */
const SHELF = 64;
const TEXT_GAP = 20;
const TEXT_MAX_WIDTH = 560;

const T = {
  ringDuration: 0.4,
  lineStart: 0.15,
  lineDuration: 0.6,
  textStart: 0.55,
  textDuration: 0.6,
} as const;

const CalloutInner: React.FC<CalloutProps> = ({
  target,
  text,
  direction = "up-right",
  length = 140,
  ring = true,
  accent = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const sx = direction.endsWith("right") ? 1 : -1;
  const sy = direction.startsWith("up") ? -1 : 1;
  const diagonal = length / Math.SQRT2;
  const startOffset = ring ? (RING_RADIUS + 8) / Math.SQRT2 : 0;

  const start = { x: target.x + sx * startOffset, y: target.y + sy * startOffset };
  const elbow = { x: target.x + sx * diagonal, y: target.y + sy * diagonal };
  const end = { x: elbow.x + sx * SHELF, y: elbow.y };

  const color = accent ? COLORS.accent : COLORS.primary;

  const ringIn = progress(frame, fps, { duration: T.ringDuration });
  const lineIn = progress(frame, fps, {
    start: T.lineStart,
    duration: T.lineDuration,
    easing: EASE.inOut,
  });
  const textIn = progress(frame, fps, {
    start: T.textStart,
    duration: T.textDuration,
  });

  return (
    <AbsoluteFill
      style={{ fontFamily: FONT.family, color: COLORS.primary, ...style }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        {ring ? (
          <circle
            cx={target.x}
            cy={target.y}
            r={RING_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE.line}
            opacity={ringIn}
            style={{
              transformOrigin: `${target.x}px ${target.y}px`,
              scale: interpolate(ringIn, [0, 1], [0.4, 1], {
                output: "perceptual-scale",
              }),
            }}
          />
        ) : null}
        <path
          d={`M ${start.x} ${start.y} L ${elbow.x} ${elbow.y} L ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth={STROKE.hairline}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - lineIn}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: end.y,
          ...(sx === 1
            ? { left: end.x + TEXT_GAP }
            : { right: width - end.x + TEXT_GAP, textAlign: "right" }),
          maxWidth: TEXT_MAX_WIDTH,
          fontSize: TYPE.label,
          fontWeight: FONT.weight.body,
          lineHeight: 1.25,
          translate: `${mix(-12 * sx, 0, textIn)}px -50%`,
          opacity: textIn,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const calloutSchema = {
  text: { type: "text-content", default: "Look here", description: "Text" },
  direction: {
    type: "enum",
    default: "up-right",
    description: "Direction",
    variants: { "up-left": {}, "up-right": {}, "down-left": {}, "down-right": {} },
  },
  length: {
    type: "number",
    default: 140,
    min: 0,
    step: 1,
    description: "Leader length",
    hiddenFromList: false,
  },
  ring: { type: "boolean", default: true, description: "Ring around target" },
  accent: { type: "boolean", default: true, description: "Amber" },
} as const satisfies InteractivitySchema;

/** Callout: a ring on a target point, a leader line, and a short note. */
export const Callout = Interactive.withSchema({
  Component: CalloutInner,
  componentName: "<Callout>",
  schema: calloutSchema,
  wrapInSequence: true,
});
