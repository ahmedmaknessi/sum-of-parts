/**
 * Sum of Parts brand tokens. The single source of truth for colors, type,
 * spacing, layout and motion. Never hardcode a hex value, font or easing curve
 * anywhere else: import it from here.
 */
import { loadFont } from "@remotion/google-fonts/Outfit";
import { Easing } from "remotion";

// ---------------------------------------------------------------------------
// Video format
// ---------------------------------------------------------------------------

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

export const COLORS = {
  /** Deep navy. Every frame sits on this. */
  background: "#10162B",
  /** Warm cream. Text and most shapes. */
  primary: "#F3EBDD",
  /** Amber. Highlights the ONE key thing in a scene. Use sparingly. */
  accent: "#F2A93B",
  /** Extra data series, only when a chart needs more than one. */
  teal: "#3FB8A0",
  blue: "#6C8CFF",
  coral: "#E9684B",
  /** Muted decoration: grid lines, faint chart marks. */
  muted: "#26314F",
  mutedStrong: "#3A4870",
} as const;

export type BrandColor = keyof typeof COLORS;

/**
 * Colors a data series may use, in the order they should be assigned.
 * Accent is deliberately excluded: it marks the highlighted value, not a series.
 */
export const SERIES_COLORS = {
  primary: COLORS.primary,
  teal: COLORS.teal,
  blue: COLORS.blue,
  coral: COLORS.coral,
} as const;

export type SeriesColor = keyof typeof SERIES_COLORS;

/**
 * Opacity steps for cream text. Secondary text is cream at reduced opacity,
 * never a new color.
 */
export const TEXT_OPACITY = {
  primary: 1,
  secondary: 0.72,
  tertiary: 0.5,
} as const;

/** Applies an alpha channel to a brand hex color. */
export const withAlpha = (hex: string, alpha: number): string => {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ---------------------------------------------------------------------------
// Background texture
// ---------------------------------------------------------------------------

export const GRID = {
  spacing: 64,
  lineWidth: 1,
  color: COLORS.primary,
  opacity: 0.045,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

const outfit = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export const FONT = {
  family: outfit.fontFamily,
  weight: {
    body: 500,
    heading: 700,
  },
} as const;

/** Type scale in px, tuned for 1920x1080 viewed on a phone as well as a TV. */
export const TYPE = {
  display: 200, // hero numbers
  h1: 112, // title card questions
  h2: 76, // scene headlines, channel name
  body: 52, // subtitles, supporting lines
  label: 38, // chart values, callout text
  caption: 36, // axis labels, sources. 36px is the smallest text allowed on screen
} as const;

// ---------------------------------------------------------------------------
// Spacing & layout
// ---------------------------------------------------------------------------

/** Spacing scale in px. Multiples of the 64px grid where it matters. */
export const SPACE = {
  xs: 8,
  sm: 16,
  md: 32,
  lg: 64,
  xl: 128,
} as const;

/** Keep all key content inside this inset from the frame edges. */
export const SAFE_AREA = {
  x: 128,
  y: 96,
} as const;

/** Stroke widths for lines, axes and outlines. */
export const STROKE = {
  hairline: 2,
  line: 4,
  bold: 6,
} as const;

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

/**
 * Easing curves. Smooth and calm: nothing overshoots or bounces.
 * - out: fast start, gentle settle. Default for things entering.
 * - inOut: symmetric. For things moving from A to B or drawing a path.
 * - spring: critically damped spring, no bounce.
 */
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  spring: Easing.spring({ damping: 200 }),
} as const;

/** Standard animation lengths in seconds. Multiply by fps at the call site. */
export const DURATION = {
  fast: 0.4,
  base: 0.8,
  slow: 1.4,
  /** Delay between items that enter one after another. */
  stagger: 0.12,
} as const;
