import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, PAPER_COLORS } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { jitter, paperPolygon } from "../../../components/paper/paperPath";
import { EASE } from "../../../brand/tokens";
import { mix, ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { SOURCES } from "../data";
import { Doc, enter, Label, leave, SourceLine, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";
import { PAGE, TextbookPage } from "./S03Textbook";

const T = sceneTiming("s04-twist");

/** One half of the textbook page, with a torn edge down the middle. */
const tornHalf = (side: -1 | 1) => {
  const { w, h } = PAGE;
  const tear: [number, number][] = [];
  const steps = Math.round(h / 12);
  for (let i = 0; i <= steps; i++) {
    const y = -h / 2 + (i / steps) * h;
    tear.push([jitter(410, i) * 9 + Math.sin(i * 0.7) * 6, y]);
  }
  const outer = side * (w / 2);
  const pts: [number, number][] =
    side < 0 ? [[outer, -h / 2], ...tear, [outer, h / 2]] : [[outer, -h / 2], ...tear, [outer, h / 2]];
  return paperPolygon(pts, { seed: 420 + side });
};
const HALVES = { left: tornHalf(-1), right: tornHalf(1) } as const;

const DOC = { x: 960, y: 470, w: 1240, h: 620 } as const;
const QUOTE = [
  "“Rather than banks lending out deposits",
  "that are placed with them,",
] as const;
const PUNCHLINE = "the act of lending creates deposits.”";

export const S04Twist: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    notHow: T.cue("notHow"),
    boe2014: T.cue("boe2014"),
    published: T.cue("published"),
    quote: T.cue("quote"),
    actOfLending: T.cue("actOfLending"),
    plainWords: T.cue("plainWords"),
    newMoney: T.cue("newMoney"),
  };

  // "it's not how it works": the textbook page rips down the middle; the halves fall away.
  const rip = ramp(f2, cue.notHow, 30, EASE.in);
  const shake = 0;
  const label = leave(frame, cue.notHow, [120, 900], 26);

  const doc = enter(frame, cue.boe2014, { from: [0, 900], dur: 16, seed: 2 });
  const tab = enter(frame, cue.published, { from: [300, 0], dur: 12, seed: 3, wobbleDeg: 3 });
  const lineIn = (i: number) => enter(frame, cue.quote + i * 52, { from: [0, -40], dur: 10, seed: 10 + i });
  const punch = enter(frame, cue.actOfLending, { from: [0, -160], dur: 14, seed: 20, wobbleDeg: 2 });
  // "In plain words": the first lines slide off; the amber line moves up; the plain version drops in.
  const clear = leave(frame, cue.plainWords, [-1500, 0], 16);
  const plain = enter(frame, cue.plainWords + 24, { from: [0, 300], dur: 14, seed: 21 });
  // "it creates new money": the document folds into a paper plane and flies off.
  const fold = ramp(f2, cue.newMoney, 8, EASE.in);
  const fly = ramp(f2, cue.newMoney + 8, 24, EASE.in);

  return (
    <SceneRoot>
      {/* The textbook page, then its two torn halves */}
      {rip < 1 ? (
        <>
          {rip === 0 ? <TextbookPage dx={shake} /> : null}
          {rip > 0 && [-1, 1].map((side) => (
            <Piece
              key={side}
              x={PAGE.x + side * rip * 420 + shake}
              y={PAGE.y + rip * rip * 900}
              rotate={side * rip * 14}
            >
              <PaperSvg w={PAGE.w + 60} h={PAGE.h + 60}>
                <PaperShape
                  d={side < 0 ? HALVES.left : HALVES.right}
                  fill={PAPER_COLORS.kraft.light}
                  depth={1 + rip * 1.5}
                  shadowOpacity={THEME.shadow}
                />
              </PaperSvg>
            </Piece>
          ))}
          {!label.gone ? (
            <Piece x={960 + label.dx} y={210 + label.dy} rotate={-2 + label.t * 30}>
              <Label text="The money multiplier" fontSize={56} strip={COLORS.primary} depth={1.4} seed={392} />
            </Piece>
          ) : null}
        </>
      ) : null}

      {/* Bank of England, 2014 */}
      {doc.on && fly < 1 ? (
        <Piece
          x={DOC.x + doc.dx + fly * 1400}
          y={DOC.y + doc.dy - fly * 900}
          rotate={doc.rotate - fly * 30}
          scale={mix(1, 0.25, fold)}
          scaleY={mix(1, 0.15, fold)}
        >
          {fold < 1 ? (
            <>
              <Doc w={DOC.w} h={DOC.h} />
              <Words text="Bank of England, 2014" size={52} y={-DOC.h / 2 + 70} depth={0.4} />
              {tab.on ? (
                <Piece x={DOC.w / 2 - 170 + tab.dx} y={-DOC.h / 2 - 6 + tab.dy} rotate={tab.rotate + 3}>
                  <Label text="Quarterly Bulletin" fontSize={36} strip={COLORS.coral} ink={COLORS.primary} seed={440} />
                </Piece>
              ) : null}
              {QUOTE.map((line, i) => {
                const e = lineIn(i);
                return e.on && !clear.gone ? (
                  <Piece key={i} x={e.dx + clear.dx} y={-70 + i * 76 + e.dy} rotate={e.rotate * 0.3}>
                    <Words text={line} size={50} weight={500} depth={0.4} />
                  </Piece>
                ) : null;
              })}
              {punch.on ? (
                <Piece x={punch.dx} y={mix(118, -40, clear.t) + punch.dy} rotate={punch.rotate - 1}>
                  <Label text={PUNCHLINE} fontSize={54} strip={THEME.amber} depth={2.2 + punch.lift} seed={450} padX={34} />
                </Piece>
              ) : null}
              {plain.on ? (
                <Piece x={plain.dx} y={140 + plain.dy} rotate={plain.rotate + 1}>
                  <Label text="A new loan = new money" fontSize={54} strip={THEME.ink} ink={COLORS.primary} depth={1.6 + plain.lift} seed={451} />
                </Piece>
              ) : null}
            </>
          ) : (
            <PaperSvg w={300} h={200}>
              <PaperShape
                d={paperPolygon(
                  [
                    [-120, 40],
                    [130, -10],
                    [-60, -60],
                  ],
                  { seed: 460 },
                )}
                fill={PAPER_COLORS.kraft.light}
                depth={2.4}
                shadowOpacity={THEME.shadow}
              />
            </PaperSvg>
          )}
        </Piece>
      ) : null}

      <SourceLine text={SOURCES.boeCreation} frame={frame} at={cue.boe2014 + 10} />
    </SceneRoot>
  );
};
