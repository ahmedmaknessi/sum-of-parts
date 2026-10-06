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
  STROKE,
  TEXT_OPACITY,
  TYPE,
} from "../brand/tokens";
import { formatNumber, type NumberUnit } from "../lib/format";
import { progress } from "../lib/motion";
import {
  DEFAULT_CHART_FRAME,
  TITLE_GAP,
  type ChartFrame,
  type Point,
} from "./chart-layout";

export type BarDatum = {
  readonly label: string;
  readonly value: number;
  /** Draws this bar in amber. Use on one bar per chart. */
  readonly highlight?: boolean;
};

type BarChartProps = {
  /** Non-negative values, drawn left to right. */
  readonly data: readonly BarDatum[];
  readonly title?: string;
  readonly unit?: NumberUnit;
  readonly compact?: boolean;
  readonly decimals?: number;
  /** Top of the value scale. Defaults to the largest value. */
  readonly maxValue?: number;
  /** Plot area in px. Defaults to a centered frame. */
  readonly frame?: ChartFrame;
  readonly style?: React.CSSProperties;
};

/** Space reserved above the tallest bar for its value label. */
const VALUE_LABEL_SPACE = 72;
const MAX_BAR_WIDTH = 200;
const BAR_WIDTH_RATIO = 0.62;

const T = {
  axisDuration: 0.6,
  barsStart: 0.35,
  barDuration: 0.9,
} as const;

type BarGeometry = {
  readonly x: number;
  readonly centerX: number;
  readonly width: number;
  readonly top: number;
  readonly height: number;
};

type GeometryInput = Pick<BarChartProps, "data" | "maxValue" | "frame">;

const getBarGeometry = ({
  data,
  maxValue,
  frame = DEFAULT_CHART_FRAME,
}: GeometryInput): BarGeometry[] => {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 0);
  const scaleMax = max > 0 ? max : 1;
  const baseline = frame.y + frame.height;
  const plotHeight = frame.height - VALUE_LABEL_SPACE;
  const band = frame.width / Math.max(data.length, 1);
  const width = Math.min(band * BAR_WIDTH_RATIO, MAX_BAR_WIDTH);

  return data.map((d, i) => {
    const height = (Math.max(d.value, 0) / scaleMax) * plotHeight;
    const x = frame.x + i * band + (band - width) / 2;
    return { x, centerX: x + width / 2, width, top: baseline - height, height };
  });
};

/**
 * A point on a bar for aiming a <Callout>.
 * "top": just above the value label. "right": the bar's right edge, near the top
 * (use this for tall bars, where "top" would run into the title).
 * Pass the same data, maxValue and frame you give the chart.
 */
export const getBarAnchor = (
  props: GeometryInput,
  index: number,
  side: "top" | "right" = "top",
): Point => {
  const bar = getBarGeometry(props)[index];
  if (side === "right") {
    return { x: bar.x + bar.width + 12, y: bar.top + Math.min(bar.height / 4, 64) };
  }
  return { x: bar.centerX, y: bar.top - VALUE_LABEL_SPACE };
};

const BarChartInner: React.FC<BarChartProps> = ({
  data,
  title,
  unit,
  compact,
  decimals,
  maxValue,
  frame = DEFAULT_CHART_FRAME,
  style,
}) => {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const bars = getBarGeometry({ data, maxValue, frame });
  const baseline = frame.y + frame.height;

  const titleIn = progress(currentFrame, fps, { duration: DURATION.base });
  const axisIn = progress(currentFrame, fps, {
    duration: T.axisDuration,
    easing: EASE.inOut,
  });

  return (
    <AbsoluteFill
      style={{ fontFamily: FONT.family, color: COLORS.primary, ...style }}
    >
      {title ? (
        <div
          style={{
            position: "absolute",
            left: frame.x,
            top: frame.y - TITLE_GAP - TYPE.body,
            fontSize: TYPE.body,
            fontWeight: FONT.weight.heading,
            opacity: titleIn,
          }}
        >
          {title}
        </div>
      ) : null}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <line
          x1={frame.x}
          x2={frame.x + frame.width * axisIn}
          y1={baseline + STROKE.hairline / 2}
          y2={baseline + STROKE.hairline / 2}
          stroke={COLORS.mutedStrong}
          strokeWidth={STROKE.hairline}
        />
        {data.map((d, i) => {
          const bar = bars[i];
          const p = progress(currentFrame, fps, {
            start: T.barsStart + i * DURATION.stagger,
            duration: T.barDuration,
            easing: EASE.out,
          });
          const barHeight = bar.height * p;
          const fill = d.highlight ? COLORS.accent : COLORS.primary;
          return (
            <g key={d.label}>
              <rect
                x={bar.x}
                y={baseline - barHeight}
                width={bar.width}
                height={barHeight}
                fill={fill}
                shapeRendering="crispEdges"
              />
              <text
                x={bar.centerX}
                y={baseline - barHeight - 20}
                textAnchor="middle"
                fontSize={TYPE.label}
                fontWeight={FONT.weight.heading}
                fill={d.highlight ? COLORS.accent : COLORS.primary}
                opacity={p}
              >
                {formatNumber(d.value * p, { unit, compact, decimals })}
              </text>
              <text
                x={bar.centerX}
                y={baseline + 56}
                textAnchor="middle"
                fontSize={TYPE.caption}
                fill={COLORS.primary}
                opacity={
                  p * (d.highlight ? TEXT_OPACITY.primary : TEXT_OPACITY.secondary)
                }
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const barChartSchema = {
  title: { type: "text-content", default: "", description: "Title" },
  unit: {
    type: "enum",
    default: "none",
    description: "Unit",
    variants: { none: {}, currency: {}, percent: {} },
  },
  compact: { type: "boolean", default: false, description: "Compact (1.2M)" },
} as const satisfies InteractivitySchema;

/** Bar chart that draws itself in. Bars marked `highlight` are amber. */
export const BarChart = Interactive.withSchema({
  Component: BarChartInner,
  componentName: "<BarChart>",
  schema: barChartSchema,
  wrapInSequence: true,
});
