import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, TEXT_OPACITY } from "../../../brand/tokens";
import { TabularNumber } from "../../../components";
import { mix, ramp } from "../../../lib/motion";
import { DATA, LABELS } from "../data";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming, TRANSITION_FRAMES } from "../timeline";

const T = sceneTiming("s01-hook");

/** Entrance length in frames (spec: 12 to 20). */
const ENTER = 15;
/** How far the "$100 / month" group moves up when the question arrives. */
const LIFT = 210;
/** Vertical center of the answer slot ("?", "$50,000?", "$262,481"). */
const ANSWER_Y = 660;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** "Month N" readout: 1 on "every month", 480 on "how much would you" (also drives the sound ticks). */
export const s01MonthAt = (frame: number) =>
  Math.round(
    interpolate(frame, [T.cue("everyMonth"), T.cue("howMuch")], [1, DATA.months], { ...clamp, easing: EASE.in }),
  );

export const S01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    appears: T.cue("hundredAppears"),
    spoken: T.cue("hundredSpoken"),
    everyMonth: T.cue("everyMonth"),
    howMuch: T.cue("howMuch"),
    guess: T.cue("guessFifty"),
    real: T.cue("realAnswer"),
    five: T.cue("fiveTimes"),
  };

  // "If you put away" -> "$" waits faintly; "one hundred dollars" -> "100" lands.
  const dollarIn = ramp(frame, cue.appears, ENTER);
  const hundredIn = ramp(frame, cue.spoken, ENTER);
  const perMonthIn = ramp(frame, cue.spoken + 4, ENTER);

  // "every month" -> Month 1 ... Month 480, finishing on "how much would you".
  const counterIn = ramp(frame, cue.everyMonth, 12);
  const month = s01MonthAt(frame);

  // "how much would you" -> everything moves up, "?" appears.
  const lift = ramp(frame, cue.howMuch, 20, EASE.inOut);
  const questionIn = ramp(frame, cue.howMuch + 4, ENTER) * (1 - ramp(frame, cue.guess, 8, EASE.inOut));

  // "Most people guess" -> "$50,000?"; "The real answer" -> it fades.
  // EASE.out so the response is visible within 3 frames of the word.
  const guessIn = ramp(frame, cue.guess, ENTER) * (1 - ramp(frame, cue.real, 12, EASE.out));

  // "five times that" -> "$262,481" slams in, amber underline draws.
  const slam = ramp(frame, cue.five, 10, EASE.out);
  const slamOpacity = ramp(frame, cue.five, 4, EASE.out);
  const underline = ramp(frame, cue.five + 6, 18, EASE.inOut);

  // Hold: slow zoom so the frame is never static.
  const zoom = interpolate(frame, [cue.five + 10, T.duration + TRANSITION_FRAMES], [1, 1.03], {
    ...clamp,
    easing: EASE.inOut,
  });

  const centered: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    lineHeight: 1,
  };

  return (
    <SceneRoot style={{ scale: zoom }}>
      {/* "$100 / month" and the month counter */}
      <div style={{ ...centered, top: 0, bottom: 0, translate: `0px ${-LIFT * lift}px` }}>
        <div style={{ ...centered, top: 380, fontSize: 140, fontWeight: FONT.weight.heading }}>
          <span style={{ opacity: dollarIn * mix(0.35, 1, hundredIn) }}>$</span>
          <span
            style={{
              display: "inline-block",
              opacity: hundredIn,
              translate: `0px ${mix(16, 0, hundredIn)}px`,
            }}
          >
            {LABELS.deposit.replace("$", "")}
          </span>
        </div>
        <div
          style={{
            ...centered,
            top: 540,
            fontSize: 48,
            opacity: perMonthIn * TEXT_OPACITY.secondary,
            translate: `0px ${mix(12, 0, perMonthIn)}px`,
          }}
        >
          / month
        </div>
        <div
          style={{
            ...centered,
            top: 626,
            fontSize: 44,
            opacity: counterIn * TEXT_OPACITY.secondary,
            translate: `0px ${mix(12, 0, counterIn)}px`,
          }}
        >
          Month <TabularNumber text={String(month)} />
        </div>
      </div>

      {/* "?" */}
      <div
        style={{
          ...centered,
          top: ANSWER_Y - 100,
          fontSize: 200,
          fontWeight: FONT.weight.heading,
          color: COLORS.accent,
          opacity: questionIn,
          scale: mix(0.92, 1, questionIn),
        }}
      >
        ?
      </div>

      {/* "$50,000?" */}
      <div
        style={{
          ...centered,
          top: ANSWER_Y - 60,
          fontSize: 120,
          fontWeight: FONT.weight.heading,
          opacity: guessIn * 0.6,
        }}
      >
        {LABELS.typicalGuess}?
      </div>

      {/* "$262,481" with amber underline */}
      <div style={{ ...centered, top: ANSWER_Y - 80 }}>
        <div
          style={{
            position: "relative",
            display: "inline-block",
            fontSize: 160,
            fontWeight: FONT.weight.heading,
            lineHeight: 1,
            opacity: slamOpacity,
            scale: mix(1.15, 1, slam),
          }}
        >
          {LABELS.final}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -32,
              height: 8,
              backgroundColor: COLORS.accent,
              scale: `${underline} 1`,
              transformOrigin: "left center",
            }}
          />
        </div>
      </div>
    </SceneRoot>
  );
};
