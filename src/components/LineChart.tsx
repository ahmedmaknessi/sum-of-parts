import type React from "react";
import { useId } from "react";
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
  SERIES_COLORS,
  STROKE,
  TEXT_OPACITY,
  TYPE,
  type SeriesColor,
} from "../brand/tokens";
import { formatNumber, type NumberUnit } from "../lib/format";
import { progress } from "../lib/motion";
import { linearScale, niceDomain } from "../lib/scale";
import {
  DEFAULT_CHART_FRAME,
  TITLE_GAP,
  type ChartFrame,
  type Point,
} from "./chart-layout";

export type LineSeries = {
  /** Shown at the end of the line when there is more than one series. */
  readonly label: string;
  /** One value per x label. */
  readonly values: readonly number[];
  /** Defaults to the next series color in brand order. */
  readonly color?: SeriesColor;
};

export type LineHighlight = {
  readonly series: number;
  readonly index: number;
};

type LineChartProps = {
  /** X-axis labels, e.g. years. */
  readonly labels: readonly string[];
  readonly series: readonly LineSeries[];
  /** The one point to mark in amber, with its value. */
  readonly highlight?: LineHighlight;
  readonly title?: string;
  readonly unit?: NumberUnit;
  readonly compact?: boolean;
  readonly decimals?: number;
  /** Value scale bounds. Default: 0 (or the data minimum, if negative) to a round number above the maximum. */
  readonly minValue?: number;
  readonly maxValue?: number;
  /** Show every Nth x label. Defaults to about six labels. */
  readonly xLabelEvery?: number;
  /** Seconds the lines take to draw. */
  readonly drawDuration?: number;
  /** Plot area in px. Defaults to a centered frame. */
  readonly frame?: ChartFrame;
  readonly style?: React.CSSProperties;
};

const SERIES_ORDER: readonly SeriesColor[] = ["primary", "teal", "blue", "coral"];

/** Space on the left for y tick labels. */
const Y_LABEL_GUTTER = 128;
/** Space on the right for end-of-line series labels. */
const SERIES_LABEL_GUTTER = 260;
/** Minimum vertical distance between end-of-line labels. */
const SERIES_LABEL_MIN_GAP = 44;
const POINT_RADIUS = 11;
/** Distance from the last point to its series label, clears a highlight ring. */
const SERIES_LABEL_OFFSET = 44;

const T = {
  gridDuration: 0.6,
  drawStart: 0.4,
} as const;

type GeometryInput = Pick<
  LineChartProps,
  "labels" | "series" | "minValue" | "maxValue" | "frame"
>;

const getLineGeometry = ({
  labels,
  series,
  minValue,
  maxValue,
  frame = DEFAULT_CHART_FRAME,
}: GeometryInput) => {
  const all = series.flatMap((s) => s.values);
  const dataMin = Math.min(...all, 0);
  const dataMax = Math.max(...all);
  const domain = niceDomain(minValue ?? dataMin, maxValue ?? dataMax, 4);
  const min = minValue ?? domain.min;
  const max = maxValue ?? domain.max;
  const ticks = domain.ticks.filter((t) => t >= min && t <= max);

  const rightGutter = series.length > 1 ? SERIES_LABEL_GUTTER : 48;
  const plot = {
    left: frame.x + Y_LABEL_GUTTER,
    right: frame.x + frame.width - rightGutter,
    top: frame.y,
    bottom: frame.y + frame.height,
  };
  const x = linearScale([0, Math.max(labels.length - 1, 1)], [plot.left, plot.right]);
  const y = linearScale([min, max], [plot.bottom, plot.top]);

  return { plot, ticks, x, y };
};

/**
 * Position of one data point, for aiming a <Callout>.
 * Pass the same labels, series, min/max and frame you give the chart.
 */
export const getLinePoint = (
  props: GeometryInput,
  seriesIndex: number,
  index: number,
): Point => {
  const { x, y } = getLineGeometry(props);
  return { x: x(index), y: y(props.series[seriesIndex].values[index]) };
};

/** Pushes end-of-line labels apart so they never overlap. */
const spreadLabels = (ys: readonly number[]): number[] => {
  const order = ys.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value);
  const placed = [...ys];
  let previous = -Infinity;
  for (const { value, i } of order) {
    const next = Math.max(value, previous + SERIES_LABEL_MIN_GAP);
    placed[i] = next;
    previous = next;
  }
  return placed;
};

const LineChartInner: React.FC<LineChartProps> = ({
  labels,
  series,
  highlight,
  title,
  unit,
  compact,
  decimals,
  minValue,
  maxValue,
  xLabelEvery,
  drawDuration = 2.5,
  frame = DEFAULT_CHART_FRAME,
  style,
}) => {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // Unique per instance so two charts on screen never share a clip path.
  const clipId = `line-reveal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { plot, ticks, x, y } = getLineGeometry({
    labels,
    series,
    minValue,
    maxValue,
    frame,
  });
  const format = { unit, compact, decimals };
  const lastIndex = labels.length - 1;
  const every = xLabelEvery ?? Math.max(1, Math.ceil(labels.length / 6));

  const gridIn = progress(currentFrame, fps, {
    duration: T.gridDuration,
    easing: EASE.inOut,
  });
  const draw = progress(currentFrame, fps, {
    start: T.drawStart,
    duration: drawDuration,
    easing: EASE.inOut,
  });
  const revealX = plot.left + (plot.right - plot.left) * draw;
  const endIn = progress(currentFrame, fps, {
    start: T.drawStart + drawDuration * 0.9,
    duration: DURATION.base,
  });

  const highlightPoint =
    highlight !== undefined
      ? {
          x: x(highlight.index),
          y: y(series[highlight.series].values[highlight.index]),
          value: series[highlight.series].values[highlight.index],
        }
      : null;
  // The highlight appears once the line has drawn past it.
  const highlightReached =
    highlight !== undefined
      ? progress(currentFrame, fps, {
          start: T.drawStart + drawDuration * (highlight.index / Math.max(lastIndex, 1)),
          duration: DURATION.fast,
        })
      : 0;

  const endLabelYs = spreadLabels(series.map((s) => y(s.values[lastIndex])));

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
            opacity: gridIn,
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
        <defs>
          <clipPath id={clipId}>
            <rect
              x={0}
              y={0}
              width={revealX + STROKE.line}
              height={height}
            />
          </clipPath>
        </defs>

        {/* Grid and y tick labels */}
        <g opacity={gridIn}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={plot.left}
                x2={plot.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={tick === ticks[0] ? COLORS.mutedStrong : COLORS.muted}
                strokeWidth={STROKE.hairline}
              />
              <text
                x={plot.left - 24}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={TYPE.caption}
                fill={COLORS.primary}
                opacity={TEXT_OPACITY.tertiary}
              >
                {formatNumber(tick, { ...format, trimZeros: true })}
              </text>
            </g>
          ))}
        </g>

        {/* X labels */}
        <g opacity={gridIn}>
          {labels.map((label, i) =>
            i % every === 0 ? (
              <text
                key={label}
                x={x(i)}
                y={plot.bottom + 52}
                textAnchor="middle"
                fontSize={TYPE.caption}
                fill={COLORS.primary}
                opacity={TEXT_OPACITY.secondary}
              >
                {label}
              </text>
            ) : null,
          )}
        </g>

        {/* Lines */}
        <g clipPath={`url(#${clipId})`}>
          {series.map((s, si) => (
            <polyline
              key={s.label}
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={SERIES_COLORS[s.color ?? SERIES_ORDER[si % SERIES_ORDER.length]]}
              strokeWidth={STROKE.line}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* End-of-line series labels (only needed with several lines) */}
        {series.length > 1
          ? series.map((s, si) => (
              <text
                key={s.label}
                x={plot.right + SERIES_LABEL_OFFSET}
                y={endLabelYs[si]}
                dominantBaseline="middle"
                fontSize={TYPE.caption}
                fontWeight={FONT.weight.heading}
                fill={COLORS.primary}
                opacity={endIn * TEXT_OPACITY.secondary}
              >
                {s.label}
              </text>
            ))
          : null}

        {/* Highlighted point */}
        {highlightPoint ? (
          <g opacity={highlightReached}>
            <circle
              cx={highlightPoint.x}
              cy={highlightPoint.y}
              r={POINT_RADIUS * highlightReached}
              fill={COLORS.accent}
              stroke={COLORS.background}
              strokeWidth={STROKE.line}
            />
            <text
              x={highlightPoint.x}
              y={highlightPoint.y - 36}
              textAnchor="middle"
              fontSize={TYPE.label}
              fontWeight={FONT.weight.heading}
              fill={COLORS.accent}
            >
              {formatNumber(highlightPoint.value, format)}
            </text>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

const lineChartSchema = {
  title: { type: "text-content", default: "", description: "Title" },
  unit: {
    type: "enum",
    default: "none",
    description: "Unit",
    variants: { none: {}, currency: {}, percent: {} },
  },
  compact: { type: "boolean", default: false, description: "Compact (1.2M)" },
  drawDuration: {
    type: "number",
    default: 2.5,
    min: 0.2,
    step: 0.1,
    description: "Draw duration (s)",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

/** Line chart that draws itself left to right. One highlighted point is amber. */
export const LineChart = Interactive.withSchema({
  Component: LineChartInner,
  componentName: "<LineChart>",
  schema: lineChartSchema,
  wrapInSequence: true,
});
