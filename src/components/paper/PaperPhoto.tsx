import type React from "react";
import { Img, staticFile } from "remotion";
import { COLORS, PAPER, paperShadow } from "../../brand/tokens";
import { PaperDefs } from "./PaperShape";
import { paperRect } from "./paperPath";

type PaperPhotoProps = {
  /** Image under public/. */
  readonly src: string;
  readonly w: number;
  readonly h: number;
  /** Unique id for this photo's SVG filter. */
  readonly id: string;
  readonly depth?: number;
  readonly shadowOpacity?: number;
  /** Colour levels per channel after posterizing (fewer = flatter, more cut-paper). */
  readonly levels?: number;
  readonly seed?: number;
  /** Tear all edges (a scrap) instead of a clean cut. */
  readonly torn?: boolean;
};

/**
 * A real photo made to sit in the papercut world: colours flattened to a few
 * paper-like tones (posterized, slightly desaturated and warmed), cut out with
 * a paper edge, covered with the shared grain and rim, and lit like every
 * other card (one soft shadow down-right). Drawn centred on (0, 0): place it
 * inside a <Piece>. Uses Remotion's <Img>, so renders wait for it to load.
 */
export const PaperPhoto: React.FC<PaperPhotoProps> = ({
  src,
  w,
  h,
  id,
  depth = 1.4,
  shadowOpacity,
  levels = 6,
  seed = 1,
  torn = false,
}) => {
  const d = paperRect(0, 0, w, h, { seed, torn: torn ? "all" : undefined });
  const steps = Array.from({ length: levels }, (_, i) => (i / (levels - 1)).toFixed(3)).join(" ");
  const filterId = `paper-photo-${id}`;
  return (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, filter: paperShadow(depth, shadowOpacity) }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            {/* Slightly desaturated and warmed toward the cream paper */}
            <feColorMatrix type="saturate" values="0.78" />
            <feColorMatrix
              type="matrix"
              values="1.02 0.02 0 0 0.015  0.01 1 0.01 0 0.01  0 0.02 0.94 0 0  0 0 0 1 0"
            />
            {/* Posterize: a few flat tones per channel, like layered paper */}
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues={steps} />
              <feFuncG type="discrete" tableValues={steps} />
              <feFuncB type="discrete" tableValues={steps} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, clipPath: `path('${d}')` }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `url(#${filterId})` }} />
      </div>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <PaperDefs />
        <path d={d} fill="url(#paper-grain)" opacity={PAPER.grain.opacity} />
        <path d={d} fill="none" stroke={COLORS.primary} strokeOpacity={PAPER.rim.opacity * 2} strokeWidth={PAPER.rim.width * 2} />
      </svg>
    </div>
  );
};
