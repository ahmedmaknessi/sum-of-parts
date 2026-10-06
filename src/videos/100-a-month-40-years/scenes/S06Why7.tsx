import type React from "react";
import { useId } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE, FONT, SAFE_AREA, STROKE, TEXT_OPACITY, TYPE } from "../../../brand/tokens";
import { ApproxSign, Pill, SourceLowerThird } from "../../../components";
import { mix, ramp } from "../../../lib/motion";
import { LABELS, SOURCES } from "../data";
import { MARKET_CRASH_SPANS, MARKET_MAX, MARKET_PATH, MARKET_TROUGHS, MARKET_YEARS } from "../parts/marketPath";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming, TRANSITION_FRAMES } from "../timeline";

const T = sceneTiming("s06-why-7");

const ENTER = 15;
const DRAW_FRAMES = 90; // "draws left to right over about 3s"

/** Chart box. Bottom kept above the baseline chip in the bottom-left corner. */
const BOX = { left: SAFE_AREA.x, right: 1920 - SAFE_AREA.x, top: 440, bottom: 740 } as const;
const x = (year: number) => BOX.left + (year / MARKET_YEARS) * (BOX.right - BOX.left);
const y = (value: number) => BOX.bottom - (value / MARKET_MAX) * (BOX.bottom - BOX.top);
const points = (from = 0, to = MARKET_YEARS) =>
  MARKET_PATH.filter((p) => p.year >= from && p.year <= to)
    .map((p) => `${x(p.year).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(" ");

export const S06Why7: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clipId = `market-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const cue = {
    hundred: T.cue("lastHundredYears"),
    ten: T.cue("tenPercent"),
    inflation: T.cue("afterInflation"),
    todays: T.cue("todaysDollars"),
    dropped: T.cue("marketDropped"),
  };

  const axisIn = ramp(frame, 0, 30, EASE.inOut);
  const draw = ramp(frame, cue.hundred, DRAW_FRAMES, EASE.inOut);
  const tenIn = ramp(frame, cue.ten, ENTER);
  const sevenIn = ramp(frame, cue.inflation, ENTER);
  const tenDim = mix(1, 0.5, ramp(frame, cue.inflation, ENTER, EASE.inOut));
  const pillIn = ramp(frame, cue.todays, ENTER);
  // "Some years, the market dropped": dips flash amber, then settle back.
  const flash = interpolate(frame, [cue.dropped, cue.dropped + 6, cue.dropped + 30, cue.dropped + 50], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dropLabelsIn = ramp(frame, cue.dropped, ENTER);

  // Slow push on the chart and labels so long holds never look frozen.
  const push = interpolate(frame, [0, T.duration], [1, 1.02], { extrapolateRight: "clamp" });

  return (
    <SceneRoot>
      <div style={{ position: "absolute", inset: 0, scale: push }}>
        {/* "≈10% a year" then "≈7% after inflation" */}
        <div
          style={{
            position: "absolute",
            left: SAFE_AREA.x,
            top: 196,
            fontSize: 72,
            fontWeight: FONT.weight.heading,
            lineHeight: 1,
            opacity: tenIn * tenDim,
            translate: `${mix(-16, 0, tenIn)}px 0px`,
          }}
        >
          <ApproxSign weight={2.8} />
          {LABELS.nominalRate} a year
        </div>
        <div
          style={{
            position: "absolute",
            left: SAFE_AREA.x,
            top: 296,
            fontSize: 72,
            fontWeight: FONT.weight.heading,
            lineHeight: 1,
            color: COLORS.accent,
            opacity: sevenIn,
            translate: `${mix(-24, 0, sevenIn)}px 0px`,
          }}
        >
          <ApproxSign weight={2.8} />
          {LABELS.investRate} after inflation
        </div>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={BOX.left + (BOX.right - BOX.left) * draw} height={1080} />
            </clipPath>
          </defs>
          {/* Baseline */}
          <line
            x1={BOX.left}
            x2={BOX.left + (BOX.right - BOX.left) * axisIn}
            y1={BOX.bottom + 8}
            y2={BOX.bottom + 8}
            stroke={COLORS.mutedStrong}
            strokeWidth={STROKE.hairline}
          />
          {/* The 100-year path, faint cream */}
          <polyline
            points={points()}
            fill="none"
            stroke={COLORS.primary}
            strokeOpacity={0.5}
            strokeWidth={STROKE.line}
            strokeLinejoin="round"
            clipPath={`url(#${clipId})`}
            opacity={draw > 0 ? 1 : 0}
          />
          {/* Crash segments flashing amber */}
          {MARKET_CRASH_SPANS.map((span) => (
            <polyline
              key={span.from}
              points={points(span.from, span.to)}
              fill="none"
              stroke={COLORS.accent}
              strokeWidth={STROKE.bold}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={flash}
            />
          ))}
        </svg>

        {/* "-30%" / "-40%" under each trough: amber while flashing, then cream */}
        {MARKET_TROUGHS.map((p, i) => (
          <div
            key={p.year}
            style={{
              position: "absolute",
              left: x(p.year) - 100,
              width: 200,
              top: y(p.value) + 28,
              textAlign: "center",
              fontSize: 40,
              fontWeight: FONT.weight.heading,
              opacity: dropLabelsIn,
            }}
          >
            <span style={{ position: "absolute", left: 0, right: 0, color: COLORS.accent, opacity: flash }}>
              {LABELS.drops[i]}
            </span>
            <span style={{ opacity: (1 - flash) * TEXT_OPACITY.secondary }}>{LABELS.drops[i]}</span>
          </div>
        ))}

        {/* 1926 ... 2026 */}
        {[SOURCES.marketStartYear, SOURCES.marketEndYear].map((year, i) => (
          <div
            key={year}
            style={{
              position: "absolute",
              top: BOX.bottom + 24,
              ...(i === 0 ? { left: BOX.left } : { right: 1920 - BOX.right }),
              fontSize: TYPE.caption,
              opacity: 0.6 * axisIn,
            }}
          >
            {year}
          </div>
        ))}
      </div>

      {/* "All figures in today's dollars", top center, stays */}
      <div
        style={{
          position: "absolute",
          top: SAFE_AREA.y + 16,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: pillIn,
          translate: `0px ${mix(12, 0, pillIn)}px`,
        }}
      >
        <Pill>All figures in today&apos;s dollars</Pill>
      </div>

      {/* Bottom-right: "Illustrative" above the source line */}
      <div
        style={{
          position: "absolute",
          right: SAFE_AREA.x,
          bottom: SAFE_AREA.y + 52,
          fontSize: TYPE.caption,
          opacity: TEXT_OPACITY.tertiary * ramp(frame, cue.hundred, ENTER),
        }}
      >
        Illustrative
      </div>
      <SourceLowerThird
        name="Source"
        premountFor={fps}
        durationInFrames={T.duration + TRANSITION_FRAMES}
        align="right"
        source={LABELS.sourceSP500}
      />
    </SceneRoot>
  );
};
