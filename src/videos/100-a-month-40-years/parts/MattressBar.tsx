import type React from "react";
import { COLORS, FONT, SAFE_AREA, TEXT_OPACITY } from "../../../brand/tokens";
import { mix } from "../../../lib/motion";
import { LABELS } from "../data";

/** One segment per year of saving. */
export const MATTRESS_SEGMENTS = 40;

/** Full-size bar in Scene 04 (left third of the frame). */
const BIG = {
  x: 400,
  y: 200,
  width: 180,
  height: 640,
  label: { x: 760, y: 420, size: 120 },
} as const;
/** Baseline chip, bottom-left, kept on screen through Scenes 05 and 06. */
const CHIP_SCALE = 0.25;
const CHIP = {
  x: SAFE_AREA.x,
  y: 1080 - SAFE_AREA.y - BIG.height * CHIP_SCALE,
  width: BIG.width * CHIP_SCALE,
  height: BIG.height * CHIP_SCALE,
  label: { size: 36 },
} as const;
const CHIP_LABEL = {
  x: CHIP.x + CHIP.width + 24,
  y: CHIP.y + CHIP.height / 2 - CHIP.label.size / 2,
};

const SEGMENT_GAP = 2;
const INSET = 8;
const STROKE = 3;

type MattressBarProps = {
  /** 0..1 for the empty dashed slot that waits for the bar (Scene 04 opening). */
  readonly slotIn?: number;
  /** 0..1 for the empty outline appearing. */
  readonly outlineIn: number;
  /** 0..1 per segment, bottom to top. */
  readonly segments: readonly number[];
  /** 0..1 for the "$48,000 / What you put in" label. */
  readonly labelIn: number;
  /** 0..1: fill fades away and the outline drops to 30% opacity. */
  readonly dim: number;
  /** 0..1: travel from the big position to the baseline chip. */
  readonly toChip: number;
};

export const MattressBar: React.FC<MattressBarProps> = ({
  slotIn = 0,
  outlineIn,
  segments,
  labelIn,
  dim,
  toChip,
}) => {
  const box = {
    left: mix(BIG.x, CHIP.x, toChip),
    top: mix(BIG.y, CHIP.y, toChip),
    width: mix(BIG.width, CHIP.width, toChip),
    height: mix(BIG.height, CHIP.height, toChip),
  };
  const innerHeight = box.height - 2 * INSET;
  const segmentHeight =
    (innerHeight - (MATTRESS_SEGMENTS - 1) * SEGMENT_GAP * (1 - toChip)) /
    MATTRESS_SEGMENTS;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: BIG.x,
          top: BIG.y,
          width: BIG.width,
          height: BIG.height,
          boxSizing: "border-box",
          border: `${STROKE}px dashed ${COLORS.primary}`,
          opacity: 0.4 * slotIn * (1 - outlineIn),
        }}
      />
      <div
        style={{
          position: "absolute",
          ...box,
          boxSizing: "border-box",
          border: `${mix(STROKE, 2, toChip)}px solid ${COLORS.primary}`,
          opacity: outlineIn * mix(1, 0.3, dim),
          scale: `1 ${outlineIn}`,
          transformOrigin: "bottom center",
        }}
      >
        {segments.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: INSET - STROKE,
              right: INSET - STROKE,
              bottom:
                INSET -
                STROKE +
                i * (segmentHeight + SEGMENT_GAP * (1 - toChip)),
              height: segmentHeight,
              backgroundColor: COLORS.primary,
              opacity: p * (1 - dim),
              scale: mix(0.85, 1, p),
            }}
          />
        ))}
      </div>

      {/* Label: "$48,000" + "What you put in", shrinking into the chip label */}
      <div
        style={{
          position: "absolute",
          left: mix(BIG.label.x, CHIP_LABEL.x, toChip),
          top: mix(BIG.label.y, CHIP_LABEL.y, toChip),
          opacity: labelIn * mix(1, 0.5, toChip),
          translate: `${mix(-20, 0, labelIn)}px 0px`,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            fontSize: mix(BIG.label.size, CHIP.label.size, toChip),
            fontWeight: FONT.weight.heading,
          }}
        >
          {LABELS.totalDeposited}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 40,
            opacity: TEXT_OPACITY.secondary * (1 - Math.min(1, toChip * 3)),
          }}
        >
          What you put in
        </div>
      </div>
    </>
  );
};

/** The finished baseline chip, as it sits in Scenes 05 and 06. */
export const MattressChip: React.FC = () => (
  <MattressBar
    outlineIn={1}
    segments={Array<number>(MATTRESS_SEGMENTS).fill(0)}
    labelIn={1}
    dim={1}
    toChip={1}
  />
);
