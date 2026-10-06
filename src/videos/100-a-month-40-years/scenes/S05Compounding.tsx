import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, SAFE_AREA, STROKE, TEXT_OPACITY } from "../../../brand/tokens";
import { TabularNumber } from "../../../components";
import { mix, ramp } from "../../../lib/motion";
import { ASSUMPTIONS, DATA, LABELS } from "../data";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s05-compounding");

const ENTER = 15;

/**
 * World units: one year's $1,200 deposit is a B x B rounded square. Each
 * column is one year: cream = that year's deposits, amber cap on top = the
 * growth earned that year (from the yearly series, same scale).
 */
const B = 260;
const GAP = 64;
const RADIUS = 18;
const YEARS = DATA.series.length;
const DEPOSIT = DATA.depositPerYear;
const capHeight = (year: number) => (DATA.series[year - 1].growthThisYear / DEPOSIT) * B;
const columnX = (year: number) => (year - 1) * (B + GAP);

/** Year 2 slivers on column 1: 7% on the block and 7% on the +$39 cap. */
const SLIVER_ON_BLOCK = (DATA.yearTwo.onFirstDeposit / DEPOSIT) * B;
const SLIVER_ON_CAP = (DATA.yearTwo.onFirstGrowth / DATA.growthYear1) * B;

type Camera = { left: number; base: number; scale: number };
const widthOf = (columns: number) => columns * B + (columns - 1) * GAP;
const FIT = 1920 - 2 * SAFE_AREA.x;
const CAM = {
  one: { left: 960 - B / 2, base: 760, scale: 1 },
  two: { left: 960 - widthOf(2) / 2, base: 760, scale: 1 },
  ten: { left: SAFE_AREA.x, base: 800, scale: FIT / widthOf(10) },
  all: { left: SAFE_AREA.x, base: 800, scale: FIT / widthOf(YEARS) },
} as const;

const blend = (a: Camera, b: Camera, t: number): Camera => ({
  left: mix(a.left, b.left, t),
  base: mix(a.base, b.base, t),
  scale: mix(a.scale, b.scale, t),
});

/** The loop arrow: from the tiny sliver on the +$39 cap, around, and back onto it. */
const LOOP_PATH = "M 0 -10 C -40 -80, 10 -130, 50 -120 C 100 -108, 80 -40, 14 -6";

export const S05Compounding: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    seven: T.cue("sevenLabel"),
    yearOne: T.cue("yearOne"),
    aboutForty: T.cue("aboutForty"),
    yearTwo: T.cue("yearTwo"),
    lastYears: T.cue("lastYearsGrowth"),
    growthEarns: T.cue("growthEarnsGrowth"),
    slow: T.cue("slowAtFirst"),
    then: T.cue("thenItDoesnt"),
  };

  // Camera: one column, then two, then ten, then all forty.
  const toTwo = ramp(frame, cue.yearTwo, 20, EASE.inOut);
  const toTen = ramp(frame, cue.slow, 18, EASE.inOut);
  const toAll = ramp(frame, cue.then, 20, EASE.inOut);
  const cam = blend(blend(blend(CAM.one, CAM.two, toTwo), CAM.ten, toTen), CAM.all, toAll);
  // Slow push while the first two years are explained (released when zooming out).
  const push = interpolate(frame, [cue.yearOne, cue.slow], [1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const k = mix(push, 1, toTen);
  const sx = (x: number) => 960 + (cam.left + x * cam.scale - 960) * k;
  const sy = (y: number) => 540 + (cam.base + y * cam.scale - 540) * k;
  const s = cam.scale * k;

  // Column entrances: year 1 and 2 on their cues, 3 to 10 quickly, 11 to 40 in a rush.
  const columnIn = (year: number) => {
    if (year === 1) return ramp(frame, cue.yearOne, ENTER);
    if (year === 2) return ramp(frame, cue.yearTwo, ENTER);
    if (year <= 10) return ramp(frame, cue.slow + 6 + (year - 3) * 5, 10);
    return ramp(frame, cue.then + 4 + (year - 11), 8);
  };
  const capIn = (year: number) => {
    if (year === 1) return ramp(frame, cue.aboutForty, ENTER);
    if (year === 2) return ramp(frame, cue.slow, ENTER, EASE.inOut);
    if (year <= 10) return ramp(frame, cue.slow + 10 + (year - 3) * 5, 12, EASE.inOut);
    // Fast swell right behind each column's entrance, so the row rises steadily (no hump).
    return ramp(frame, cue.then + 4 + (year - 11), 6, EASE.out);
  };

  // While the narrator sets up ("Now let's do something different... you invest"),
  // an empty dashed slot waits where the first $1,200 will land.
  const slotIn = ramp(frame, T.anchor, 20, EASE.inOut) * (1 - ramp(frame, cue.yearOne, 10, EASE.inOut));

  const labelsOut = 1 - toTen;
  const sliversIn = ramp(frame, cue.lastYears, ENTER) * (1 - ramp(frame, cue.slow, 12, EASE.inOut));
  const loopDraw = ramp(frame, cue.lastYears + 12, 24, EASE.inOut);
  const pulse = interpolate(frame, [cue.growthEarns, cue.growthEarns + 8, cue.growthEarns + 20], [1, 2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const growthLabelIn = ramp(frame, cue.growthEarns, ENTER) * labelsOut;
  // While "that's compounding" holds, a dot keeps travelling round the loop.
  const travel = frame >= cue.growthEarns + 20 ? ((frame - cue.growthEarns - 20) % 60) / 60 : 0;
  const travellerIn = ramp(frame, cue.growthEarns + 20, 10) * (1 - ramp(frame, cue.slow, 10));

  // Loop sits on the right end of column 1's cap.
  const capTopY = -B - capHeight(1);
  const loopOrigin = { x: sx(B + SLIVER_ON_CAP / 2), y: sy(capTopY) };

  const columns = Array.from({ length: YEARS }, (_, i) => i + 1);

  // "Year N" readout while the row grows: 3 to 10 slowly, then 11 to 40 in a rush.
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const yearShown = Math.round(
    frame < cue.then
      ? interpolate(frame, [cue.slow + 6, cue.slow + 6 + 7 * 5], [3, 10], clamp)
      : interpolate(frame, [cue.then + 4, cue.then + 4 + (YEARS - 11)], [11, ASSUMPTIONS.years], clamp),
  );

  return (
    <SceneRoot>
      {/* "7% a year" */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 64,
          fontWeight: FONT.weight.heading,
          opacity: ramp(frame, cue.seven, ENTER),
          translate: `0px ${mix(-12, 0, ramp(frame, cue.seven, ENTER))}px`,
        }}
      >
        {LABELS.investRate} a year
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* Baseline, drawn while the narrator sets up the idea */}
        <line
          x1={SAFE_AREA.x}
          x2={SAFE_AREA.x + (1920 - 2 * SAFE_AREA.x) * ramp(frame, 0, 45, EASE.inOut)}
          y1={sy(0) + STROKE.hairline}
          y2={sy(0) + STROKE.hairline}
          stroke={COLORS.mutedStrong}
          strokeWidth={STROKE.hairline}
        />

        <rect
          x={sx(columnX(1))}
          y={sy(-B)}
          width={B * s}
          height={B * s}
          rx={RADIUS * s}
          fill="none"
          stroke={COLORS.primary}
          strokeOpacity={0.4}
          strokeWidth={STROKE.hairline}
          strokeDasharray="14 12"
          opacity={slotIn}
        />

        {columns.map((year) => {
          const p = columnIn(year);
          if (p <= 0) return null;
          const x = sx(columnX(year));
          const w = B * s;
          const capP = capIn(year);
          const capH = capHeight(year) * s * capP;
          const r = Math.min(RADIUS * s, w / 4);
          return (
            <g key={year} opacity={p}>
              <rect
                x={x}
                y={sy(-B) + (1 - p) * 24 * s}
                width={w}
                height={w}
                rx={r}
                fill={COLORS.primary}
              />
              {capP > 0 ? (
                <rect
                  x={x}
                  y={sy(-B) - capH - 2 * s}
                  width={w}
                  height={capH}
                  rx={Math.min(r, capH / 2)}
                  fill={COLORS.accent}
                />
              ) : null}
            </g>
          );
        })}

        {/* Year 2: column 1 earns on its block AND on its +$39 */}
        <g opacity={sliversIn}>
          <rect
            x={sx(B) + 3 * s}
            y={sy(-B)}
            width={SLIVER_ON_BLOCK * s * sliversIn}
            height={B * s}
            rx={4 * s}
            fill={COLORS.accent}
          />
          <rect
            x={sx(B) + 3 * s}
            y={sy(capTopY) - 2 * s}
            width={SLIVER_ON_CAP * s * sliversIn}
            height={capHeight(1) * s}
            rx={2 * s}
            fill={COLORS.accent}
          />
        </g>

        {/* Loop arrow: growth earns growth */}
        <defs>
          <marker id="s05-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.accent} />
          </marker>
        </defs>
        <g
          transform={`translate(${loopOrigin.x} ${loopOrigin.y}) scale(${k})`}
          opacity={labelsOut * (loopDraw > 0 ? 1 : 0)}
        >
          <path
            d={LOOP_PATH}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={STROKE.line * pulse}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - loopDraw}
            markerEnd={loopDraw > 0.95 ? "url(#s05-arrow)" : undefined}
          />
        </g>
      </svg>

      {/* Dot travelling round the loop during the hold */}
      <div
        style={{
          position: "absolute",
          left: loopOrigin.x,
          top: loopOrigin.y,
          width: 0,
          height: 0,
          scale: k,
          transformOrigin: "0 0",
          opacity: travellerIn,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            marginLeft: -7,
            marginTop: -7,
            borderRadius: 7,
            backgroundColor: COLORS.accent,
            offsetPath: `path("${LOOP_PATH}")`,
            offsetDistance: `${travel * 100}%`,
            offsetRotate: "0deg",
          }}
        />
      </div>

      {/* "$1,200" inside each of the first two blocks, "Year 1/2" under them */}
      {[1, 2].map((year) => (
        <div key={year} style={{ opacity: columnIn(year) * labelsOut }}>
          <div
            style={{
              position: "absolute",
              left: sx(columnX(year)),
              width: B * s,
              top: sy(-B / 2) - 26 * k,
              textAlign: "center",
              fontSize: 48 * k,
              lineHeight: 1.1,
              fontWeight: FONT.weight.heading,
              color: COLORS.background,
            }}
          >
            {LABELS.depositPerYear}
          </div>
          <div
            style={{
              position: "absolute",
              left: sx(columnX(year)),
              width: B * s,
              top: sy(0) + 16,
              textAlign: "center",
              fontSize: 36,
              opacity: TEXT_OPACITY.tertiary,
            }}
          >
            Year {year}
          </div>
        </div>
      ))}

      {/* "+$39" above column 1's cap */}
      <div
        style={{
          position: "absolute",
          left: sx(columnX(1)),
          width: B * s * 0.75,
          top: sy(capTopY) - 64 * k,
          textAlign: "center",
          fontSize: 44,
          fontWeight: FONT.weight.heading,
          color: COLORS.accent,
          opacity: ramp(frame, cue.aboutForty, ENTER) * labelsOut,
        }}
      >
        {LABELS.growthYear1}
      </div>

      {/* "growth earns growth" */}
      <div
        style={{
          position: "absolute",
          left: loopOrigin.x - 40,
          top: loopOrigin.y - 220 * k,
          fontSize: 48,
          fontWeight: FONT.weight.heading,
          color: COLORS.accent,
          whiteSpace: "nowrap",
          opacity: growthLabelIn,
          translate: `0px ${mix(12, 0, growthLabelIn)}px`,
        }}
      >
        growth earns growth
      </div>

      {/* Year counter while the row rushes to year 40 */}
      <div
        style={{
          position: "absolute",
          right: SAFE_AREA.x,
          top: 120,
          fontSize: 44,
          opacity: TEXT_OPACITY.secondary * ramp(frame, cue.slow + 6, ENTER),
        }}
      >
        Year <TabularNumber text={String(yearShown)} />
      </div>
    </SceneRoot>
  );
};
