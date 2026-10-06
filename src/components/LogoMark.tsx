import type React from "react";
import { COLORS } from "../brand/tokens";
import { mix } from "../lib/motion";

/** Radius of the mark in its own SVG units. */
const R = 100;
/** Distance each slice sits from the center, creating the thin gaps. */
const GAP_OFFSET = 5;
/** Extra outward pull of the amber slice when fully pulled. */
const PULL_OFFSET = 16;
/** How far slices start from the center before they assemble. */
const ASSEMBLE_OFFSET = 70;
/**
 * Proportions of the mark relative to its radius, for anything that has to
 * land exactly on the logo (e.g. a pie chart morphing into it).
 */
export const LOGO_PROPORTIONS = {
  /** Each slice sits this far (x radius) from the center, creating the gaps. */
  gap: GAP_OFFSET / R,
  /** Extra outward pull of the amber slice (x radius). */
  pull: PULL_OFFSET / R,
} as const;

/** Viewbox half-size, leaves room for the pulled slice. */
const VIEW = R + PULL_OFFSET + GAP_OFFSET + 6;

type Slice = {
  readonly startDeg: number;
  readonly color: string;
};

// Clockwise from top-left. SVG angles: 0deg points right, 90deg points down.
const SLICES: readonly Slice[] = [
  { startDeg: 180, color: COLORS.primary }, // top-left
  { startDeg: 270, color: COLORS.accent }, // top-right, the highlighted part
  { startDeg: 0, color: COLORS.primary }, // bottom-right
  { startDeg: 90, color: COLORS.primary }, // bottom-left
];

const AMBER_INDEX = 1;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const slicePath = (startDeg: number): string => {
  const a1 = toRad(startDeg);
  const a2 = toRad(startDeg + 90);
  const x1 = R * Math.cos(a1);
  const y1 = R * Math.sin(a1);
  const x2 = R * Math.cos(a2);
  const y2 = R * Math.sin(a2);
  return `M 0 0 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
};

export type SliceProgress = readonly [number, number, number, number];

type LogoMarkProps = {
  /** Rendered width and height in px. */
  readonly size: number;
  /** 0 to 1 per slice (clockwise from top-left). 0 = far out and invisible. */
  readonly sliceProgress?: SliceProgress;
  /** 0 to 1, how far the amber slice is pulled out. */
  readonly pullProgress?: number;
  /** Rotation of the whole mark in degrees. */
  readonly rotation?: number;
  readonly style?: React.CSSProperties;
};

/**
 * The Sum of Parts mark: a circle cut into four quarter slices with thin gaps.
 * Three cream, the top-right one amber and pulled outward diagonally.
 * Static by default; drive the progress props to animate it.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({
  size,
  sliceProgress = [1, 1, 1, 1],
  pullProgress = 1,
  rotation = 0,
  style,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
      style={style}
    >
      <g transform={`rotate(${rotation})`}>
        {SLICES.map((slice, i) => {
          const p = sliceProgress[i];
          const mid = toRad(slice.startDeg + 45);
          const pull = i === AMBER_INDEX ? PULL_OFFSET * pullProgress : 0;
          const distance = GAP_OFFSET + pull + mix(ASSEMBLE_OFFSET, 0, p);
          return (
            <path
              key={slice.startDeg}
              d={slicePath(slice.startDeg)}
              fill={slice.color}
              opacity={p}
              transform={`translate(${distance * Math.cos(mid)} ${distance * Math.sin(mid)})`}
            />
          );
        })}
      </g>
    </svg>
  );
};
