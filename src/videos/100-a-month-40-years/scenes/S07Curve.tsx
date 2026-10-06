import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, STROKE, TEXT_OPACITY } from "../../../brand/tokens";
import { TabularNumber } from "../../../components";
import { formatUSD } from "../../../lib/finance";
import { mix, ramp } from "../../../lib/motion";
import { DATA, LABELS } from "../data";
import { CurveAxes, CurveLine, EndLabel, PLOT, valueAtYear, xOfYear, yOfValue } from "../parts/CurveChart";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s07-curve");

const ENTER = 15;
/** Mattress and 4% lines draw fully in this many frames. */
const FULL_DRAW = 45;
/** The last decade of the 7% line draws in this many frames after "And at forty years". */
const LAST_DECADE_DRAW = 45;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YEARS = DATA.axis.years[DATA.axis.years.length - 1];
const [AT10, AT20, AT30] = DATA.milestones;

type DotProps = { readonly year: number; readonly radius: number; readonly opacity: number };
const Dot: React.FC<DotProps> = ({ year, radius, opacity }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    <circle
      cx={xOfYear(year)}
      cy={yOfValue(valueAtYear(DATA.curves.invested, year))}
      r={radius}
      fill={COLORS.accent}
      stroke={COLORS.background}
      strokeWidth={STROKE.line}
      opacity={opacity}
    />
  </svg>
);

/** Value label to the left of a milestone dot. */
const MilestoneLabel: React.FC<{ readonly year: number; readonly opacity: number; readonly children: React.ReactNode }> = ({
  year,
  opacity,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      right: 1920 - xOfYear(year) + 24,
      // Bottom-anchored, so an extra line above ("+$5K vs mattress") grows upward, never onto the curve.
      bottom: 1080 - yOfValue(valueAtYear(DATA.curves.invested, year)) + 24,
      fontSize: 40,
      fontWeight: FONT.weight.heading,
      lineHeight: 1,
      textAlign: "right",
      opacity,
      translate: `${mix(12, 0, opacity)}px 0px`,
    }}
  >
    {children}
  </div>
);

export const S07Curve: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    mattress: T.cue("mattressLine"),
    four: T.cue("fourPercent"),
    seven: T.cue("sevenPercent"),
    ten: T.cue("tenYears"),
    onlyFive: T.cue("onlyFiveMore"),
    quit: T.cue("quitHere"),
    bend: T.cue("bend"),
    twenty: T.cue("twentyYears"),
    thirty: T.cue("thirtyYears"),
    forty: T.cue("fortyYears"),
    finalEnd: T.cue("finalNumberEnd"),
  };

  const axesIn = ramp(frame, 0, 24, EASE.inOut);
  const mattressTo = YEARS * ramp(frame, cue.mattress, FULL_DRAW, EASE.inOut);
  const savingsTo = YEARS * ramp(frame, cue.four, FULL_DRAW, EASE.inOut);

  // The 7% line reaches each milestone as the narrator says it, pausing at year 10 ("most people quit")
  // and at year 30 until "And at forty years".
  const headYear = interpolate(
    frame,
    [cue.seven, cue.ten, cue.bend, cue.twenty, cue.thirty, cue.forty, cue.forty + LAST_DECADE_DRAW],
    [0, AT10.year, AT10.year, AT20.year, AT30.year, AT30.year, YEARS],
    { ...clamp, easing: EASE.inOut },
  );
  const drawing = frame >= cue.seven;

  const reached = (at: number) => ramp(frame, at, ENTER);
  const finalReached = ramp(frame, cue.forty + LAST_DECADE_DRAW - 6, ENTER);

  // Year 10: "Most people quit right here"
  const quitLine = ramp(frame, cue.quit, 20, EASE.inOut);
  const quitLabel = ramp(frame, cue.quit + 8, ENTER) * (1 - ramp(frame, cue.forty, ENTER, EASE.inOut));

  // Final counter: from the year-30 balance up to $262,481, finishing on "...eighty-one dollars".
  const count = ramp(frame, cue.forty, cue.finalEnd - cue.forty, EASE.out);
  const counterValue = mix(AT30.balance, DATA.final.invested, count);
  const counterIn = ramp(frame, cue.forty, ENTER);

  const push = interpolate(frame, [0, T.duration], [1, 1.02], clamp);

  return (
    <SceneRoot style={{ scale: push }}>
      <CurveAxes progress={axesIn} />

      {/* Mattress (0%): faint cream */}
      <CurveLine values={DATA.curves.mattress} color={COLORS.primary} width={4} opacity={0.5} toYear={mattressTo} />
      <EndLabel value={DATA.final.mattress} opacity={ramp(frame, cue.mattress + FULL_DRAW - 6, ENTER)}>
        {LABELS.totalDepositedK}
      </EndLabel>

      {/* Savings account (4%): teal */}
      <CurveLine values={DATA.curves.savings} color={COLORS.teal} width={5} toYear={savingsTo} />
      <EndLabel value={DATA.final.savings} opacity={ramp(frame, cue.four + FULL_DRAW - 6, ENTER)}>
        {LABELS.savingsFinalK}
      </EndLabel>

      {/* "Most people quit here": dashed line at year 10 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line
          x1={xOfYear(AT10.year)}
          x2={xOfYear(AT10.year)}
          y1={PLOT.bottom}
          y2={PLOT.bottom - (PLOT.bottom - PLOT.top) * quitLine}
          stroke={COLORS.primary}
          strokeOpacity={0.5}
          strokeWidth={STROKE.hairline}
          strokeDasharray="10 10"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: xOfYear(AT10.year) + 20,
          top: PLOT.top + 4,
          fontSize: 40,
          opacity: quitLabel * TEXT_OPACITY.secondary,
        }}
      >
        Most people quit here
      </div>

      {/* 7%: amber, 8px, drawn in sync with the narration */}
      {drawing ? <CurveLine values={DATA.curves.invested} color={COLORS.accent} width={8} toYear={headYear} /> : null}
      {drawing && headYear > 0 && headYear < YEARS ? <Dot year={headYear} radius={9} opacity={1} /> : null}

      <Dot year={AT10.year} radius={10} opacity={reached(cue.ten)} />
      <Dot year={AT20.year} radius={10} opacity={reached(cue.twenty)} />
      <Dot year={AT30.year} radius={10} opacity={reached(cue.thirty)} />
      <Dot year={YEARS} radius={mix(10, 18, finalReached)} opacity={finalReached} />

      <MilestoneLabel year={AT10.year} opacity={reached(cue.ten)}>
        <div
          style={{
            fontSize: 36,
            fontWeight: FONT.weight.body,
            marginBottom: 10,
            opacity: ramp(frame, cue.onlyFive, ENTER) * TEXT_OPACITY.secondary,
            translate: `0px ${mix(8, 0, ramp(frame, cue.onlyFive, ENTER))}px`,
          }}
        >
          {LABELS.tenYearEdge} vs mattress
        </div>
        {LABELS.milestones[0]}
      </MilestoneLabel>
      <MilestoneLabel year={AT20.year} opacity={reached(cue.twenty)}>
        {LABELS.milestones[1]}
      </MilestoneLabel>
      <MilestoneLabel year={AT30.year} opacity={reached(cue.thirty)}>
        {LABELS.milestones[2]}
      </MilestoneLabel>

      {/* "$262,481", counting up beside the end point */}
      <div
        style={{
          position: "absolute",
          right: 1920 - (xOfYear(YEARS) - 90),
          top: yOfValue(DATA.final.invested) - 90,
          fontSize: 120,
          fontWeight: FONT.weight.heading,
          lineHeight: 1,
          opacity: counterIn,
        }}
      >
        <TabularNumber text={formatUSD(counterValue)} />
      </div>
    </SceneRoot>
  );
};
