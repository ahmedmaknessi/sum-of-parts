import type React from "react";
import { staticFile } from "remotion";
import { COLORS, PAPER, paperShadow } from "../../brand/tokens";

/** Id of the shared grain pattern; <PaperDefs> must be inside the same <svg>. */
const GRAIN_ID = "paper-grain";

/** Defines the paper grain pattern. Put one inside every <svg> that draws <PaperShape>s. */
export const PaperDefs: React.FC = () => (
  <defs>
    <pattern id={GRAIN_ID} patternUnits="userSpaceOnUse" width={PAPER.grain.tile} height={PAPER.grain.tile}>
      <image href={staticFile(PAPER.grain.file)} width={PAPER.grain.tile} height={PAPER.grain.tile} />
    </pattern>
  </defs>
);

type PaperShapeProps = {
  /** Path from paperRect / paperHill (or any SVG path). */
  readonly d: string;
  readonly fill: string;
  /** How high the card sits: 0 = no shadow, 1 = on the board, 3 = lifted. Can animate. */
  readonly depth?: number;
  /** 0..1: tints the card toward `shadeColor` (dimmed, pushed back, or a tonal step in a layered landscape). */
  readonly shade?: number;
  /** What `shade` tints toward: the board colour, so a dimmed card sinks into it. Default navy. */
  readonly shadeColor?: string;
  /** Shadow strength; PAPER.shadow.opacityOnLight on a cream board. */
  readonly shadowOpacity?: number;
  readonly opacity?: number;
  readonly style?: React.CSSProperties;
};

/** One card of cut paper: flat colour, grain, and its shadow. Use inside an <svg> with <PaperDefs>. */
export const PaperShape: React.FC<PaperShapeProps> = ({
  d,
  fill,
  depth = 1,
  shade = 0,
  shadeColor = COLORS.background,
  shadowOpacity,
  opacity = 1,
  style,
}) => (
  <g style={{ filter: paperShadow(depth, shadowOpacity), ...style }} opacity={opacity}>
    <path d={d} fill={fill} />
    <path d={d} fill={`url(#${GRAIN_ID})`} opacity={PAPER.grain.opacity} />
    <path d={d} fill="none" stroke={COLORS.primary} strokeOpacity={PAPER.rim.opacity} strokeWidth={PAPER.rim.width} />
    {shade > 0 ? <path d={d} fill={shadeColor} opacity={shade} /> : null}
  </g>
);
