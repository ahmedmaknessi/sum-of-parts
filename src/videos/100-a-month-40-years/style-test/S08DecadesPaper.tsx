import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  COLORS,
  EASE,
  FONT,
  PAPER,
  STROKE,
  TEXT_OPACITY,
  TYPE,
} from "../../../brand/tokens";
import { PaperBackground } from "../../../components/paper/PaperBackground";
import { PaperDefs, PaperShape } from "../../../components/paper/PaperShape";
import { paperHill, paperRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { DATA, LABELS } from "../data";
import { SceneAudio } from "../SceneAudio";
import { getScene, sceneTiming, TRANSITION_FRAMES } from "../timeline";

/**
 * STYLE TEST: Scene 08 (decade by decade) rebuilt in the hybrid papercut
 * style. Same timing, layout and numbers as scenes/S08Decades.tsx, so the
 * voice and sound effects line up; only the look changes.
 *
 * Paper world: the board, two cut-paper hills, a ground card the bars rise
 * out of, the bars as stacked cards, a hanging banner. Data layer (crisp):
 * every value, label and the guide line.
 *
 * Two themes to compare: dark paper (navy board) and light paper (cream board).
 */
const T = sceneTiming("s08-decades");

const ENTER = 18;
const BASE_Y = 860;
const MAX_HEIGHT = 560;
const BAR_WIDTH = 200;
const px = (value: number) => (value / DATA.lastDecade) * MAX_HEIGHT;
const heights = DATA.decadeAdds.map(px);
const SLOT_X = [420, 780, 1140, 1500];
const STACK_X = 760;
const LAST_X = 1160;
const STACK_GAP = 3;

/** Bars are stacks of paper: a faint score line every this many px. */
const SHEET = 28;
/** Card depths: lying on the board, and lifted while being moved. */
const DEPTH = { hill: 1, bar: 1.3, lifted: 3.2, banner: 2.2 } as const;
const BANNER = { width: 1040, height: 116, top: 96 } as const;

/** Every colour comes from the brand palette; light paper tints cream with navy for tonal hills. */
const THEMES = {
  dark: {
    board: COLORS.background,
    ink: COLORS.primary,
    hills: [
      { fill: COLORS.muted, shade: 0 },
      { fill: COLORS.mutedStrong, shade: 0 },
    ],
    ground: COLORS.background,
    groundInk: COLORS.primary,
    bar: COLORS.primary,
    value: COLORS.primary,
    lastValue: COLORS.accent,
    banner: COLORS.primary,
    bannerInk: COLORS.background,
    dimTo: COLORS.background,
    shadowOpacity: PAPER.shadow.opacity,
  },
  light: {
    board: COLORS.primary,
    ink: COLORS.background,
    // White-on-white papercut: cream hills told apart by a navy tint and their shadows.
    hills: [
      { fill: COLORS.primary, shade: 0.1 },
      { fill: COLORS.primary, shade: 0.22 },
    ],
    ground: COLORS.background,
    groundInk: COLORS.primary,
    bar: COLORS.mutedStrong,
    value: COLORS.background,
    // Amber text is too faint on cream: the amber bar carries the highlight, its value stays navy.
    lastValue: COLORS.background,
    banner: COLORS.background,
    bannerInk: COLORS.primary,
    dimTo: COLORS.primary,
    shadowOpacity: PAPER.shadow.opacityOnLight,
  },
} as const;

export type PaperThemeName = keyof typeof THEMES;

const BAR_PATHS = heights.map((h, i) =>
  paperRect(-BAR_WIDTH / 2, -h, BAR_WIDTH, h, {
    seed: 10 + i * 7,
    straightTop: true,
  }),
);
const BACK_HILL = paperHill(-60, 1980, 610, 1080, {
  seed: 3,
  amplitude: 46,
  waves: 1.6,
});
const FRONT_HILL = paperHill(-60, 1980, 730, 1080, {
  seed: 8,
  amplitude: 30,
  waves: 2.4,
});
const GROUND = paperRect(-40, BASE_Y, 2000, 1080 - BASE_Y + 40, {
  seed: 21,
  straightTop: true,
});
const BANNER_PATH = paperRect(
  -BANNER.width / 2,
  0,
  BANNER.width,
  BANNER.height,
  { seed: 33 },
);

type SceneProps = {
  readonly theme?: PaperThemeName;
  /** Draw the hills behind the chart (off when the chart sits on a card in a wider paper world). */
  readonly hills?: boolean;
};

export const S08DecadesPaper: React.FC<SceneProps> = ({
  theme = "dark",
  hills = true,
}) => {
  const frame = useCurrentFrame();
  const C = THEMES[theme];
  const cue = {
    bars: [T.cue("bar1"), T.cue("bar2"), T.cue("bar3"), T.cue("bar4")],
    stack: T.cue("stack"),
    onlyTime: T.cue("onlyTime"),
  };

  const grow = (i: number) => ramp(frame, cue.bars[i], ENTER, EASE.out);
  const delay = (i: number) => cue.stack + [20, 10, 0, 0][i];
  const liftOf = (i: number) => ramp(frame, delay(i), 18, EASE.inOut);
  const moveOf = (i: number) => ramp(frame, delay(i) + 12, 24, EASE.inOut);
  // A moving card rises toward the viewer (longer shadow), then settles onto the stack.
  const depthOf = (i: number) =>
    mix(
      DEPTH.bar,
      DEPTH.lifted,
      ramp(frame, delay(i), 14, EASE.out) *
        (1 - ramp(frame, delay(i) + 30, 12, EASE.inOut)),
    );
  const stacked = ramp(frame, cue.stack + 40, ENTER);
  const guide = ramp(frame, cue.stack + 60, 30, EASE.inOut);
  const dimmed = ramp(frame, cue.onlyTime, 20, EASE.inOut);
  const dim = mix(1, 0.4, dimmed);
  const away = ramp(frame, cue.stack, 12, EASE.inOut);

  // Camera: a slow push, with the hills drifting slower than the bars (parallax).
  const t = interpolate(frame, [0, T.duration], [0, 1], {
    extrapolateRight: "clamp",
  });
  const push = mix(1, 1.025, t);

  const stackBottom = [
    BASE_Y - heights[2] - heights[1] - 2 * STACK_GAP,
    BASE_Y - heights[2] - STACK_GAP,
    BASE_Y,
  ];
  const stackTop =
    BASE_Y - heights[0] - heights[1] - heights[2] - 2 * STACK_GAP;
  const barX = (i: number) =>
    i === 3
      ? mix(SLOT_X[3], LAST_X, moveOf(i))
      : mix(SLOT_X[i], STACK_X, moveOf(i));
  const barBottom = (i: number) =>
    i === 3 ? BASE_Y : mix(BASE_Y, stackBottom[i], liftOf(i));

  // The banner hangs from the top and unfolds downward on its hinge.
  const unfold = ramp(frame, cue.stack + 36, 22, EASE.out);

  return (
    <AbsoluteFill style={{ scale: push }}>
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0 }}
      >
        <PaperDefs />
        {hills ? (
          <>
            <g transform={`translate(${-14 * t} 0)`}>
              <PaperShape
                d={BACK_HILL}
                fill={C.hills[0].fill}
                shade={C.hills[0].shade}
                depth={DEPTH.hill}
                shadowOpacity={C.shadowOpacity}
              />
            </g>
            <g transform={`translate(${-28 * t} 0)`}>
              <PaperShape
                d={FRONT_HILL}
                fill={C.hills[1].fill}
                shade={C.hills[1].shade}
                depth={DEPTH.hill}
                shadowOpacity={C.shadowOpacity}
              />
            </g>
          </>
        ) : null}

        {/* Bars: drawn bottom of the stack first, so higher cards cast onto lower ones */}
        {[2, 1, 0, 3].map((i) => {
          const h = heights[i];
          const last = i === 3;
          // Rising out of the ground: the bar slides up from behind the ground card.
          const rise = (1 - grow(i)) * (h + 24);
          return (
            <g
              key={i}
              transform={`translate(${barX(i)} ${barBottom(i) + rise})`}
            >
              <PaperShape
                d={BAR_PATHS[i]}
                fill={last ? COLORS.accent : C.bar}
                depth={depthOf(i)}
                shade={last ? 0 : 0.6 * dimmed}
                shadeColor={C.dimTo}
                shadowOpacity={C.shadowOpacity}
              />
              {/* Score lines: the bar reads as a pile of sheets */}
              {Array.from({ length: Math.floor(h / SHEET) }, (_, k) => (
                <line
                  key={k}
                  x1={-BAR_WIDTH / 2 + 10}
                  x2={BAR_WIDTH / 2 - 10}
                  y1={-(k + 1) * SHEET}
                  y2={-(k + 1) * SHEET}
                  stroke={COLORS.background}
                  strokeOpacity={0.1}
                  strokeWidth={STROKE.hairline}
                />
              ))}
            </g>
          );
        })}

        {/* The ground card, in front: bars rise out of it */}
        <PaperShape
          d={GROUND}
          fill={C.ground}
          depth={DEPTH.banner}
          shadowOpacity={C.shadowOpacity}
        />

        {/* Data layer: the dashed guide at the stack's height */}
        <line
          x1={STACK_X + BAR_WIDTH / 2 + 12}
          x2={
            STACK_X +
            BAR_WIDTH / 2 +
            12 +
            (LAST_X - STACK_X - BAR_WIDTH - 24) * guide
          }
          y1={stackTop}
          y2={stackTop}
          stroke={C.ink}
          strokeOpacity={0.6 * dim}
          strokeWidth={STROKE.line}
          strokeDasharray="12 10"
        />

        {/* The banner, hanging from the top */}
        {/* The banner states the conclusion, so it stays solid when the old bars recede */}
        {unfold > 0 ? (
          <g transform={`translate(960 ${BANNER.top}) scale(1 ${unfold})`}>
            <PaperShape
              d={BANNER_PATH}
              fill={C.banner}
              depth={DEPTH.banner}
              shadowOpacity={C.shadowOpacity}
            />
          </g>
        ) : null}
      </svg>

      {/* Data layer: values above each bar, ranges printed on the ground */}
      {heights.map((h, i) => {
        const last = i === 3;
        const valueIn =
          ramp(frame, cue.bars[i] + 8, ENTER) * (last ? 1 : 1 - away);
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: barX(i) - 200,
                width: 400,
                top: BASE_Y - h - 76,
                textAlign: "center",
                fontSize: 56,
                fontWeight: FONT.weight.heading,
                lineHeight: 1,
                color: last ? C.lastValue : C.value,
                opacity: valueIn,
                translate: `0px ${mix(10, 0, valueIn)}px`,
              }}
            >
              {LABELS.decadeAdds[i]}
            </div>
            <div
              style={{
                position: "absolute",
                left: barX(i) - 200,
                width: 400,
                top: BASE_Y + 26,
                textAlign: "center",
                fontSize: TYPE.caption,
                color: C.groundInk,
                opacity:
                  TEXT_OPACITY.secondary *
                  ramp(frame, cue.bars[i], ENTER) *
                  (1 - away),
              }}
            >
              {LABELS.decadeRanges[i]}
            </div>
          </div>
        );
      })}

      <div style={{ opacity: stacked * dim }}>
        <div
          style={{
            position: "absolute",
            left: STACK_X - 200,
            width: 400,
            top: stackTop - 76,
            textAlign: "center",
            fontSize: 56,
            fontWeight: FONT.weight.heading,
            lineHeight: 1,
            color: C.value,
          }}
        >
          {LABELS.firstThreeDecades}
        </div>
        <div
          style={{
            position: "absolute",
            left: STACK_X - 200,
            width: 400,
            top: BASE_Y + 26,
            textAlign: "center",
            fontSize: TYPE.caption,
            color: C.groundInk,
            opacity: TEXT_OPACITY.secondary,
          }}
        >
          First {LABELS.firstDecadesYears} years
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: LAST_X - 200,
          width: 400,
          top: BASE_Y + 26,
          textAlign: "center",
          fontSize: TYPE.caption,
          color: C.groundInk,
          opacity: TEXT_OPACITY.secondary * stacked,
        }}
      >
        Last {LABELS.lastDecadeYears} years
      </div>

      {/* Banner text: printed on the card, appears once it has unfolded */}
      <div
        style={{
          position: "absolute",
          top: BANNER.top,
          height: BANNER.height,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 64,
          fontWeight: FONT.weight.heading,
          color: C.bannerInk,
          opacity: ramp(frame, cue.stack + 50, 10),
        }}
      >
        Last {LABELS.lastDecadeYears} years &gt; first{" "}
        {LABELS.firstDecadesYears} years
      </div>
    </AbsoluteFill>
  );
};

/** The style test as a standalone clip: the paper board, the scene, its voice and sound effects. */
export const StyleTestPaperDecades: React.FC<{
  readonly theme?: PaperThemeName;
}> = ({ theme = "dark" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { startFrame, endFrame } = getScene("s08-decades");
  const fade =
    ramp(frame, 0, TRANSITION_FRAMES, EASE.inOut) *
    (1 -
      ramp(
        frame,
        durationInFrames - TRANSITION_FRAMES,
        TRANSITION_FRAMES,
        EASE.inOut,
      ));
  return (
    <PaperBackground board={THEMES[theme].board} ink={THEMES[theme].ink}>
      <SceneAudio from={startFrame} to={endFrame} />
      <AbsoluteFill style={{ opacity: fade }}>
        <S08DecadesPaper theme={theme} />
      </AbsoluteFill>
    </PaperBackground>
  );
};

export const styleTestDuration = () =>
  getScene("s08-decades").endFrame - getScene("s08-decades").startFrame;
