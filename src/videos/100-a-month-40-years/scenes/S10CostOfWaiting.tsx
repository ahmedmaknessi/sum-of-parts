import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, SAFE_AREA, STROKE, TEXT_OPACITY } from "../../../brand/tokens";
import { Pill } from "../../../components";
import { mix, ramp } from "../../../lib/motion";
import { ASSUMPTIONS, DATA, LABELS } from "../data";
import { CurveAxes, CurveLine, type Plot, PLOT, xOfYear, yOfValue } from "../parts/CurveChart";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s10-cost-of-waiting");

const ENTER = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YEARS = ASSUMPTIONS.years;
const LATE_FROM_YEAR = ASSUMPTIONS.lateStartYears;
/** The years lost by waiting are the last ones on the curve: the best decade. */
const BEST_DECADE_FROM = YEARS - LATE_FROM_YEAR;

/**
 * Same axes and scale as Scene 07, in a narrower frame so the labels fit on
 * the right. On "To catch up" it shrinks further to make room for the card.
 */
const PLOT_WIDE: Plot = { ...PLOT, right: 1380 };
const PLOT_SHRUNK: Plot = { ...PLOT, right: 960 };

const CARD = { left: 1080, top: 300, width: 1920 - SAFE_AREA.x - 1080, height: 480 } as const;

export const S10CostOfWaiting: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    sameHundred: T.cue("sameHundred"),
    sameSeven: T.cue("sameSeven"),
    late: T.cue("startAt35"),
    expect: T.cue("threeQuarters"),
    dont: T.cue("youDont"),
    endUp: T.cue("endUpWith122"),
    lessThanHalf: T.cue("lessThanHalf"),
    catchUp: T.cue("catchUp"),
    twoFifteen: T.cue("twoFifteen"),
    double: T.cue("moreThanDouble"),
    best: T.cue("bestDecade"),
  };

  const shrink = ramp(frame, cue.catchUp, 30, EASE.inOut);
  const plot: Plot = { ...PLOT, right: mix(PLOT_WIDE.right, PLOT_SHRUNK.right, shrink) };
  const x = (year: number) => xOfYear(year, plot);
  const y = (value: number) => yOfValue(value, plot);
  const endX = x(YEARS);

  const lateTo = interpolate(frame, [cue.late, cue.late + 75], [LATE_FROM_YEAR, YEARS], {
    ...clamp,
    easing: EASE.inOut,
  });
  const ghost = ramp(frame, cue.expect, ENTER) * (1 - ramp(frame, cue.dont, 12, EASE.inOut));
  const rightLabelsOut = 1 - ramp(frame, cue.catchUp, 12, EASE.inOut);
  const lateValueIn = ramp(frame, cue.endUp, ENTER) * rightLabelsOut;
  const bracket = ramp(frame, cue.lessThanHalf, 20, EASE.inOut);
  const bracketLabel = ramp(frame, cue.lessThanHalf + 10, ENTER) * rightLabelsOut;
  const pillsOut = 1 - ramp(frame, cue.catchUp, 12, EASE.inOut);

  const cardIn = ramp(frame, cue.catchUp + 10, ENTER);
  const row2In = ramp(frame, cue.twoFifteen, ENTER);
  const doubleIn = ramp(frame, cue.double, ENTER);

  // "It costs you the best decade": earlier years dim, the last decade pulses.
  const best = ramp(frame, cue.best, ENTER);
  const pulse = interpolate(
    frame,
    [cue.best, cue.best + 12, cue.best + 30, cue.best + 48, cue.best + 66],
    [0, 1, 0.55, 1, 0.8],
    clamp,
  );
  const push = interpolate(frame, [0, T.duration], [1, 1.02], clamp);

  const finalY = y(DATA.final.invested);
  const lateY = y(DATA.late.balance);

  return (
    <SceneRoot style={{ scale: push }}>
      <CurveAxes progress={1} plot={plot} />

      {/* Start at 25: the 7% line from Scene 07, already drawn (dimmed while the best decade pulses) */}
      <CurveLine values={DATA.curves.invested} color={COLORS.accent} width={8} toYear={YEARS} plot={plot} opacity={mix(1, 0.4, best)} />
      {/* The best decade, years 30 to 40 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: best * pulse }}>
        <polyline
          points={DATA.curves.invested
            .slice(BEST_DECADE_FROM * 12)
            .map((v, i) => `${x(BEST_DECADE_FROM + i / 12).toFixed(1)},${y(v).toFixed(1)}`)
            .join(" ")}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Start at 35: 30 years of investing, from year 10 */}
      <CurveLine
        values={DATA.curves.lateStart}
        color={COLORS.primary}
        width={5}
        toYear={lateTo}
        fromMonth={LATE_FROM_YEAR * 12}
        plot={plot}
      />

      {/* Legend: which line is which */}
      {[
        { color: COLORS.accent, text: `Start at ${LABELS.startAge}`, opacity: 1 },
        { color: COLORS.primary, text: `Start at ${LABELS.lateStartAge}`, opacity: ramp(frame, cue.late, ENTER) },
      ].map((row, i) => (
        <div
          key={row.text}
          style={{
            position: "absolute",
            left: plot.left + 32,
            top: 230 + i * 60,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 40,
            fontWeight: FONT.weight.heading,
            opacity: row.opacity,
          }}
        >
          <div style={{ width: 44, height: i === 0 ? 8 : 5, backgroundColor: row.color }} />
          {row.text}
        </div>
      ))}

      {/* "Same $100. Same 7%." */}
      <div
        style={{
          position: "absolute",
          top: SAFE_AREA.y + 16,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 24,
          opacity: pillsOut,
        }}
      >
        <Pill style={{ opacity: ramp(frame, cue.sameHundred, ENTER) }}>Same {LABELS.deposit} / month</Pill>
        <Pill style={{ opacity: ramp(frame, cue.sameSeven, ENTER) }}>Same {LABELS.investRate} a year</Pill>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* Ghost: "You'd think you'd end up with about three quarters" */}
        <g opacity={ghost}>
          <line
            x1={x(BEST_DECADE_FROM)}
            x2={endX}
            y1={y(DATA.late.naiveExpectation)}
            y2={y(DATA.late.naiveExpectation)}
            stroke={COLORS.primary}
            strokeOpacity={0.5}
            strokeWidth={STROKE.hairline}
            strokeDasharray="10 8"
          />
          <circle
            cx={endX}
            cy={y(DATA.late.naiveExpectation)}
            r={14}
            fill="none"
            stroke={COLORS.primary}
            strokeOpacity={0.5}
            strokeWidth={STROKE.hairline}
            strokeDasharray="6 5"
          />
        </g>
        {/* "Less than half": amber bracket between the two end points */}
        <g opacity={bracket}>
          <line
            x1={endX + 20}
            x2={endX + 20}
            y1={finalY}
            y2={finalY + (lateY - finalY) * bracket}
            stroke={COLORS.accent}
            strokeWidth={STROKE.line}
          />
          <line x1={endX + 8} x2={endX + 20} y1={finalY} y2={finalY} stroke={COLORS.accent} strokeWidth={STROKE.line} />
          <line x1={endX + 8} x2={endX + 20} y1={lateY} y2={lateY} stroke={COLORS.accent} strokeWidth={STROKE.line} />
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: endX + 28,
          top: y(DATA.late.naiveExpectation) - 22,
          fontSize: 40,
          lineHeight: "44px",
          opacity: ghost * TEXT_OPACITY.tertiary,
        }}
      >
        What you&apos;d expect
      </div>
      <div
        style={{
          position: "absolute",
          left: endX + 28,
          top: lateY + 18,
          fontSize: 44,
          fontWeight: FONT.weight.heading,
          opacity: lateValueIn,
        }}
      >
        {LABELS.lateBalance}
      </div>
      <div
        style={{
          position: "absolute",
          left: endX + 44,
          top: (finalY + lateY) / 2 - 48,
          color: COLORS.accent,
          lineHeight: 1.1,
          opacity: bracketLabel,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: FONT.weight.heading }}>{LABELS.lateGap}</div>
        <div style={{ fontSize: 40 }}>difference</div>
      </div>

      {/* "To catch up": split card */}
      <div
        style={{
          position: "absolute",
          ...CARD,
          boxSizing: "border-box",
          border: `1.5px solid ${COLORS.primary}`,
          borderRadius: 20,
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          opacity: cardIn,
          translate: `${mix(40, 0, cardIn)}px 0px`,
        }}
      >
        <div>
          <div style={{ fontSize: 40, opacity: TEXT_OPACITY.secondary }}>Start at {LABELS.startAge}</div>
          <div style={{ fontSize: 72, fontWeight: FONT.weight.heading, lineHeight: 1.1 }}>
            {LABELS.deposit} / month
          </div>
        </div>
        <div style={{ height: 1.5, backgroundColor: COLORS.primary, opacity: 0.3 }} />
        <div style={{ opacity: row2In, translate: `0px ${mix(12, 0, row2In)}px` }}>
          <div style={{ fontSize: 40, opacity: TEXT_OPACITY.secondary }}>Start at {LABELS.lateStartAge}</div>
          <div style={{ fontSize: 72, fontWeight: FONT.weight.heading, lineHeight: 1.1 }}>
            <span style={{ color: COLORS.accent }}>{LABELS.catchUpDeposit}</span> / month
          </div>
          <div style={{ fontSize: 40, marginTop: 8, opacity: doubleIn * TEXT_OPACITY.secondary }}>More than double</div>
        </div>
      </div>

      {/* "The best decade" to the left of the pulsing segment, inside the chart */}
      <div
        style={{
          position: "absolute",
          right: 1920 - x(YEARS - LATE_FROM_YEAR / 2) + 48,
          top: y(DATA.curves.invested[(YEARS - LATE_FROM_YEAR / 2) * 12]) - 24,
          fontSize: 48,
          fontWeight: FONT.weight.heading,
          color: COLORS.accent,
          whiteSpace: "nowrap",
          opacity: best,
          translate: `0px ${mix(12, 0, best)}px`,
        }}
      >
        The best decade
      </div>
    </SceneRoot>
  );
};
