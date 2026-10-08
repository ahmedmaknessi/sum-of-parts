import type React from "react";
import { COLORS, FONT, PAPER, paperShadow } from "../../brand/tokens";
import { PaperDefs } from "./PaperShape";

type PaperTextProps = {
  readonly children: string;
  /** The paper colour the letters are cut from. */
  readonly color: string;
  readonly fontSize: number;
  readonly weight?: number;
  /** Shadow depth, like <PaperShape>. 0 = flat (source lines): no grain, rim or shadow. */
  readonly depth?: number;
  readonly shadowOpacity?: number;
  readonly style?: React.CSSProperties;
};

/** Average Outfit glyph width as a share of the font size: sizes the SVG box (text is centred in it). */
const GLYPH = 0.62;

/**
 * Text cut from paper: letters in a paper colour with the shared grain, the
 * thin cream rim along every edge and the standard paper shadow. Drawn as
 * SVG text so the grain uses the same pattern as <PaperShape> (no CSS
 * background images, which a render could capture before they load).
 * Centred on its box: place it with <At>.
 */
export const PaperText: React.FC<PaperTextProps> = ({
  children,
  color,
  fontSize,
  weight = FONT.weight.heading,
  depth = 1,
  shadowOpacity,
  style,
}) => {
  const w = Math.ceil(children.length * fontSize * GLYPH + fontSize * 0.4);
  const h = Math.ceil(fontSize * 1.3);
  const text = {
    x: w / 2,
    y: h / 2,
    textAnchor: "middle",
    dominantBaseline: "central",
    fontFamily: FONT.family,
    fontSize,
    fontWeight: weight,
    style: { whiteSpace: "pre" },
  } as const;
  return (
    <svg
      width={w}
      height={h}
      style={{ display: "block", overflow: "visible", filter: paperShadow(depth, shadowOpacity), ...style }}
    >
      <PaperDefs />
      <text {...text} fill={color}>
        {children}
      </text>
      {depth > 0 ? (
        <>
          <text {...text} fill="url(#paper-grain)" opacity={PAPER.grain.opacity}>
            {children}
          </text>
          <text {...text} fill="none" stroke={COLORS.primary} strokeOpacity={PAPER.rim.opacity} strokeWidth={PAPER.rim.width}>
            {children}
          </text>
        </>
      ) : null}
    </svg>
  );
};
