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

/**
 * Vertical Shorts (9:16). `safe` keeps content clear of the Shorts player UI:
 * the top bar, the title / channel / subscribe block at the bottom, and the
 * like / comment buttons along the right edge.
 */
export const SHORT = {
  width: 1080,
  height: 1920,
  fps: 30,
  safe: { top: 160, bottom: 480, x: 64 },
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

/** Mixes two brand hex colors: t = 0 gives `a`, t = 1 gives `b`. */
export const mixHex = (a: string, b: string, t: number): string => {
  const ch = (hex: string, i: number) => parseInt(hex.replace("#", "").slice(i * 2, i * 2 + 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};

/**
 * Paper world palette (papercut style): the colours of objects and
 * landscapes. Vivid but grown-up. NEVER for data highlights (that is
 * amber's job) and never for chart series (SERIES_COLORS). Each hue comes in
 * three tones for layering: `light` (mixed toward cream, far layers), `base`,
 * and `dark` (mixed toward navy, near layers and shaded sides).
 */
const PAPER_BASE = {
  /** Banknotes, growth, wealth. */
  green: "#2E9E6B",
  /** Hills, plants, fresh starts. */
  leaf: "#8DC85A",
  /** Sky, water, buildings, banks. */
  sky: "#4DA3E3",
  /** Night, luxury, the unknown. */
  plum: "#7E5BB0",
  /** Warmth, people's things, soft emphasis in the world (not data). */
  rose: "#EE8597",
  /** Cardboard, envelopes, boxes, the desk. */
  kraft: "#C78B4E",
} as const;

export type PaperHue = keyof typeof PAPER_BASE;

export const PAPER_COLORS = Object.fromEntries(
  Object.entries(PAPER_BASE).map(([hue, base]) => [
    hue,
    {
      light: mixHex(base, COLORS.primary, 0.5),
      base,
      dark: mixHex(base, COLORS.background, 0.38),
    },
  ]),
) as Record<PaperHue, { readonly light: string; readonly base: string; readonly dark: string }>;

// ---------------------------------------------------------------------------
// Background texture
// ---------------------------------------------------------------------------

export const GRID = {
  spacing: 64,
  lineWidth: 1,
  color: COLORS.primary,
  opacity: 0.045,
} as const;

/**
 * Papercut style (video 02 on). One light, top left: every card casts one
 * soft shadow down and to the right, longer the higher it sits (depth 1 =
 * lying on the board, 3 = lifted). Only the paper world uses these; numbers
 * and chart marks stay crisp.
 */
export const PAPER = {
  shadow: {
    /**
     * Offset and blur per depth step, in px. Depth 1 (a piece lying on the
     * board) casts a 6px / 12px-blur shadow; depth 2 to 2.3 (lifted, top
     * layers) reaches 12 to 14px / 24 to 28px blur.
     */
    x: 3.5,
    y: 6,
    blur: 12,
    /** Shadows are the one non-palette tone: black at this opacity, darker than the navy board. */
    color: "#000000",
    opacity: 0.35,
    /** On a light (cream) board, where black reads stronger. */
    opacityOnLight: 0.28,
  },
  /** Paper thickness: a thin lighter rim along every cut edge (cream, low opacity). */
  rim: { width: 1, opacity: 0.15 },
  /** Paper grain tile (public/paper/grain.png, made by scripts/make-paper-texture.ts). */
  grain: { file: "paper/grain.png", tile: 512, opacity: 0.5, boardOpacity: 0.35 },
  /** Cut edges: points every `step` px, nudged up to `wobble` px. Fixed per shape, never animated. */
  edge: { step: 26, wobble: 1.8 },
} as const;

/** CSS drop-shadow for a paper card at a (possibly fractional) depth. */
export const paperShadow = (depth: number, opacity: number = PAPER.shadow.opacity): string => {
  const s = PAPER.shadow;
  if (depth <= 0) return "none";
  return `drop-shadow(${s.x * depth}px ${s.y * depth}px ${s.blur * depth}px ${withAlpha(s.color, opacity)})`;
};

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
  /**
   * Papercut "placed by hand": lands about 4% past the target, then settles.
   * Only for videos whose intake allows overshoot (see BUILD_NOTES.md).
   */
  settle: Easing.bezier(0.25, 1.3, 0.45, 1),
} as const;

/** Standard animation lengths in seconds. Multiply by fps at the call site. */
export const DURATION = {
  fast: 0.4,
  base: 0.8,
  slow: 1.4,
  /** Delay between items that enter one after another. */
  stagger: 0.12,
} as const;
