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
  SPACE,
  TEXT_OPACITY,
  TYPE,
} from "../brand/tokens";
import { formatNumber, type NumberUnit } from "../lib/format";
import { mix, progress } from "../lib/motion";
import { TabularNumber } from "./TabularNumber";

type NumberCounterProps = {
  /** The number to land on. For percent, pass 7 for 7%. */
  readonly value: number;
  /** The number to count up from. */
  readonly startValue?: number;
  readonly unit?: NumberUnit;
  /** Abbreviate: 1200000 -> 1.2M. */
  readonly compact?: boolean;
  /** Digits after the decimal point. Defaults to 1 when compact, else 0. */
  readonly decimals?: number;
  /** Line of context under the number. */
  readonly label?: string;
  /** Amber when this is the key number of the scene, cream otherwise. */
  readonly highlight?: boolean;
  /** Seconds the count takes. */
  readonly countDuration?: number;
  /** Font size of the number in px. */
  readonly fontSize?: number;
  readonly style?: React.CSSProperties;
};

const NumberCounterInner: React.FC<NumberCounterProps> = ({
  value,
  startValue = 0,
  unit = "none",
  compact = false,
  decimals,
  label,
  highlight = true,
  countDuration = 2,
  fontSize = TYPE.display,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = progress(frame, fps, { duration: DURATION.fast });
  const count = progress(frame, fps, {
    start: 0.1,
    duration: countDuration,
    easing: EASE.out,
  });
  const labelIn = progress(frame, fps, {
    start: 0.4,
    duration: DURATION.base,
  });

  const text = formatNumber(mix(startValue, value, count), {
    unit,
    compact,
    decimals,
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
      <div
        style={{
          fontSize,
          fontWeight: FONT.weight.heading,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: highlight ? COLORS.accent : COLORS.primary,
          opacity: appear,
          translate: `0px ${mix(24, 0, appear)}px`,
          whiteSpace: "nowrap",
        }}
      >
        <TabularNumber text={text} />
      </div>
      {label ? (
        <div
          style={{
            maxWidth: 1200,
            marginTop: SPACE.md,
            fontSize: TYPE.body,
            fontWeight: FONT.weight.body,
            lineHeight: 1.3,
            textAlign: "center",
            opacity: labelIn * TEXT_OPACITY.secondary,
            translate: `0px ${mix(16, 0, labelIn)}px`,
          }}
        >
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const numberCounterSchema = {
  value: {
    type: "number",
    default: 1000,
    step: 1,
    description: "Value",
    hiddenFromList: false,
  },
  startValue: {
    type: "number",
    default: 0,
    step: 1,
    description: "Start value",
    hiddenFromList: false,
  },
  unit: {
    type: "enum",
    default: "none",
    description: "Unit",
    variants: { none: {}, currency: {}, percent: {} },
  },
  compact: { type: "boolean", default: false, description: "Compact (1.2M)" },
  label: { type: "text-content", default: "", description: "Label" },
  highlight: { type: "boolean", default: true, description: "Amber" },
  countDuration: {
    type: "number",
    default: 2,
    min: 0.1,
    step: 0.1,
    description: "Count duration (s)",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

/** Animated number counter. Counts up to a value with $, %, and 1.2M-style formatting. */
export const NumberCounter = Interactive.withSchema({
  Component: NumberCounterInner,
  componentName: "<NumberCounter>",
  schema: numberCounterSchema,
  wrapInSequence: true,
});
