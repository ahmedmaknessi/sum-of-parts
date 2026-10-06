import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, STROKE, TEXT_OPACITY, TYPE } from "../../../brand/tokens";
import { LOGO_PROPORTIONS } from "../../../components";
import { mix, ramp } from "../../../lib/motion";
import { DATA, LABELS } from "../data";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s11-where-it-came-from");

const ENTER = 15;
const MORPH_FRAMES = 45;
const RADIUS = 280;
const CENTER_X = 960;
/** The cream slice sits on the left (SVG angles: 0 = right, 90 = down, 180 = left). */
const CREAM_MID = 180;
const CREAM_SPAN = (DATA.totalDeposited / DATA.final.invested) * 360;
/** How far the cream slice separates, and the amber part pulls, before the morph (px). */
const SEPARATE = 40;
const PULL = 45;
/** The finished logo: three cream quarters [0, 270], amber quarter [270, 360] (top-right). */
const LOGO_GAP = LOGO_PROPORTIONS.gap * RADIUS;
const LOGO_PULL = LOGO_PROPORTIONS.pull * RADIUS;

const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (cx: number, cy: number, r: number, deg: number) => ({
  x: cx + r * Math.cos(rad(deg)),
  y: cy + r * Math.sin(rad(deg)),
});

/** Pie slice path from angle a1 to a2 (degrees, clockwise on screen). */
const slicePath = (cx: number, cy: number, r: number, a1: number, a2: number) => {
  const p1 = polar(cx, cy, r, a1);
  const p2 = polar(cx, cy, r, a2);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
};

/** Offset (dx, dy) of `distance` px along a slice's middle angle. */
const along = (midDeg: number, distance: number) => ({
  dx: distance * Math.cos(rad(midDeg)),
  dy: distance * Math.sin(rad(midDeg)),
});

export const S11WhereItCameFrom: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    full: T.cue("fullCircle"),
    howMuch: T.cue("howMuchPutIn"),
    fortyEight: T.cue("fortyEight"),
    other: T.cue("otherTwoFourteen"),
    eightyTwo: T.cue("eightyTwo"),
    fifth: T.cue("lessThanFifth"),
    sum: T.cue("sumOfParts"),
  };

  const appear = ramp(frame, cue.full, ENTER);
  const hint = ramp(frame, cue.howMuch, ENTER) * (1 - ramp(frame, cue.fortyEight, 10, EASE.inOut));
  const separate = ramp(frame, cue.fortyEight, 20, EASE.inOut);
  const pull = ramp(frame, cue.other, 20, EASE.inOut);
  const eightyTwoIn = ramp(frame, cue.eightyTwo, ENTER);
  const fifthIn = ramp(frame, cue.fifth, ENTER);
  const morph = ramp(frame, cue.sum, MORPH_FRAMES, EASE.inOut);
  const labelsOut = 1 - ramp(frame, cue.sum, ENTER, EASE.inOut);
  const nameIn = ramp(frame, cue.sum + MORPH_FRAMES + 10, 20);
  const push = interpolate(frame, [cue.sum + MORPH_FRAMES, T.duration], [1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cy = mix(540, 480, morph);

  // Slice angles: the 18% cream wedge sweeps open into three quarters, the amber part shrinks to the top-right.
  const creamStart = mix(CREAM_MID - CREAM_SPAN / 2, 0, morph);
  const creamEnd = mix(CREAM_MID + CREAM_SPAN / 2, 270, morph);
  const amberStart = creamEnd;
  const amberEnd = creamStart + 360;
  const amberMid = (amberStart + amberEnd) / 2;
  const creamMid = (creamStart + creamEnd) / 2;

  // Cream: drawn as three sub-slices that read as one until the logo's gaps open.
  const third = (creamEnd - creamStart) / 3;
  const creamOffset = SEPARATE * separate * (1 - morph);
  const amberDistance = mix(PULL * pull, LOGO_GAP + LOGO_PULL, morph);
  const amberShift = along(amberMid, amberDistance);

  const hintEdges = [CREAM_MID - CREAM_SPAN / 2, CREAM_MID + CREAM_SPAN / 2];

  return (
    <SceneRoot style={{ scale: push }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g opacity={appear} style={{ scale: mix(0.92, 1, appear), transformOrigin: `${CENTER_X}px ${cy}px` }}>
          {[0, 1, 2].map((k) => {
            const a1 = creamStart + k * third;
            const a2 = a1 + third;
            const shared = along(creamMid, creamOffset);
            const own = along((a1 + a2) / 2, LOGO_GAP * morph);
            return (
              <path
                key={k}
                d={slicePath(CENTER_X, cy, RADIUS, a1, a2 + (morph > 0 ? 0 : 0.4))}
                fill={COLORS.primary}
                // The wedge turns cream on the cue (no see-through gap), then slides out.
                opacity={frame >= cue.fortyEight ? 1 : 0}
                transform={`translate(${shared.dx + own.dx} ${shared.dy + own.dy})`}
              />
            );
          })}
          <path
            d={slicePath(
              CENTER_X,
              cy,
              RADIUS,
              frame >= cue.fortyEight ? amberStart : 0,
              frame >= cue.fortyEight ? amberEnd : 359.99,
            )}
            fill={COLORS.accent}
            transform={`translate(${amberShift.dx} ${amberShift.dy})`}
          />
        </g>

        {/* "How much of it did you actually put in?": dashed edges of the slice to come */}
        <g opacity={hint}>
          {hintEdges.map((deg) => {
            const p = polar(CENTER_X, cy, RADIUS, deg);
            return (
              <line
                key={deg}
                x1={CENTER_X}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={COLORS.background}
                strokeWidth={STROKE.line}
                strokeDasharray="12 10"
              />
            );
          })}
        </g>
      </svg>

      {/* "$262,481" in the upper middle of the circle (clear of the cream wedge and its gap),
          then "82%" on the solid amber part. Navy on amber for contrast. */}
      <div
        style={{
          position: "absolute",
          left: CENTER_X - 300,
          width: 600,
          top: cy - 170,
          textAlign: "center",
          fontSize: 72,
          fontWeight: FONT.weight.heading,
          lineHeight: "80px",
          color: COLORS.background,
          opacity: appear * (1 - eightyTwoIn),
        }}
      >
        {LABELS.final}
      </div>
      <div
        style={{
          position: "absolute",
          left: CENTER_X + amberShift.dx + 130 - 200,
          width: 400,
          top: cy + amberShift.dy - 64,
          textAlign: "center",
          fontSize: 128,
          fontWeight: FONT.weight.heading,
          lineHeight: "128px",
          color: COLORS.background,
          opacity: eightyTwoIn * labelsOut,
          scale: mix(0.9, 1, eightyTwoIn),
        }}
      >
        {LABELS.growthShare}
      </div>

      {/* Left: "You: $48,000" (+ "18% of the pile") */}
      <div
        style={{
          position: "absolute",
          right: 1920 - (CENTER_X - RADIUS - 70),
          top: cy - 34,
          textAlign: "right",
          opacity: separate * labelsOut,
          translate: `${mix(16, 0, separate)}px 0px`,
        }}
      >
        <div style={{ fontSize: TYPE.body, fontWeight: FONT.weight.heading, lineHeight: "60px" }}>
          You: {LABELS.totalDeposited}
        </div>
        <div style={{ fontSize: 40, marginTop: 8, opacity: fifthIn * TEXT_OPACITY.secondary }}>
          {LABELS.depositShare} of the pile
        </div>
      </div>

      {/* Right: "Growth: $214,481" */}
      <div
        style={{
          position: "absolute",
          left: CENTER_X + RADIUS + 70,
          top: cy - 34,
          fontSize: TYPE.body,
          fontWeight: FONT.weight.heading,
          lineHeight: "60px",
          color: COLORS.accent,
          opacity: pull * labelsOut,
          translate: `${mix(-16, 0, pull)}px 0px`,
        }}
      >
        Growth: {LABELS.growth}
      </div>

      {/* After the morph: the channel name under the logo */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cy + RADIUS + 100,
          textAlign: "center",
          fontSize: TYPE.h2,
          fontWeight: FONT.weight.heading,
          opacity: nameIn,
          translate: `0px ${mix(16, 0, nameIn)}px`,
        }}
      >
        Sum of Parts
      </div>
    </SceneRoot>
  );
};
