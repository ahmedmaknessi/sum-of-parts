import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, SAFE_AREA, STROKE, TEXT_OPACITY } from "../../../brand/tokens";
import { TabularNumber } from "../../../components";
import { formatUSD } from "../../../lib/finance";
import { mix, ramp } from "../../../lib/motion";
import { ASSUMPTIONS, DATA, LABELS } from "../data";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s09-tipping-point");

const ENTER = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Bars start here; labels sit to the left. */
const BAR_X = 600;
const BAR_HEIGHT = 80;
const DEPOSIT_Y = 420;
const GROWTH_Y = 560;
/** px per dollar: $1,200 = 900px early on. Once growth gets bigger, the scale shrinks so it never exceeds MAX_BAR. */
const SCALE_EARLY = 900 / DATA.depositPerYear;
const MAX_BAR = 1000;
/** The counter rushes from year 11 to 40 in this many frames. */
const RUSH_FRAMES = 90;

/** Growth earned in a (fractional) year, linear between whole years. */
const growthAt = (year: number) => {
  const lo = Math.max(1, Math.floor(year));
  const hi = Math.min(DATA.series.length, lo + 1);
  const t = year - lo;
  return mix(DATA.series[lo - 1].growthThisYear, DATA.series[hi - 1].growthThisYear, t);
};

/** Year readout: 1 to 11 on "In year eleven", freeze, then 11 to 40 from "From that point on". */
export const s09YearAt = (frame: number) => {
  const eleven = T.cue("yearEleven");
  const from = T.cue("fromThatPoint");
  return frame < from
    ? interpolate(frame, [12, eleven], [1, DATA.tipping.year], { ...clamp, easing: EASE.inOut })
    : interpolate(frame, [from, from + RUSH_FRAMES], [DATA.tipping.year, ASSUMPTIONS.years], {
        ...clamp,
        easing: EASE.inOut,
      });
};

/** Value label beside a bar end. */
const EndValue: React.FC<{ readonly x: number; readonly y: number; readonly color: string; readonly children: string }> = ({
  x,
  y,
  color,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x + 24,
      top: y + BAR_HEIGHT / 2 - 24,
      fontSize: 44,
      fontWeight: FONT.weight.heading,
      lineHeight: "48px",
      color,
    }}
  >
    <TabularNumber text={children} />
  </div>
);

export const S09TippingPoint: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    eleven: T.cue("yearEleven"),
    moreThan: T.cue("moreThan"),
    from: T.cue("fromThatPoint"),
    gap: T.cue("gapWider"),
  };
  const year = s09YearAt(frame);
  const shownYear = Math.round(year);
  const rescale = ramp(frame, cue.from, RUSH_FRAMES, EASE.inOut);
  // Auto-fit every frame: the growth bar never runs past MAX_BAR, the deposit bar shrinks instead.
  const scale = Math.min(SCALE_EARLY, MAX_BAR / growthAt(year));

  const depositW = DATA.depositPerYear * scale;
  const growthW = growthAt(year) * scale;

  const enter = ramp(frame, 0, ENTER);
  const freeze = ramp(frame, cue.eleven, ENTER) * (1 - ramp(frame, cue.from, 12, EASE.inOut));
  const excess = ramp(frame, cue.moreThan, ENTER, EASE.inOut) * (1 - ramp(frame, cue.from, 12, EASE.inOut));
  const finalIn = ramp(frame, cue.gap, ENTER);
  const markerX = BAR_X + depositW;

  // Slow push through the long freeze.
  const push = interpolate(frame, [cue.eleven, cue.from], [1, 1.03], clamp);
  const pushBack = mix(push, 1, rescale);

  return (
    <SceneRoot style={{ scale: pushBack }}>
      {/* Year counter, top-left */}
      <div
        style={{
          position: "absolute",
          left: SAFE_AREA.x,
          top: 120,
          fontSize: 80,
          fontWeight: FONT.weight.heading,
          lineHeight: 1,
          opacity: enter,
        }}
      >
        Year <TabularNumber text={String(shownYear)} />
      </div>

      {/* Row labels */}
      {[
        { y: DEPOSIT_Y, text: "You deposited" },
        { y: GROWTH_Y, text: "Growth earned" },
      ].map((row) => (
        <div
          key={row.text}
          style={{
            position: "absolute",
            right: 1920 - BAR_X + 28,
            top: row.y + BAR_HEIGHT / 2 - 22,
            fontSize: 40,
            lineHeight: "44px",
            opacity: TEXT_OPACITY.secondary * enter,
          }}
        >
          {row.text}
        </div>
      ))}

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={BAR_X} y={DEPOSIT_Y} width={depositW * enter} height={BAR_HEIGHT} fill={COLORS.primary} />
        <rect x={BAR_X} y={GROWTH_Y} width={growthW * enter} height={BAR_HEIGHT} fill={COLORS.accent} />

        {/* Year 11 marker at the $1,200 line, spanning both bars */}
        <line
          x1={markerX}
          x2={markerX}
          y1={DEPOSIT_Y - 40}
          y2={DEPOSIT_Y - 40 + (GROWTH_Y + BAR_HEIGHT + 80 - DEPOSIT_Y) * freeze}
          stroke={COLORS.primary}
          strokeOpacity={0.7}
          strokeWidth={STROKE.hairline}
          strokeDasharray="10 8"
          opacity={freeze > 0 ? 1 : 0}
        />
        {/* "That's more than the $1,200": the overshoot past the line */}
        <rect
          x={markerX}
          y={GROWTH_Y - 8}
          width={Math.max(0, growthW - depositW)}
          height={BAR_HEIGHT + 16}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth={STROKE.hairline}
          opacity={excess}
        />
      </svg>

      {/* "Year 11: your money out-earns you" */}
      <div
        style={{
          position: "absolute",
          left: BAR_X,
          top: 290,
          fontSize: 52,
          fontWeight: FONT.weight.heading,
          color: COLORS.accent,
          opacity: freeze,
          translate: `0px ${mix(12, 0, freeze)}px`,
        }}
      >
        Year {LABELS.tippingYear}: your money out-earns you
      </div>

      {/* Values beside the bar ends */}
      <div style={{ opacity: enter }}>
        <EndValue x={BAR_X + depositW} y={DEPOSIT_Y} color={COLORS.primary}>
          {LABELS.depositPerYear}
        </EndValue>
        <div style={{ opacity: 1 - finalIn }}>
          <EndValue x={BAR_X + growthW} y={GROWTH_Y} color={COLORS.accent}>
            {formatUSD(DATA.series[shownYear - 1].growthThisYear)}
          </EndValue>
        </div>
      </div>

      {/* "the gap gets wider": final label */}
      <div
        style={{
          position: "absolute",
          right: 1920 - (BAR_X + growthW),
          top: GROWTH_Y + BAR_HEIGHT + 24,
          fontSize: 52,
          fontWeight: FONT.weight.heading,
          color: COLORS.accent,
          opacity: finalIn,
          translate: `0px ${mix(12, 0, finalIn)}px`,
        }}
      >
        {LABELS.growthYearLast} in year {ASSUMPTIONS.years}
      </div>
    </SceneRoot>
  );
};
