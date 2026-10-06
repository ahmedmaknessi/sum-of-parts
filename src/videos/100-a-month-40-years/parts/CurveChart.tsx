/**
 * Shared chart frame for Scenes 07, 10 and 12: same axes, same scale, so the
 * curve feels continuous across the video. Values come from data.ts.
 */
import type React from "react";
import { useId } from "react";
import { COLORS, FONT, STROKE, TEXT_OPACITY, TYPE } from "../../../brand/tokens";
import { DATA, LABELS } from "../data";

const YEARS = DATA.axis.years[DATA.axis.years.length - 1];

export type Plot = { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number };

/**
 * Default plot area in px (Scene 07). Left margin holds the value labels,
 * right margin the end labels. Scenes 10 and 12 may use a narrower frame:
 * the axes, ticks and scale stay the same.
 */
export const PLOT: Plot = { left: 300, right: 1620, top: 200, bottom: 840 };

export const xOfYear = (year: number, plot: Plot = PLOT) => plot.left + (year / YEARS) * (plot.right - plot.left);
export const yOfValue = (value: number, plot: Plot = PLOT) =>
  plot.bottom - (value / DATA.axis.maxValue) * (plot.bottom - plot.top);

/** SVG points for a monthly series (index = month). */
export const monthlyPoints = (values: readonly number[], fromMonth = 0, plot: Plot = PLOT): string =>
  values
    .map((v, month) =>
      month < fromMonth ? null : `${xOfYear(month / 12, plot).toFixed(2)},${yOfValue(v, plot).toFixed(2)}`,
    )
    .filter(Boolean)
    .join(" ");

/** Value of a monthly series at a fractional year (linear between months). */
export const valueAtYear = (values: readonly number[], year: number): number => {
  const m = Math.max(0, Math.min(values.length - 1, year * 12));
  const i = Math.floor(m);
  const t = m - i;
  return values[i] + (values[Math.min(i + 1, values.length - 1)] - values[i]) * t;
};

type AxesProps = {
  /** 0..1, axes and labels drawing in. */
  readonly progress: number;
  readonly plot?: Plot;
};

/** Grid, value labels and year labels. */
export const CurveAxes: React.FC<AxesProps> = ({ progress, plot = PLOT }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {DATA.axis.valueTicks.map((tick, i) => (
      <g key={tick} opacity={progress}>
        <line
          x1={plot.left}
          x2={plot.left + (plot.right - plot.left) * progress}
          y1={yOfValue(tick, plot)}
          y2={yOfValue(tick, plot)}
          stroke={i === 0 ? COLORS.mutedStrong : COLORS.muted}
          strokeWidth={STROKE.hairline}
        />
        <text
          x={plot.left - 28}
          y={yOfValue(tick, plot)}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={TYPE.caption}
          fontFamily={FONT.family}
          fill={COLORS.primary}
          opacity={0.6}
        >
          {LABELS.valueTicks[i]}
        </text>
      </g>
    ))}
    {DATA.axis.years.map((year, i) => (
      <text
        key={year}
        x={xOfYear(year, plot)}
        y={plot.bottom + 56}
        textAnchor={i === 0 ? "start" : "middle"}
        fontSize={TYPE.caption}
        fontFamily={FONT.family}
        fill={COLORS.primary}
        opacity={0.6 * progress}
      >
        {i === 0 ? `Year ${year}` : year}
      </text>
    ))}
  </svg>
);

type CurveLineProps = {
  readonly values: readonly number[];
  readonly color: string;
  readonly width: number;
  readonly opacity?: number;
  /** Draw up to this year (fractional). */
  readonly toYear: number;
  /** Start drawing from this month (late start). */
  readonly fromMonth?: number;
  readonly dashed?: boolean;
  readonly plot?: Plot;
};

/** A monthly series drawn left to right up to `toYear`. */
export const CurveLine: React.FC<CurveLineProps> = ({
  values,
  color,
  width,
  opacity = 1,
  toYear,
  fromMonth = 0,
  dashed = false,
  plot = PLOT,
}) => {
  const clipId = `curve-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <clipPath id={clipId}>
          {/* Clip exactly at the head: the head dot covers the end, no stray round cap past it. */}
          <rect x={0} y={0} width={xOfYear(toYear, plot)} height={1080} />
        </clipPath>
      </defs>
      <polyline
        points={monthlyPoints(values, fromMonth, plot)}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeOpacity={opacity}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={dashed ? "16 14" : undefined}
        clipPath={`url(#${clipId})`}
        style={{ display: toYear * 12 > fromMonth ? undefined : "none" }}
      />
    </svg>
  );
};

/** Label to the right of the plot, at a line's end value. */
export const EndLabel: React.FC<{
  readonly value: number;
  readonly children: React.ReactNode;
  readonly opacity: number;
  readonly color?: string;
  readonly plot?: Plot;
}> = ({ value, children, opacity, color = COLORS.primary, plot = PLOT }) => (
  <div
    style={{
      position: "absolute",
      left: plot.right + 28,
      top: yOfValue(value, plot) - 22,
      fontSize: 40,
      fontWeight: FONT.weight.heading,
      lineHeight: "44px",
      color,
      opacity: opacity * (color === COLORS.primary ? TEXT_OPACITY.secondary : 1),
    }}
  >
    {children}
  </div>
);
