import type React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, PAPER_COLORS, TEXT_OPACITY } from "../../../brand/tokens";
import { At, PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { PaperText } from "../../../components/paper/PaperText";
import { paperPolygon, paperRect, paperRoundRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { LABELS, SOURCES } from "../data";
import { Bank, Box, enter, FlipNumber, Label, leave, Ledger, SourceLine, track, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s09-iou");

const CARD = { w: 380, h: 220 } as const;
const LEDGER = { x: 960, y: 650, w: 1000, h: 400 } as const;
const OWES_X = LEDGER.x + LEDGER.w / 4;
const OWNS_X = LEDGER.x - LEDGER.w / 4;
const HEADING_Y = LEDGER.y - LEDGER.h / 2 + 60;

/** The balance card from Scene 01: light-blue front with the flip digits, navy backing. */
export const BalanceCard: React.FC<{ readonly frame: number }> = ({ frame }) => (
  <>
    <PaperSvg w={CARD.w + 40} h={CARD.h + 40}>
      <PaperShape d={paperRoundRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 22, { seed: 5 })} fill={THEME.ink} depth={1.4} shadowOpacity={THEME.shadow} />
      <PaperShape d={paperRoundRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 22, { seed: 6 })} fill={THEME.card} depth={0} />
    </PaperSvg>
    <At x={0} y={-62}>
      <PaperText color={THEME.ink} fontSize={36} weight={500} depth={0} style={{ opacity: TEXT_OPACITY.secondary }}>
        Balance
      </PaperText>
    </At>
    <Piece x={0} y={22}>
      <FlipNumber text={LABELS.balance} frame={frame} flipAt={-100} size={80} seed={900} />
    </Piece>
  </>
);

/** The back of the card: the IOU. */
const IouCard: React.FC = () => (
  <>
    <PaperSvg w={CARD.w + 40} h={CARD.h + 40}>
      <PaperShape d={paperRoundRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 22, { seed: 907 })} fill={PAPER_COLORS.kraft.light} depth={1.4} shadowOpacity={THEME.shadow} />
    </PaperSvg>
    <Words text="IOU" size={84} y={-52} depth={0.6} />
    <Words text="The bank owes you" size={36} y={22} weight={500} depth={0} />
    <Words text={LABELS.balance} size={48} y={70} depth={0.3} />
  </>
);

export const S09Iou: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    iou: T.cue("iou"),
    whenDeposit: T.cue("whenDeposit"),
    books: T.cue("books"),
    owes: T.cue("owes"),
    keepAside: T.cue("keepAside"),
    sinceMarch: T.cue("sinceMarch"),
    zeroPercent: T.cue("zeroPercent"),
  };

  const drop = enter(frame, T.anchor, { from: [0, -800], dur: 16, seed: 1, wobbleDeg: 3 });
  // The card flips over like a playing card on "It's an IOU".
  const flip = ramp(f2, cue.iou, 12, EASE.inOut);
  const sx = Math.max(Math.abs(Math.cos(Math.PI * flip)), 0.03);
  const bank = enter(frame, cue.whenDeposit, { from: [-600, 0], dur: 14, seed: 2 });
  const arrow = enter(frame, cue.whenDeposit + 30, { from: [0, -150], dur: 10, seed: 3 });
  const bankOut = leave(frame, cue.books, [-900, 0], 14);
  const ledger = enter(frame, cue.books, { from: [0, 700], dur: 16, seed: 4 });
  const card = track(frame, [
    [0, 960, 380],
    [cue.books + 30, OWES_X, LEDGER.y + 40],
  ], 22);
  const cardScale = mix(1.4, 0.82, ramp(f2, cue.books + 8, 22, EASE.inOut));
  const underline = ramp(f2, cue.owes, 12, EASE.out);
  const out = leave(frame, cue.keepAside, [0, 1000], 18);
  const box = enter(frame, cue.keepAside, { from: [0, 700], dur: 16, seed: 5 });
  const lid = ramp(f2, cue.keepAside + 22, 16, EASE.inOut);
  const zero = enter(frame, cue.sinceMarch, { from: [0, -700], dur: 10, seed: 6, wobbleDeg: 3 });
  const since = enter(frame, cue.sinceMarch + 16, { from: [0, -200], dur: 12, seed: 7, wobbleDeg: 6 });
  const pulse = 1 + 0.07 * Math.sin(Math.PI * ramp(f2, cue.zeroPercent, 10, EASE.inOut));

  return (
    <SceneRoot>
      {!out.gone ? (
        <div style={{ position: "absolute", inset: 0, translate: `0px ${out.dy}px` }}>
          {bank.on && !bankOut.gone ? (
            <>
              <Piece x={300 + bank.dx + bankOut.dx} y={420 + bank.dy} rotate={bank.rotate} scale={0.75}>
                <Bank seed={910} label="Your bank" />
              </Piece>
              {arrow.on ? (
                <Piece x={545 + arrow.dx + bankOut.dx} y={400 + arrow.dy} rotate={arrow.rotate}>
                  <PaperSvg w={300} h={120}>
                    <PaperShape
                      d={paperPolygon(
                        [
                          [-110, -10],
                          [70, -10],
                          [70, -34],
                          [120, 0],
                          [70, 34],
                          [70, 10],
                          [-110, 10],
                        ],
                        { seed: 911 },
                      )}
                      fill={PAPER_COLORS.kraft.base}
                      depth={1.2}
                      shadowOpacity={THEME.shadow}
                    />
                  </PaperSvg>
                  <Words text="owes you" size={38} y={-50} depth={0.4} />
                </Piece>
              ) : null}
            </>
          ) : null}

          {ledger.on ? (
            <>
              <Piece x={LEDGER.x + ledger.dx} y={LEDGER.y + ledger.dy}>
                <Ledger w={LEDGER.w} h={LEDGER.h} />
              </Piece>
              <Piece x={OWNS_X + ledger.dx} y={HEADING_Y + ledger.dy}>
                <Words text="Bank owns" size={52} depth={0.8} />
              </Piece>
              <Piece x={OWES_X + ledger.dx} y={HEADING_Y + ledger.dy}>
                <Words text="Bank owes" size={52} depth={0.8} />
              </Piece>
              {underline > 0 ? (
                <Piece x={OWES_X - 130 + 130 * underline} y={HEADING_Y + 44}>
                  <div style={{ scale: `${underline} 1` }}>
                    <PaperSvg w={300} h={40}>
                      <PaperShape d={paperRect(-130, -9, 260, 18, { seed: 912, torn: "ends" })} fill={THEME.amber} depth={1} shadowOpacity={THEME.shadow} />
                    </PaperSvg>
                  </div>
                </Piece>
              ) : null}
            </>
          ) : null}

          {drop.on ? (
            <Piece x={card.x + drop.dx} y={card.y + drop.dy} rotate={drop.rotate + idleJitter(frame, 913)} scale={cardScale}>
              <div style={{ scale: `${sx} 1` }}>{flip < 0.5 ? <BalanceCard frame={frame} /> : <IouCard />}</div>
            </Piece>
          ) : null}
        </div>
      ) : null}

      {/* Required reserves: an empty box, and 0% since March 2020 */}
      {box.on ? (
        <Piece x={720 + box.dx} y={600 + box.dy} rotate={box.rotate} scale={1.3}>
          <Box open={lid} />
          <Words text="Required reserves" size={40} y={170} depth={0.6} />
        </Piece>
      ) : null}
      {zero.on ? (
        <Piece x={1290 + zero.dx} y={500 + zero.dy} rotate={zero.rotate - 3} scale={pulse}>
          <Label text={LABELS.reserveRequirement} fontSize={220} strip={THEME.amber} depth={2.2 + zero.lift} seed={914} padX={30} />
        </Piece>
      ) : null}
      {since.on ? (
        <Piece x={1290 + since.dx} y={760 + since.dy} rotate={since.rotate + 3}>
          <Label text={LABELS.reserveZeroSince} fontSize={44} strip={PAPER_COLORS.kraft.light} seed={915} />
        </Piece>
      ) : null}

      <SourceLine text={SOURCES.regD} frame={frame} at={cue.sinceMarch} />
    </SceneRoot>
  );
};
