import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, STROKE, TEXT_OPACITY } from "../../../brand/tokens";
import { Pill } from "../../../components";
import { mix, ramp } from "../../../lib/motion";
import { LABELS } from "../data";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s13-takeaway");

const ENTER = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const DIVIDER_WIDTH = 620;

const centered: React.CSSProperties = { position: "absolute", left: 0, right: 0, textAlign: "center", lineHeight: 1 };

/** A recap line that rises in. */
const Line: React.FC<{ readonly top: number; readonly p: number; readonly children: React.ReactNode }> = ({
  top,
  p,
  children,
}) => (
  <div
    style={{
      ...centered,
      top,
      fontSize: 76,
      fontWeight: FONT.weight.heading,
      opacity: p,
      translate: `0px ${mix(16, 0, p)}px`,
    }}
  >
    {children}
  </div>
);

/** A label that gets crossed out ("Big salary", "Perfect investment"). */
const Struck: React.FC<{ readonly x: number; readonly p: number; readonly drawn: number; readonly children: string }> = ({
  x,
  p,
  drawn,
  children,
}) => (
  <div style={{ position: "absolute", left: x - 300, width: 600, top: 820, textAlign: "center", opacity: p }}>
    <span style={{ position: "relative", display: "inline-block", fontSize: 44, lineHeight: 1.2 }}>
      <span style={{ opacity: TEXT_OPACITY.secondary }}>{children}</span>
      <span
        style={{
          position: "absolute",
          left: -8,
          right: -8,
          top: "54%",
          height: 3,
          backgroundColor: COLORS.primary,
          scale: `${drawn} 1`,
          transformOrigin: "left center",
        }}
      />
    </span>
  </div>
);

export const S13Takeaway: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    line1: T.cue("line1"),
    line2: T.cue("line2"),
    line3: T.cue("line3"),
    quarter: T.cue("quarterMillion"),
    salary: T.cue("notBecause"),
    perfect: T.cue("perfectInvestment"),
    time: T.cue("becauseOfTime"),
    amount: T.cue("amount"),
    startDate: T.cue("startDate"),
    ifYouWant: T.cue("ifYouWant"),
    nextVideo: T.cue("nextVideo"),
  };

  // "Because of time": the recap fades, only "Time." remains.
  const recapOut = 1 - ramp(frame, cue.time, 12, EASE.inOut);
  const timeIn = ramp(frame, cue.time + 4, ENTER);
  // "If you want to see where the money...": the takeaway gives way to the next-video teaser.
  const takeawayOut = 1 - ramp(frame, cue.ifYouWant, 15, EASE.out);
  // "that's the next video": the teaser starts dissolving into the end card (down to
  // 40%; the scene cross-fade takes it the rest of the way, so there is no empty frame).
  const teaserIn =
    ramp(frame, cue.ifYouWant + 8, ENTER) * mix(1, 0.4, ramp(frame, cue.nextVideo, 30, EASE.inOut));

  const divider = ramp(frame, cue.quarter, 18, EASE.inOut);
  const total = ramp(frame, cue.quarter + 12, ENTER);
  const strike = (at: number) => ({ p: ramp(frame, at, ENTER), drawn: ramp(frame, at + 8, 12, EASE.inOut) });
  const salary = strike(cue.salary);
  const perfect = strike(cue.perfect);
  const push = interpolate(frame, [0, T.duration], [1, 1.02], clamp);

  return (
    <SceneRoot style={{ scale: push }}>
      {/* Recap stack */}
      <div style={{ position: "absolute", inset: 0, opacity: recapOut }}>
        <Line top={200} p={ramp(frame, cue.line1, ENTER)}>
          {LABELS.deposit} a month
        </Line>
        <Line top={300} p={ramp(frame, cue.line2, ENTER)}>
          {LABELS.years} years
        </Line>
        <Line top={400} p={ramp(frame, cue.line3, ENTER)}>
          {LABELS.investRate} a year
        </Line>
        <div
          style={{
            position: "absolute",
            left: 960 - DIVIDER_WIDTH / 2,
            width: DIVIDER_WIDTH,
            top: 524,
            height: STROKE.hairline,
            backgroundColor: COLORS.primary,
            scale: `${divider} 1`,
          }}
        />
        <div
          style={{
            ...centered,
            top: 572,
            fontSize: 120,
            fontWeight: FONT.weight.heading,
            color: COLORS.accent,
            opacity: total,
            scale: mix(1.06, 1, total),
          }}
        >
          = {LABELS.final}
        </div>
        <Struck x={720} p={salary.p} drawn={salary.drawn}>
          Big salary
        </Struck>
        <Struck x={1200} p={perfect.p} drawn={perfect.drawn}>
          Perfect investment
        </Struck>
      </div>

      {/* "Time." then "Amount" (small) vs "Start date" (big, amber) */}
      <div style={{ position: "absolute", inset: 0, opacity: takeawayOut }}>
        <div
          style={{
            ...centered,
            top: 270,
            fontSize: 160,
            fontWeight: FONT.weight.heading,
            opacity: timeIn,
            scale: mix(0.94, 1, timeIn),
          }}
        >
          Time.
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 600,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: 72,
          }}
        >
          <span
            style={{
              fontSize: 52,
              opacity: ramp(frame, cue.amount, ENTER) * TEXT_OPACITY.secondary,
            }}
          >
            Amount
          </span>
          <span
            style={{
              fontSize: 128,
              fontWeight: FONT.weight.heading,
              color: COLORS.accent,
              opacity: ramp(frame, cue.startDate, ENTER),
              scale: mix(0.9, 1, ramp(frame, cue.startDate, ENTER)),
            }}
          >
            Start date
          </span>
        </div>
      </div>

      {/* Next-video teaser, carried into the end card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          opacity: teaserIn,
          translate: `0px ${mix(16, 0, teaserIn)}px`,
        }}
      >
        <Pill accent>Next video</Pill>
        <div style={{ fontSize: 64, fontWeight: FONT.weight.heading, textAlign: "center", maxWidth: 1500 }}>
          Where the money in your bank account comes from
        </div>
      </div>
    </SceneRoot>
  );
};
