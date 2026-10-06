import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  COLORS,
  EASE,
  FONT,
  STROKE,
  TEXT_OPACITY,
} from "../../../brand/tokens";
import { ApproxSign, ArrowRight, CoffeeCupIcon } from "../../../components";
import { mix, ramp } from "../../../lib/motion";
import { LABELS } from "../data";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming, TRANSITION_FRAMES } from "../timeline";

const T = sceneTiming("s03-rules");

const ENTER = 15;
const CARD = {
  width: 440,
  height: 260,
  gap: 64,
  top: 270,
  radius: 20,
  border: 1.5,
} as const;
const ROW_LEFT = (1920 - (3 * CARD.width + 2 * CARD.gap)) / 2;
const cardCenter = (i: number) =>
  ROW_LEFT + i * (CARD.width + CARD.gap) + CARD.width / 2;
const PER_DAY_TOP = CARD.top + CARD.height + 44;
const STRIKE_TOP = 760;

type CardProps = {
  readonly index: number;
  /** 0..1: the empty dashed slot that waits for the card. */
  readonly slot: number;
  readonly progress: number;
  readonly value: React.ReactNode;
  readonly label: string;
  readonly valueColor?: string;
};

const Card: React.FC<CardProps> = ({
  index,
  slot,
  progress,
  value,
  label,
  valueColor = COLORS.primary,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        left: ROW_LEFT + index * (CARD.width + CARD.gap),
        top: CARD.top,
        width: CARD.width,
        height: CARD.height,
        boxSizing: "border-box",
        border: `${STROKE.hairline}px dashed ${COLORS.primary}`,
        borderRadius: CARD.radius,
        opacity: 0.4 * slot * (1 - progress),
      }}
    />
    <div
      style={{
        position: "absolute",
        left: ROW_LEFT + index * (CARD.width + CARD.gap),
        top: CARD.top,
        width: CARD.width,
        height: CARD.height,
        boxSizing: "border-box",
        border: `${CARD.border}px solid ${COLORS.primary}`,
        borderRadius: CARD.radius,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        opacity: progress,
        translate: `0px ${mix(24, 0, progress)}px`,
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: FONT.weight.heading,
          lineHeight: 1,
          color: valueColor,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 40, opacity: TEXT_OPACITY.secondary }}>
        {label}
      </div>
    </div>
  </>
);

type StrikeProps = {
  readonly center: number;
  readonly appear: number;
  readonly strike: number;
  readonly children: string;
};

/** A small label that gets crossed out. */
const Struck: React.FC<StrikeProps> = ({
  center,
  appear,
  strike,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: center - 300,
      width: 600,
      top: STRIKE_TOP,
      textAlign: "center",
      opacity: appear,
      translate: `0px ${mix(12, 0, appear)}px`,
    }}
  >
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontSize: 40,
        lineHeight: 1.2,
      }}
    >
      <span style={{ opacity: TEXT_OPACITY.secondary }}>{children}</span>
      <span
        style={{
          position: "absolute",
          left: -8,
          right: -8,
          top: "54%",
          height: 3,
          backgroundColor: COLORS.primary,
          scale: `${strike} 1`,
          transformOrigin: "left center",
        }}
      />
    </span>
  </div>
);

export const S03Rules: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    card1: T.cue("card1"),
    perDay: T.cue("perDay"),
    card2: T.cue("card2"),
    noRaises: T.cue("noRaises"),
    noBonuses: T.cue("noBonuses"),
    noLuckyPicks: T.cue("noLuckyPicks"),
    card3: T.cue("card3"),
  };

  // "Let's set the rules": three empty slots wait for the cards.
  const slot = (i: number) => ramp(frame, T.anchor + i * 4, 20, EASE.out);

  const strike = (at: number) => ({
    appear: ramp(frame, at, ENTER),
    strike: ramp(frame, at + 8, 12, EASE.inOut),
  });

  // Scene end: everything slides left and fades, overlapping the cross-fade.
  const exit = ramp(frame, T.duration - 8, 8 + TRANSITION_FRAMES, EASE.inOut);
  // Slow push so long holds never look frozen.
  const push = interpolate(frame, [0, T.duration], [1, 1.02], {
    extrapolateRight: "clamp",
  });

  return (
    <SceneRoot style={{ scale: push }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - exit,
          translate: `${-160 * exit}px 0px`,
        }}
      >
        <Card
          index={0}
          slot={slot(0)}
          progress={ramp(frame, cue.card1, ENTER)}
          value={LABELS.deposit}
          label="/ month"
        />
        <Card
          index={1}
          slot={slot(1)}
          progress={ramp(frame, cue.card2, ENTER)}
          value={
            <span>
              {LABELS.startAge} <ArrowRight weight={2.6} /> {LABELS.endAge}
            </span>
          }
          label="Age"
        />
        <Card
          index={2}
          slot={slot(2)}
          progress={ramp(frame, cue.card3, ENTER)}
          value={LABELS.months}
          valueColor={COLORS.accent}
          label="deposits"
        />

        {/* "about three dollars a day" */}
        <div
          style={{
            position: "absolute",
            left: cardCenter(0) - 300,
            width: 600,
            top: PER_DAY_TOP,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            fontSize: 40,
            opacity: ramp(frame, cue.perDay, ENTER),
          }}
        >
          <CoffeeCupIcon size={52} />
          <span style={{ opacity: 0.85 }}>
            <ApproxSign /> {LABELS.depositPerDay} a day
          </span>
        </div>

        <Struck center={cardCenter(0)} {...strike(cue.noRaises)}>
          Raises
        </Struck>
        <Struck center={cardCenter(1)} {...strike(cue.noBonuses)}>
          Bonuses
        </Struck>
        <Struck center={cardCenter(2)} {...strike(cue.noLuckyPicks)}>
          Lucky stock picks
        </Struck>
      </div>
    </SceneRoot>
  );
};
