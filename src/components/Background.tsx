import type React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { COLORS, FONT, GRID } from "../brand/tokens";

type BackgroundProps = {
  /** Hide the grid texture, e.g. behind a dense chart. */
  readonly showGrid?: boolean;
  readonly children?: React.ReactNode;
};

/**
 * The brand canvas: deep navy with a faint 64px grid, centered on the frame.
 * Every scene starts with this. It also sets the brand font for its children.
 */
export const Background: React.FC<BackgroundProps> = ({
  showGrid = true,
  children,
}) => {
  const { width, height } = useVideoConfig();

  // Center the grid so a line always runs through the middle of the frame.
  const offsetX = (width / 2) % GRID.spacing;
  const offsetY = (height / 2) % GRID.spacing;
  const columns = Math.ceil(width / GRID.spacing) + 1;
  const rows = Math.ceil(height / GRID.spacing) + 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: FONT.family,
        fontWeight: FONT.weight.body,
        color: COLORS.primary,
      }}
    >
      {showGrid ? (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          shapeRendering="crispEdges"
        >
          <g
            stroke={GRID.color}
            strokeOpacity={GRID.opacity}
            strokeWidth={GRID.lineWidth}
          >
            {Array.from({ length: columns }, (_, i) => {
              const x = offsetX + i * GRID.spacing + 0.5;
              return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={height} />;
            })}
            {Array.from({ length: rows }, (_, i) => {
              const y = offsetY + i * GRID.spacing + 0.5;
              return <line key={`h${i}`} x1={0} y1={y} x2={width} y2={y} />;
            })}
          </g>
        </svg>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
