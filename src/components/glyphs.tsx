/**
 * Symbols drawn as SVG. Google's Outfit "latin" subset has no ≈ or →, so
 * typing them would fall back to another font. These scale with font size
 * (1em) and use the current text color.
 */
import type React from "react";

type GlyphProps = {
  /** Stroke width in SVG units (the glyph box is 24 units = 1em). */
  readonly weight?: number;
  readonly style?: React.CSSProperties;
};

const glyphStyle: React.CSSProperties = {
  display: "inline-block",
  width: "0.9em",
  height: "0.9em",
  verticalAlign: "-0.08em",
};

/** "≈" */
export const ApproxSign: React.FC<GlyphProps> = ({ weight = 2.4, style }) => (
  <svg viewBox="0 0 24 24" style={{ ...glyphStyle, ...style }} aria-label="approximately">
    <g fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round">
      <path d="M4 9.5 C 7 6.5, 10 6.5, 12 9.5 S 17 12.5, 20 9.5" />
      <path d="M4 16 C 7 13, 10 13, 12 16 S 17 19, 20 16" />
    </g>
  </svg>
);

/** "→" */
export const ArrowRight: React.FC<GlyphProps> = ({ weight = 2.4, style }) => (
  <svg viewBox="0 0 24 24" style={{ ...glyphStyle, width: "1em", ...style }} aria-label="to">
    <g fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13 H 20" />
      <path d="M14 7 L 20 13 L 14 19" />
    </g>
  </svg>
);

/** Line icon of a coffee cup: stroke only, current color. */
export const CoffeeCupIcon: React.FC<GlyphProps & { readonly size?: number }> = ({
  weight = 2.5,
  size = 48,
  style,
}) => (
  <svg viewBox="0 0 48 48" width={size} height={size} style={style} aria-label="coffee">
    <g fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20 H 33 V 31 A 9 9 0 0 1 24 40 H 18 A 9 9 0 0 1 9 31 Z" />
      <path d="M33 23 H 36 A 5 5 0 0 1 36 33 H 33" />
      <path d="M16 6 C 14 9, 18 11, 16 14" />
      <path d="M24 6 C 22 9, 26 11, 24 14" />
    </g>
  </svg>
);
