import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { jitter, paperCircle, paperRect, paperRoundRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { LABELS } from "../data";
import { Car, enter, Entry, ExampleTag, Label, Ledger, Piggy, Sarah, track, Typewriter, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s05-watch");

/** The ledger and its slots (shared with Scenes 07 and 09). */
export const LEDGER = { x: 960, y: 430, w: 980, h: 470 } as const;
export const PAGE_X = { owns: LEDGER.x - LEDGER.w / 4, owes: LEDGER.x + LEDGER.w / 4 } as const;
export const HEADING_Y = LEDGER.y - LEDGER.h / 2 + 62;
export const ENTRY_Y = LEDGER.y - 50;
export const BANNER_Y = LEDGER.y + 120;
export const LOAN_TEXT = `Loan to Sarah: ${LABELS.carLoan}`;
export const DEPOSIT_TEXT = `Sarah's deposit: ${LABELS.carLoan}`;
export const BANNER_TEXT = `New money: ${LABELS.newMoney}`;

const TYPEWRITER = { x: 960, y: 880 } as const;
/** Where a strip sits while it is being typed (just above the typewriter's bail). */
const TYPING_Y = TYPEWRITER.y - 150;
const CHAR_FRAMES = 4;
/** Frames Sarah takes to walk in. */
const WALK = 36;
const SARAH = { x: 250, y: 560 } as const;
const CAR = { x: 290, y: 900 } as const;
const FORM = { x: 1630, y: 340 } as const;
const PIGGIES = [1480, 1610, 1740] as const;
const PIGGY_Y = 860;

/** Ledger headings ("Bank owns" / "Bank owes"). */
export const LedgerHeadings: React.FC<{ readonly frame: number; readonly at: number }> = ({ frame, at }) => (
  <>
    {(["owns", "owes"] as const).map((side, i) => {
      const e = enter(frame, at + i * 8, { from: [0, -60], dur: 10, seed: 520 + i });
      return e.on ? (
        <Piece key={side} x={PAGE_X[side] + e.dx} y={HEADING_Y + e.dy} rotate={e.rotate}>
          <Words text={side === "owns" ? "Bank owns" : "Bank owes"} size={52} depth={0.8 + e.lift} />
        </Piece>
      ) : null;
    })}
  </>
);

/** A strip typed out letter by letter above the typewriter, then laid on its page. */
const TypedStrip: React.FC<{
  readonly frame: number;
  readonly at: number;
  readonly text: string;
  readonly fill: string;
  readonly toX: number;
  readonly seed: number;
}> = ({ frame, at, text, fill, toX, seed }) => {
  const f = onTwos(frame);
  if (f < at) return null;
  const typed = Math.min(text.length, Math.floor((f - at) / CHAR_FRAMES) + 1);
  const done = at + text.length * CHAR_FRAMES;
  const p = track(frame, [
    [0, TYPEWRITER.x, TYPING_Y],
    [done + 22, toX, ENTRY_Y],
  ], 18);
  return (
    <Piece x={p.x} y={p.y} rotate={p.moving * 4 + idleJitter(frame, seed)}>
      <Entry text={text.slice(0, typed).padEnd(text.length, " ")} fill={fill} seed={seed} depth={1 + p.moving * 1.8} />
    </Piece>
  );
};

/** End of the typing windows, for the key presses. */
const typingEnd = (at: number, text: string) => at + text.length * CHAR_FRAMES;

export const S05Watch: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    sarahWalks: T.cue("sarahWalks"),
    carLoan: T.cue("carLoan"),
    approves: T.cue("approves"),
    notTake: T.cue("notTake"),
    twoEntries: T.cue("twoEntries"),
    sarahOwes: T.cue("sarahOwes"),
    accountShows: T.cue("accountShows"),
    didntExist: T.cue("didntExist"),
    nobodyPrinted: T.cue("nobodyPrinted"),
    typed: T.cue("typed"),
  };
  const loanAt = cue.sarahOwes;
  const depositAt = cue.accountShows;

  const ledger = enter(frame, T.anchor, { from: [0, 900], dur: 16, seed: 1 });
  const typewriter = enter(frame, T.anchor + 10, { from: [0, 500], dur: 14, seed: 2 });
  const walk = track(frame, [
    [0, -250, SARAH.y],
    [cue.sarahWalks + WALK, SARAH.x, SARAH.y],
  ], WALK);
  const bob = walk.moving > 0 ? Math.abs(Math.sin(f2 * 0.55)) * -16 : 0;
  const car = enter(frame, cue.carLoan, { from: [-700, 0], dur: 16, seed: 3 });
  const form = enter(frame, cue.carLoan + 30, { from: [500, 0], dur: 14, seed: 4 });
  // The stamp drops on "approves", presses, and lifts away, leaving the mark.
  const stampDrop = ramp(f2, cue.approves, 6, EASE.in);
  const stampLift = ramp(f2, cue.approves + 14, 12, EASE.out);
  const stamped = f2 >= cue.approves + 6;
  const piggies = enter(frame, cue.notTake, { from: [0, 500], dur: 14, seed: 5 });
  // The bank's paper hand reaches toward the other customers' savings, then pulls back.
  const reach = ramp(f2, cue.notTake + 6, 22, EASE.inOut) * (1 - ramp(f2, cue.notTake + 52, 22, EASE.inOut));
  const banner = ramp(f2, cue.didntExist, 18, EASE.out);
  const notPrinted = enter(frame, cue.nobodyPrinted, { from: [0, 160], dur: 10, seed: 6, wobbleDeg: 4 });
  const notSaved = enter(frame, cue.nobodyPrinted + 40, { from: [0, 160], dur: 10, seed: 7, wobbleDeg: 4 });

  // Keys press on twos while a strip is being typed, plus one last press on "The bank typed it".
  const typing = (from: number, to: number) => f2 >= from && f2 < to;
  const pressed =
    typing(loanAt, typingEnd(loanAt, LOAN_TEXT)) || typing(depositAt, typingEnd(depositAt, DEPOSIT_TEXT))
      ? Math.floor(((jitter(530, Math.floor(f2 / 4)) + 1) / 2) * 7)
      : f2 >= cue.typed && f2 < cue.typed + 8
        ? 3
        : -1;

  return (
    <SceneRoot>
      <ExampleTag frame={frame} at={T.anchor + 6} />

      {ledger.on ? (
        <Piece x={LEDGER.x + ledger.dx} y={LEDGER.y + ledger.dy} rotate={ledger.rotate * 0.5}>
          <Ledger w={LEDGER.w} h={LEDGER.h} />
        </Piece>
      ) : null}
      <LedgerHeadings frame={frame} at={cue.twoEntries} />

      {/* "New money: +$20,000": a banner that unrolls inside the ledger */}
      {banner > 0 ? (
        <Piece x={LEDGER.x - 300 + 300 * banner} y={BANNER_Y} scale={1} rotate={-1}>
          <div style={{ scale: `${banner} 1` }}>
            <Label text={BANNER_TEXT} fontSize={52} strip={THEME.amber} depth={1.6} seed={540} />
          </div>
        </Piece>
      ) : null}
      {notPrinted.on ? (
        <Piece x={LEDGER.x - 330 + notPrinted.dx} y={BANNER_Y + 96 + notPrinted.dy} rotate={notPrinted.rotate - 4}>
          <Label text="Not printed" fontSize={38} strip={PAPER_COLORS.kraft.light} seed={541} />
        </Piece>
      ) : null}
      {notSaved.on ? (
        <Piece x={LEDGER.x + 330 + notSaved.dx} y={BANNER_Y + 96 + notSaved.dy} rotate={notSaved.rotate + 4}>
          <Label text="Not saved" fontSize={38} strip={PAPER_COLORS.kraft.light} seed={542} />
        </Piece>
      ) : null}

      {/* The typewriter, and the two strips it types */}
      {typewriter.on ? (
        <Piece x={TYPEWRITER.x + typewriter.dx} y={TYPEWRITER.y + typewriter.dy} rotate={typewriter.rotate * 0.5}>
          <Typewriter pressed={pressed} />
        </Piece>
      ) : null}
      <TypedStrip frame={frame} at={loanAt} text={LOAN_TEXT} fill={COLORS.primary} toX={PAGE_X.owns} seed={550} />
      <TypedStrip frame={frame} at={depositAt} text={DEPOSIT_TEXT} fill={THEME.amber} toX={PAGE_X.owes} seed={551} />

      {/* Sarah and her car; her name tag pins up as she is introduced */}
      {(() => {
        const tag = enter(frame, cue.sarahWalks, { from: [0, -200], dur: 10, seed: 595, wobbleDeg: 5 });
        return tag.on ? (
          <Piece x={SARAH.x + tag.dx} y={SARAH.y - 250 + tag.dy} rotate={tag.rotate - 3}>
            <Label text="Sarah" fontSize={44} strip={PAPER_COLORS.rose.light} seed={596} />
          </Piece>
        ) : null;
      })()}
      <Piece x={walk.x} y={walk.y + bob}>
        <Sarah size={0.9} />
      </Piece>
      {car.on ? (
        <>
          <Piece x={CAR.x + car.dx} y={CAR.y + car.dy} rotate={car.rotate} scale={0.85}>
            <Car wheel={car.dx * -0.6} />
          </Piece>
          <Piece x={CAR.x + 140 + car.dx} y={CAR.y - 120 + car.dy} rotate={6 + car.rotate}>
            <Label text={LABELS.carLoan} fontSize={40} strip={PAPER_COLORS.kraft.light} seed={560} />
          </Piece>
        </>
      ) : null}

      {/* The loan form and the APPROVED stamp */}
      {form.on ? (
        <Piece x={FORM.x + form.dx} y={FORM.y + form.dy} rotate={form.rotate + 3}>
          <PaperSvg w={340} h={240}>
            <PaperShape d={paperRect(-150, -100, 300, 200, { seed: 570 })} fill={COLORS.primary} depth={1.2} shadowOpacity={THEME.shadow} />
            {[0, 1, 2].map((k) => (
              <line key={k} x1={-110} x2={110} y1={-30 + k * 34} y2={-30 + k * 34} stroke={COLORS.mutedStrong} strokeOpacity={0.35} strokeWidth={3} />
            ))}
          </PaperSvg>
          <Words text="Car loan" size={38} y={-68} depth={0} />
          {stamped ? (
            <Piece x={0} y={20} rotate={-10}>
              <Label text="APPROVED" fontSize={42} strip={THEME.amber} depth={0.6} seed={571} />
            </Piece>
          ) : null}
          {stampLift < 1 && stampDrop > 0 ? (
            <Piece x={0} y={mix(-320, -40, stampDrop) - stampLift * 320}>
              <PaperSvg w={200} h={260}>
                <PaperShape d={paperRoundRect(-30, -150, 60, 110, 26, { seed: 572 })} fill={PAPER_COLORS.kraft.base} depth={2.2} shadowOpacity={THEME.shadow} />
                <PaperShape d={paperRect(-80, -50, 160, 50, { seed: 573 })} fill={THEME.ink} depth={2.2} shadowOpacity={THEME.shadow} />
              </PaperSvg>
            </Piece>
          ) : null}
        </Piece>
      ) : null}

      {/* Other customers' savings: untouched */}
      {piggies.on ? (
        <>
          {PIGGIES.map((x, i) => (
            <Piece key={x} x={x + piggies.dx} y={PIGGY_Y + piggies.dy} rotate={piggies.rotate + (i - 1) * 3} scale={0.75}>
              <Piggy seed={580 + i * 10} />
            </Piece>
          ))}
          <Piece x={PIGGIES[1] + piggies.dx} y={PIGGY_Y - 120 + piggies.dy}>
            <Words text="Other customers" size={36} depth={0.4} />
          </Piece>
        </>
      ) : null}
      {reach > 0 ? (
        <Piece x={LEDGER.x + LEDGER.w / 2 - 20} y={LEDGER.y + 180} rotate={38}>
          <PaperSvg w={700} h={120}>
            <PaperShape d={paperRoundRect(0, -16, 60 + reach * 300, 32, 16, { seed: 590 })} fill={THEME.ink} depth={1.6} shadowOpacity={THEME.shadow} />
            <PaperShape d={paperCircle(70 + reach * 300, 0, 30, { seed: 591 })} fill={PAPER_COLORS.kraft.light} depth={1.6} shadowOpacity={THEME.shadow} />
          </PaperSvg>
        </Piece>
      ) : null}
    </SceneRoot>
  );
};
