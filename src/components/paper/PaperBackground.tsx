import type React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { COLORS, FONT, PAPER } from "../../brand/tokens";
import { PaperDefs } from "./PaperShape";

/**
 * The papercut canvas: the base board (navy, or cream for light paper) with paper grain. Sets the brand
 * font for its children, like <Background> does for the flat style.
 */
type PaperBackgroundProps = {
  /** The base board: navy (dark paper, default) or cream (light paper). */
  readonly board?: string;
  /** Default text colour on this board. */
  readonly ink?: string;
  readonly children?: React.ReactNode;
};

export const PaperBackground: React.FC<PaperBackgroundProps> = ({
  board = COLORS.background,
  ink = COLORS.primary,
  children,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: board,
        fontFamily: FONT.family,
        fontWeight: FONT.weight.body,
        color: ink,
      }}
    >
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <PaperDefs />
        <rect width={width} height={height} fill="url(#paper-grain)" opacity={PAPER.grain.boardOpacity} />
      </svg>
      {children}
    </AbsoluteFill>
  );
};
