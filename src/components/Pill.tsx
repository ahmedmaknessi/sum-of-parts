import type React from "react";
import { COLORS, FONT, STROKE, TYPE } from "../brand/tokens";

type PillProps = {
  readonly children: React.ReactNode;
  /** Amber outline and text, for the one key note of a scene. */
  readonly accent?: boolean;
  readonly fontSize?: number;
  readonly style?: React.CSSProperties;
};

/** A small rounded outline label, e.g. "All figures in today's dollars". */
export const Pill: React.FC<PillProps> = ({ children, accent = false, fontSize = TYPE.caption, style }) => {
  const color = accent ? COLORS.accent : COLORS.primary;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${fontSize * 0.35}px ${fontSize * 0.8}px`,
        border: `${STROKE.hairline}px solid ${color}`,
        borderRadius: 999,
        color,
        fontFamily: FONT.family,
        fontWeight: FONT.weight.body,
        fontSize,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
