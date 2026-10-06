import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { COLORS, DURATION, FONT, SAFE_AREA, TEXT_OPACITY, TYPE } from "../brand/tokens";
import { exitOpacity, mix, progress } from "../lib/motion";

type SourceLowerThirdProps = {
  /** e.g. "World Bank, 2024" */
  readonly source: string;
  /** Word before the colon. */
  readonly label?: string;
  /** Bottom-left (default) or bottom-right corner. */
  readonly align?: "left" | "right";
  /** Space between the line and the bottom edge, in px. */
  readonly bottom?: number;
  readonly style?: React.CSSProperties;
};

const SourceLowerThirdInner: React.FC<SourceLowerThirdProps> = ({
  source,
  label = "Source",
  align = "left",
  bottom = SAFE_AREA.y,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const textIn = progress(frame, fps, { duration: DURATION.base });
  const out = exitOpacity(frame, fps, durationInFrames);
  const direction = align === "left" ? -1 : 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: align === "left" ? "flex-start" : "flex-end",
        padding: `0 ${SAFE_AREA.x}px ${bottom}px`,
        fontFamily: FONT.family,
        color: COLORS.primary,
        opacity: out,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: TYPE.caption,
          lineHeight: 1.2,
          opacity: textIn,
          translate: `${mix(16 * direction, 0, textIn)}px 0px`,
        }}
      >
        <span style={{ opacity: TEXT_OPACITY.tertiary }}>{label}: </span>
        <span style={{ opacity: TEXT_OPACITY.secondary }}>{source}</span>
      </div>
    </AbsoluteFill>
  );
};

const sourceLowerThirdSchema = {
  source: {
    type: "text-content",
    default: "World Bank, 2024",
    description: "Source",
  },
  label: { type: "text-content", default: "Source", description: "Label" },
  align: {
    type: "enum",
    default: "left",
    description: "Corner",
    variants: { left: {}, right: {} },
  },
} as const satisfies InteractivitySchema;

/** Lower third crediting a data source ("Source: World Bank, 2024"). Fades out at the end of its sequence. */
export const SourceLowerThird = Interactive.withSchema({
  Component: SourceLowerThirdInner,
  componentName: "<SourceLowerThird>",
  schema: sourceLowerThirdSchema,
  wrapInSequence: true,
});
