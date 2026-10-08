import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE, PAPER, PAPER_COLORS, VIDEO } from "../../../brand/tokens";
import { PaperBackground } from "../../../components/paper/PaperBackground";
import { PaperDefs, PaperShape } from "../../../components/paper/PaperShape";
import { paperCircle, paperCloud, paperHill, paperRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { SceneAudio } from "../SceneAudio";
import { getScene, TRANSITION_FRAMES } from "../timeline";
import { S08DecadesPaper } from "./S08DecadesPaper";

/**
 * STYLE TEST, mixed: a light paper world (cream sky, clouds, sun, green
 * hills, all from PAPER_COLORS) with the chart on a navy card standing in it.
 * The story layer is light and colourful; the data layer keeps the dark card,
 * so amber and the numbers keep their full contrast.
 */
const CARD = { x: 250, y: 104, w: 1420, h: (1420 * VIDEO.height) / VIDEO.width } as const;
const CARD_SCALE = CARD.w / VIDEO.width;
const CARD_PATH = paperRect(CARD.x, CARD.y, CARD.w, CARD.h, { seed: 41 });

const SUN = paperCircle(1730, 170, 92, { seed: 50 });
const CLOUDS = [paperCloud(60, 210, 220, { seed: 51 }), paperCloud(1560, 420, 260, { seed: 55 }), paperCloud(90, 560, 170, { seed: 59 })];
const HILLS = [
  { d: paperHill(-80, 2000, 730, 1120, { seed: 61, amplitude: 60, waves: 1.4 }), fill: PAPER_COLORS.leaf.light, drift: 10 },
  { d: paperHill(-80, 2000, 830, 1120, { seed: 62, amplitude: 44, waves: 2 }), fill: PAPER_COLORS.leaf.base, drift: 20 },
  { d: paperHill(-80, 2000, 915, 1120, { seed: 63, amplitude: 26, waves: 2.8 }), fill: PAPER_COLORS.green.base, drift: 34 },
] as const;

export const StyleTestPaperDecadesMixed: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { startFrame, endFrame } = getScene("s08-decades");
  const t = interpolate(frame, [0, durationInFrames], [0, 1]);
  const fade =
    ramp(frame, 0, TRANSITION_FRAMES, EASE.inOut) *
    (1 - ramp(frame, durationInFrames - TRANSITION_FRAMES, TRANSITION_FRAMES, EASE.inOut));
  const shadow = PAPER.shadow.opacityOnLight;

  return (
    <PaperBackground board={COLORS.primary} ink={COLORS.background}>
      <SceneAudio from={startFrame} to={endFrame} />
      <AbsoluteFill style={{ opacity: fade, scale: mix(1, 1.02, t) }}>
        <svg width={VIDEO.width} height={VIDEO.height} style={{ position: "absolute", inset: 0 }}>
          <PaperDefs />
          {/* Far layers drift slowest */}
          <g transform={`translate(${-6 * t} 0)`}>
            <PaperShape d={SUN} fill={PAPER_COLORS.rose.light} depth={1} shadowOpacity={shadow} />
          </g>
          {CLOUDS.map((d, i) => (
            <g key={i} transform={`translate(${(i % 2 === 0 ? 30 : -24) * t} 0)`}>
              <PaperShape d={d} fill={PAPER_COLORS.sky.light} depth={1.3} shadowOpacity={shadow} />
            </g>
          ))}
          {HILLS.slice(0, 2).map((h, i) => (
            <g key={i} transform={`translate(${-h.drift * t} 0)`}>
              <PaperShape d={h.d} fill={h.fill} depth={1 + i * 0.3} shadowOpacity={shadow} />
            </g>
          ))}
          {/* The data card stands in front of the far hills */}
          <PaperShape d={CARD_PATH} fill={COLORS.background} depth={2.6} shadowOpacity={0.32} />
        </svg>

        {/* The chart, printed on the card */}
        <div
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y,
            width: CARD.w,
            height: CARD.h,
            overflow: "hidden",
          }}
        >
          <div style={{ width: VIDEO.width, height: VIDEO.height, scale: CARD_SCALE, transformOrigin: "0 0" }}>
            <S08DecadesPaper theme="dark" hills={false} />
          </div>
        </div>

        {/* The nearest hill passes in front of the card's foot */}
        <svg width={VIDEO.width} height={VIDEO.height} style={{ position: "absolute", inset: 0 }}>
          <PaperDefs />
          <g transform={`translate(${-HILLS[2].drift * t} 0)`}>
            <PaperShape d={HILLS[2].d} fill={HILLS[2].fill} depth={1.8} shadowOpacity={shadow} />
          </g>
        </svg>
      </AbsoluteFill>
    </PaperBackground>
  );
};
