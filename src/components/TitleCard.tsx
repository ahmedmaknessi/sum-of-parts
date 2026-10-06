import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import {
  COLORS,
  DURATION,
  EASE,
  FONT,
  SAFE_AREA,
  SPACE,
  TEXT_OPACITY,
  TYPE,
} from "../brand/tokens";
import { mix, progress } from "../lib/motion";

type TitleCardProps = {
  /** The big question, e.g. "Where does your money actually go?" */
  readonly question: string;
  /** Optional phrase inside the question to color amber. Must match exactly. */
  readonly highlight?: string;
  /** Optional smaller line under the question. */
  readonly subtitle?: string;
  readonly style?: React.CSSProperties;
};

type Word = {
  readonly text: string;
  readonly highlighted: boolean;
};

/** Splits the question into words, flagging the ones inside the highlight. */
const splitWords = (question: string, highlight?: string): Word[] => {
  const toWords = (text: string, highlighted: boolean): Word[] =>
    text
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => ({ text: w, highlighted }));

  const index = highlight ? question.indexOf(highlight) : -1;
  if (!highlight || index === -1) {
    return toWords(question, false);
  }
  return [
    ...toWords(question.slice(0, index), false),
    ...toWords(highlight, true),
    ...toWords(question.slice(index + highlight.length), false),
  ];
};

const WORD_STAGGER = 0.06;
const WORD_DURATION = 0.7;

const TitleCardInner: React.FC<TitleCardProps> = ({
  question,
  highlight,
  subtitle,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = splitWords(question, highlight);

  const subtitleStart = words.length * WORD_STAGGER + WORD_DURATION * 0.6;
  const subtitleIn = progress(frame, fps, {
    start: subtitleStart,
    duration: DURATION.base,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${SAFE_AREA.y}px ${SAFE_AREA.x}px`,
        fontFamily: FONT.family,
        color: COLORS.primary,
        textAlign: "center",
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          fontSize: TYPE.h1,
          fontWeight: FONT.weight.heading,
          lineHeight: 1.12,
          letterSpacing: "-0.015em",
        }}
      >
        {words.map((word, i) => {
          const p = progress(frame, fps, {
            start: i * WORD_STAGGER,
            duration: WORD_DURATION,
            easing: EASE.out,
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.25em",
                color: word.highlighted ? COLORS.accent : COLORS.primary,
                opacity: p,
                translate: `0px ${mix(32, 0, p)}px`,
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
      {subtitle ? (
        <div
          style={{
            maxWidth: 1300,
            marginTop: SPACE.lg,
            fontSize: TYPE.body,
            fontWeight: FONT.weight.body,
            lineHeight: 1.3,
            opacity: subtitleIn * TEXT_OPACITY.secondary,
            translate: `0px ${mix(16, 0, subtitleIn)}px`,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const titleCardSchema = {
  question: {
    type: "text-content",
    default: "Where does your money actually go?",
    description: "Question",
  },
  highlight: {
    type: "text-content",
    default: "",
    description: "Highlighted phrase (amber)",
  },
  subtitle: {
    type: "text-content",
    default: "",
    description: "Subtitle",
  },
} as const satisfies InteractivitySchema;

/** Title card: a big question, word-by-word reveal, optional amber phrase and subtitle. */
export const TitleCard = Interactive.withSchema({
  Component: TitleCardInner,
  componentName: "<TitleCard>",
  schema: titleCardSchema,
  wrapInSequence: true,
});
