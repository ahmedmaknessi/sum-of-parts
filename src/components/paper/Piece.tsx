import type React from "react";
import { PaperDefs } from "./PaperShape";

type PieceProps = {
  /** Centre of the piece, in px of its parent. */
  readonly x: number;
  readonly y: number;
  readonly rotate?: number;
  readonly scale?: number;
  /** Vertical scale only (flip digits, unfolding banners). Hinge at `origin`. */
  readonly scaleY?: number;
  readonly origin?: string;
  readonly opacity?: number;
  readonly children: React.ReactNode;
};

/**
 * One paper object (phone, card, vault...) that moves as a unit. Children are
 * laid out around the piece's centre: use <PaperSvg> for its paper shapes and
 * absolutely positioned <PaperText> for its words.
 */
export const Piece: React.FC<PieceProps> = ({ x, y, rotate = 0, scale = 1, scaleY = 1, origin = "0px 0px", opacity = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 0,
      height: 0,
      rotate: `${rotate}deg`,
      scale: scaleY === 1 ? `${scale}` : `${scale} ${scale * scaleY}`,
      transformOrigin: origin,
      opacity,
    }}
  >
    {children}
  </div>
);

type PaperSvgProps = {
  /** Size of the drawing area; (0, 0) is its centre. Shadows may overflow. */
  readonly w: number;
  readonly h: number;
  readonly children: React.ReactNode;
};

/** An SVG canvas centred on the piece, with the paper grain defined, for <PaperShape>s. */
export const PaperSvg: React.FC<PaperSvgProps> = ({ w, h, children }) => (
  <svg
    width={w}
    height={h}
    viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
    style={{ position: "absolute", left: -w / 2, top: -h / 2, overflow: "visible" }}
  >
    <PaperDefs />
    {children}
  </svg>
);

/** Absolutely places content centred on a point of the piece (for text labels). */
export const At: React.FC<{ readonly x: number; readonly y: number; readonly children: React.ReactNode }> = ({ x, y, children }) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", whiteSpace: "nowrap" }}>{children}</div>
);
