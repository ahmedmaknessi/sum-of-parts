import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, SAFE_AREA, TEXT_OPACITY, TYPE } from "../../../brand/tokens";
import { ArrowRight, Pill } from "../../../components";
import { mix, ramp } from "../../../lib/motion";
import { DATA, LABELS } from "../data";
import { CurveAxes, CurveLine, type Plot, PLOT, valueAtYear, xOfYear, yOfValue } from "../parts/CurveChart";
import { JAGGED_CURVE, JAGGED_TROUGHS } from "../parts/jaggedCurve";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s12-fine-print");

const ENTER = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YEARS = DATA.series.length;
/** Same axes as Scene 07; on "Fees matter too" the chart shrinks left for the card. */
const PLOT_SHRUNK_RIGHT = 960;
const CARD = { left: 1080, top: 300, width: 1920 - SAFE_AREA.x - 1080, height: 480 } as const;

export const S12FinePrint: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    caveats: T.cue("smoothLine"),
    average: T.cue("longTermAverage"),
    notSmooth: T.cue("notSmooth"),
    crash: T.cue("theyCrash"),
    kept: T.cue("keptInvesting"),
    fees: T.cue("fees"),
    cut: T.cue("cutResult"),
    tens: T.cue("tensOfThousands"),
    advice: T.cue("notAdvice"),
  };

  const shrink = ramp(frame, cue.fees, 30, EASE.inOut);
  const plot: Plot = { ...PLOT, right: mix(PLOT.right, PLOT_SHRUNK_RIGHT, shrink) };
  const x = (year: number) => xOfYear(year, plot);
  const y = (value: number) => yOfValue(value, plot);

  // "Real markets don't climb in a smooth line": smooth -> jagged, same end value.
  const jag = ramp(frame, cue.notSmooth, 60, EASE.inOut);
  const values = DATA.curves.invested.map((v, m) => mix(v, JAGGED_CURVE[m], jag));

  // "A few honest caveats": the smooth line is shown alone.
  const chartIn = ramp(frame, cue.caveats, ENTER);
  const averageIn = ramp(frame, cue.average, ENTER) * (1 - ramp(frame, cue.fees, 12, EASE.inOut));
  const adviceIn = ramp(frame, cue.advice, ENTER);
  const dim = mix(1, 0.25, adviceIn);
  const push = interpolate(frame, [0, T.duration], [1, 1.02], clamp);

  return (
    <SceneRoot style={{ scale: push }}>
      <div style={{ position: "absolute", inset: 0, opacity: dim }}>
        <div style={{ position: "absolute", inset: 0, opacity: chartIn }}>
          <CurveAxes progress={1} plot={plot} />
          <CurveLine values={values} color={COLORS.accent} width={8} toYear={YEARS} plot={plot} />
        </div>

        {/* "They crash, sometimes hard" */}
        {JAGGED_TROUGHS.map((t, i) => {
          const p = ramp(frame, cue.crash + i * 8, ENTER) * jag;
          // Below the trough, unless that would run into the year labels: then up and to the
          // left of it (the recovery arrow sits to the right).
          const below = y(t.value) + 28;
          const lifted = below + 48 > plot.bottom - 8;
          return (
            <div
              key={t.year}
              style={{
                position: "absolute",
                left: lifted ? x(t.year) - 212 : x(t.year) - 100,
                width: 200,
                top: lifted ? y(t.value) - 64 : below,
                textAlign: lifted ? "right" : "center",
                fontSize: 40,
                opacity: p * TEXT_OPACITY.secondary,
              }}
            >
              Crash
            </div>
          );
        })}

        {/* "kept investing through the crashes": arrows continuing upward after each drop */}
        {JAGGED_TROUGHS.map((t, i) => {
          const p = ramp(frame, cue.kept + i * 10, ENTER);
          const ax = x(t.recoveredYear);
          const ay = y(valueAtYear(values, t.recoveredYear));
          return (
            <div
              key={t.year}
              style={{
                position: "absolute",
                left: ax - 64,
                top: ay - 92,
                fontSize: 56,
                color: COLORS.primary,
                opacity: p,
                translate: `${mix(-8, 0, p)}px ${mix(8, 0, p)}px`,
              }}
            >
              <ArrowRight weight={2.6} style={{ rotate: "-45deg" }} />
            </div>
          );
        })}

        {/* "7% is a long-term average, not a guarantee" */}
        <div
          style={{
            position: "absolute",
            top: SAFE_AREA.y + 16,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: averageIn,
          }}
        >
          <Pill>{LABELS.investRate} is an average, not a guarantee</Pill>
        </div>

        <div
          style={{
            position: "absolute",
            right: SAFE_AREA.x,
            bottom: SAFE_AREA.y,
            fontSize: TYPE.caption,
            // Stays while the jagged (illustrative) line is on screen.
            opacity: TEXT_OPACITY.tertiary * jag,
          }}
        >
          Illustrative
        </div>

        {/* "Fees matter too": the fee card, line by line */}
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
            gap: 24,
            opacity: ramp(frame, cue.fees + 10, ENTER),
            translate: `${mix(40, 0, ramp(frame, cue.fees + 10, ENTER))}px 0px`,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: FONT.weight.heading }}>{LABELS.fee} yearly fee</div>
          <div style={{ fontSize: 52, opacity: ramp(frame, cue.cut, ENTER) }}>
            {LABELS.final} <ArrowRight /> {LABELS.withFee}
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: FONT.weight.heading,
              color: COLORS.accent,
              lineHeight: 1,
              opacity: ramp(frame, cue.tens, ENTER),
              translate: `0px ${mix(12, 0, ramp(frame, cue.tens, ENTER))}px`,
            }}
          >
            {LABELS.feeLoss}
          </div>
        </div>
      </div>

      {/* "this is education, not financial advice": center, stays to the end */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: adviceIn,
          scale: mix(0.96, 1, adviceIn),
        }}
      >
        <Pill fontSize={56} style={{ backgroundColor: COLORS.background }}>
          Education, not financial advice
        </Pill>
      </div>
    </SceneRoot>
  );
};
