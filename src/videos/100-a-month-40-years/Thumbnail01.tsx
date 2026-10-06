import type React from "react";
import { COLORS, FONT } from "../../brand/tokens";
import { Background } from "../../components";
import { DATA, LABELS } from "./data";

/** Thumbnail, 1280x720: "$100/mo", the 7% curve, "$262,481". No other text. */
const W = 1280;
const PAD = 64;
/** The curve runs the full height, bottom-left to top-right: flat for decades, then sharply up. */
const CURVE = { left: PAD, right: W - PAD, bottom: 650, top: PAD } as const;
/** The big number sits left of the curve's steep last stretch. */
const NUMBER_RIGHT = 300;

const points = DATA.curves.invested
  .map((v, month) => {
    const t = month / (DATA.curves.invested.length - 1);
    const x = CURVE.left + t * (CURVE.right - CURVE.left);
    const y = CURVE.bottom - (v / DATA.final.invested) * (CURVE.bottom - CURVE.top);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  })
  .join(" ");

export const Thumbnail01: React.FC = () => (
  <Background>
    <div
      style={{
        position: "absolute",
        left: PAD,
        top: PAD - 8,
        fontSize: 56,
        fontWeight: FONT.weight.heading,
        color: COLORS.primary,
      }}
    >
      {LABELS.deposit}/mo
    </div>
    <svg width={W} height={720} style={{ position: "absolute", inset: 0 }}>
      <polyline
        points={points}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <div
      style={{
        position: "absolute",
        right: NUMBER_RIGHT,
        top: 160,
        fontSize: 170,
        fontWeight: FONT.weight.heading,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        color: COLORS.primary,
      }}
    >
      {LABELS.final}
    </div>
  </Background>
);
