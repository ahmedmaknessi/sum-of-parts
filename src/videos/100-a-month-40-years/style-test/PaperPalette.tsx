import type React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONT, PAPER, PAPER_COLORS, type PaperHue } from "../../../brand/tokens";
import { PaperDefs, PaperShape } from "../../../components/paper/PaperShape";
import { paperCircle, paperCloud, paperHill, paperRect } from "../../../components/paper/paperPath";

/**
 * STYLE TEST: the paper palette sheet (1920x1080 still). Left half on the
 * navy board, right half on the cream board: every paper hue in its three
 * tones as cut cards, the brand core colours, and a small landscape built
 * only from the palette to show the layering.
 */
const HUES = Object.keys(PAPER_COLORS) as PaperHue[];
const TONES = ["light", "base", "dark"] as const;
const HALF = 960;
const COL = 140;
const CARD = { w: 118, h: 100 } as const;
const GRID = { left: 66, top: 190 } as const;
const ROW = 124;
const CORE = [COLORS.primary, COLORS.accent, COLORS.teal, COLORS.blue, COLORS.coral, COLORS.mutedStrong] as const;
const CORE_NAMES = ["cream", "amber", "teal", "blue", "coral", "slate"] as const;

const Half: React.FC<{ readonly x: number; readonly board: string; readonly ink: string; readonly light: boolean }> = ({
  x,
  board,
  ink,
  light,
}) => {
  const shadow = light ? PAPER.shadow.opacityOnLight : PAPER.shadow.opacity;
  return (
    <div style={{ position: "absolute", left: x, top: 0, width: HALF, height: 1080, backgroundColor: board, color: ink, overflow: "hidden" }}>
      <svg width={HALF} height={1080} style={{ position: "absolute", inset: 0 }}>
        <PaperDefs />
        <rect width={HALF} height={1080} fill="url(#paper-grain)" opacity={PAPER.grain.boardOpacity} />
        {HUES.map((hue, c) =>
          TONES.map((tone, r) => (
            <PaperShape
              key={`${hue}${tone}`}
              d={paperRect(GRID.left + c * COL, GRID.top + r * ROW, CARD.w, CARD.h, { seed: c * 10 + r })}
              fill={PAPER_COLORS[hue][tone]}
              depth={1.2}
              shadowOpacity={shadow}
            />
          )),
        )}
        {CORE.map((color, i) => (
          <PaperShape
            key={color}
            d={paperCircle(GRID.left + CARD.w / 2 + i * COL, 650, 44, { seed: 70 + i })}
            fill={color}
            depth={1.2}
            shadowOpacity={shadow}
          />
        ))}
        {/* A little world built only from the palette */}
        <PaperShape d={paperCircle(760, 820, 54, { seed: 90 })} fill={PAPER_COLORS.rose.light} depth={1} shadowOpacity={shadow} />
        <PaperShape d={paperCloud(120, 820, 170, { seed: 91 })} fill={PAPER_COLORS.sky.light} depth={1.2} shadowOpacity={shadow} />
        <PaperShape d={paperHill(-20, HALF + 20, 900, 1100, { seed: 92, amplitude: 36, waves: 1.3 })} fill={PAPER_COLORS.leaf.light} depth={1} shadowOpacity={shadow} />
        <PaperShape d={paperHill(-20, HALF + 20, 965, 1100, { seed: 93, amplitude: 28, waves: 1.9 })} fill={PAPER_COLORS.leaf.base} depth={1.3} shadowOpacity={shadow} />
        <PaperShape d={paperHill(-20, HALF + 20, 1025, 1100, { seed: 94, amplitude: 20, waves: 2.6 })} fill={PAPER_COLORS.green.dark} depth={1.6} shadowOpacity={shadow} />
        <PaperShape d={paperRect(430, 905, 150, 90, { seed: 95 })} fill={PAPER_COLORS.kraft.base} depth={1.8} shadowOpacity={shadow} />
        <PaperShape d={paperRect(470, 880, 70, 40, { seed: 96 })} fill={PAPER_COLORS.plum.base} depth={1.9} shadowOpacity={shadow} />
      </svg>

      <div style={{ position: "absolute", left: GRID.left, top: 60, fontSize: 48, fontWeight: FONT.weight.heading }}>
        {light ? "On cream" : "On navy"}
      </div>
      {HUES.map((hue, c) => (
        <div
          key={hue}
          style={{ position: "absolute", left: GRID.left + c * COL, width: CARD.w, top: 140, textAlign: "center", fontSize: 30, fontWeight: FONT.weight.heading }}
        >
          {hue}
        </div>
      ))}
      {HUES.map((hue, c) =>
        TONES.map((tone, r) => (
          <div
            key={`${hue}${tone}t`}
            style={{
              position: "absolute",
              left: GRID.left + c * COL,
              width: CARD.w,
              top: GRID.top + r * ROW + CARD.h - 30,
              textAlign: "center",
              fontSize: 20,
              color: tone === "light" ? COLORS.background : COLORS.primary,
              opacity: 0.85,
            }}
          >
            {PAPER_COLORS[hue][tone]}
          </div>
        )),
      )}
      {CORE_NAMES.map((name, i) => (
        <div
          key={name}
          style={{ position: "absolute", left: GRID.left + i * COL, width: CARD.w, top: 706, textAlign: "center", fontSize: 26, opacity: 0.8 }}
        >
          {name}
        </div>
      ))}
      <div style={{ position: "absolute", left: GRID.left, top: 566, fontSize: 26, opacity: 0.7 }}>Brand core (data and highlight)</div>
    </div>
  );
};

export const PaperPalette: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: FONT.family, fontWeight: FONT.weight.body }}>
    <Half x={0} board={COLORS.background} ink={COLORS.primary} light={false} />
    <Half x={HALF} board={COLORS.primary} ink={COLORS.background} light />
  </AbsoluteFill>
);
