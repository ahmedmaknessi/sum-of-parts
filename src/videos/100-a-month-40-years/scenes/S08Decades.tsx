import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, SAFE_AREA, STROKE, TEXT_OPACITY, TYPE } from "../../../brand/tokens";
import { mix, ramp } from "../../../lib/motion";
import { DATA, LABELS } from "../data";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s08-decades");

const ENTER = 18;
/** Bars share one scale: the last decade (the tallest) is MAX_HEIGHT px. */
const BASE_Y = 860;
const MAX_HEIGHT = 560;
const BAR_WIDTH = 200;
const px = (value: number) => (value / DATA.lastDecade) * MAX_HEIGHT;
const heights = DATA.decadeAdds.map(px);

/** Four bars evenly spaced; after the stack, the stack and bar 4 sit side by side. */
const SLOT_X = [420, 780, 1140, 1500];
const STACK_X = 760;
const LAST_X = 1160;
const STACK_GAP = 3;

export const S08Decades: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    bars: [T.cue("bar1"), T.cue("bar2"), T.cue("bar3"), T.cue("bar4")],
    stack: T.cue("stack"),
    onlyTime: T.cue("onlyTime"),
  };

  const grow = (i: number) => ramp(frame, cue.bars[i], ENTER, EASE.out);
  // Bars 3, 2, 1 move onto the stack one after another: each lifts to its stack height, then slides across.
  // Bar 4 slides beside the stack.
  const delay = (i: number) => cue.stack + [20, 10, 0, 0][i];
  const liftOf = (i: number) => ramp(frame, delay(i), 18, EASE.inOut);
  const moveOf = (i: number) => ramp(frame, delay(i) + 12, 24, EASE.inOut);
  const stacked = ramp(frame, cue.stack + 40, ENTER);
  const guide = ramp(frame, cue.stack + 60, 30, EASE.inOut);
  const dim = mix(1, 0.4, ramp(frame, cue.onlyTime, 20, EASE.inOut));
  const push = interpolate(frame, [0, T.duration], [1, 1.02], { extrapolateRight: "clamp" });

  /** Bottom of each first-30-years bar once stacked (bar 3 on the floor, then 2, then 1). */
  const stackBottom = [
    BASE_Y - heights[2] - heights[1] - 2 * STACK_GAP,
    BASE_Y - heights[2] - STACK_GAP,
    BASE_Y,
  ];
  const stackTop = BASE_Y - heights[0] - heights[1] - heights[2] - 2 * STACK_GAP;

  return (
    <SceneRoot style={{ scale: push }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* Baseline */}
        <line
          x1={SAFE_AREA.x}
          x2={SAFE_AREA.x + (1920 - 2 * SAFE_AREA.x) * ramp(frame, 0, 30, EASE.inOut)}
          y1={BASE_Y + STROKE.hairline}
          y2={BASE_Y + STROKE.hairline}
          stroke={COLORS.mutedStrong}
          strokeWidth={STROKE.hairline}
        />
        {heights.map((h, i) => {
          const last = i === 3;
          const m = moveOf(i);
          const cx = last ? mix(SLOT_X[3], LAST_X, m) : mix(SLOT_X[i], STACK_X, m);
          const bottom = last ? BASE_Y : mix(BASE_Y, stackBottom[i], liftOf(i));
          const height = h * grow(i);
          return (
            <rect
              key={i}
              x={cx - BAR_WIDTH / 2}
              y={bottom - height}
              width={BAR_WIDTH}
              height={height}
              fill={last ? COLORS.accent : COLORS.primary}
              opacity={last ? 1 : dim}
              shapeRendering="crispEdges"
            />
          );
        })}
        {/* Dashed guide at the stack's height, running across to bar 4 */}
        <line
          x1={STACK_X + BAR_WIDTH / 2 + 12}
          x2={STACK_X + BAR_WIDTH / 2 + 12 + (LAST_X - STACK_X - BAR_WIDTH - 24) * guide}
          y1={stackTop}
          y2={stackTop}
          stroke={COLORS.primary}
          strokeOpacity={0.5 * dim}
          strokeWidth={STROKE.hairline}
          strokeDasharray="10 10"
        />
      </svg>

      {/* Per-decade value and range labels (until the stack) */}
      {heights.map((h, i) => {
        const last = i === 3;
        const m = moveOf(i);
        const cx = last ? mix(SLOT_X[3], LAST_X, m) : mix(SLOT_X[i], STACK_X, m);
        const away = ramp(frame, cue.stack, 12, EASE.inOut);
        const valueIn = ramp(frame, cue.bars[i] + 8, ENTER) * (last ? 1 : 1 - away);
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: cx - 200,
                width: 400,
                top: BASE_Y - h - 76,
                textAlign: "center",
                fontSize: 56,
                fontWeight: FONT.weight.heading,
                lineHeight: 1,
                color: last ? COLORS.accent : COLORS.primary,
                opacity: valueIn,
              }}
            >
              {LABELS.decadeAdds[i]}
            </div>
            <div
              style={{
                position: "absolute",
                left: cx - 200,
                width: 400,
                top: BASE_Y + 22,
                textAlign: "center",
                fontSize: TYPE.caption,
                opacity: 0.6 * ramp(frame, cue.bars[i], ENTER) * (1 - away),
              }}
            >
              {LABELS.decadeRanges[i]}
            </div>
          </div>
        );
      })}

      {/* After the stack: totals, captions and the comparison */}
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
          }}
        >
          {LABELS.firstThreeDecades}
        </div>
        <div
          style={{
            position: "absolute",
            left: STACK_X - 200,
            width: 400,
            top: BASE_Y + 22,
            textAlign: "center",
            fontSize: TYPE.caption,
            opacity: TEXT_OPACITY.secondary,
          }}
        >
          First {LABELS.firstDecadesYears} years
        </div>
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 64,
            fontWeight: FONT.weight.heading,
            translate: `0px ${mix(-12, 0, stacked)}px`,
          }}
        >
          Last {LABELS.lastDecadeYears} years &gt; first {LABELS.firstDecadesYears} years
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: LAST_X - 200,
          width: 400,
          top: BASE_Y + 22,
          textAlign: "center",
          fontSize: TYPE.caption,
          opacity: TEXT_OPACITY.secondary * stacked,
        }}
      >
        Last {LABELS.lastDecadeYears} years
      </div>
    </SceneRoot>
  );
};
