import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, PAPER_COLORS, TEXT_OPACITY } from "../../../brand/tokens";
import { enter, Label, leave, Words } from "../../../components/paper/kit";
import { Piece } from "../../../components/paper/Piece";
import { PaperText } from "../../../components/paper/PaperText";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { BettingSlip, Loaf, PaperNote, PrintingPress } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s10-takeaway");

const PRESS = { x: 760, y: 450 } as const;
const SHRINKING = 5;

export const S10Takeaway: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    worth: T.cue("worth"),
    buysLess: T.cue("buysLess"),
    trusting: T.cue("trusting"),
    printMoney: T.cue("printMoney"),
    printBread: T.cue("printBread"),
    education: T.cue("education"),
    newSeries: T.cue("newSeries"),
    sportsbooks: T.cue("sportsbooks"),
    youDo: T.cue("youDo"),
    seeYou: T.cue("seeYou"),
  };
  const idle = idleJitter(frame, 101);

  const question = enter(frame, T.anchor, { from: [0, -400], dur: 12, seed: 1, wobbleDeg: 3 });
  const pair = enter(frame, cue.worth, { from: [0, 800], dur: 14, seed: 2 });
  const stage1Out = leave(frame, cue.printMoney, [0, 1000], 12);
  const pale = ramp(f2, cue.trusting, 12, EASE.out);

  const press = enter(frame, cue.printMoney + 6, { from: [-900, 0], dur: 14, seed: 3 });
  const noteOut = ramp(f2, cue.printMoney + 16, 18, EASE.settle);
  const loafOut = ramp(f2, cue.printBread + 2, 10, EASE.out) * 0.4;
  const jam = f2 >= cue.printBread + 16 && f2 < cue.printBread + 34 ? Math.sin(f2 * 2.2) * 4 : 0;
  const huh = enter(frame, cue.printBread + 30, { from: [0, -500], dur: 10, seed: 4, wobbleDeg: 8 });
  const line1 = enter(frame, cue.printMoney + 10, { from: [-900, 0], dur: 12, seed: 5 });
  const line2 = enter(frame, cue.printBread + 10, { from: [900, 0], dur: 12, seed: 6 });
  const stage2Out = leave(frame, cue.newSeries, [0, 1000], 12);

  const series = enter(frame, cue.newSeries + 6, { from: [0, -900], dur: 16, seed: 7, wobbleDeg: 3 });
  const lift = ramp(f2, cue.sportsbooks, 16, EASE.inOut);
  const slip = enter(frame, cue.sportsbooks + 4, { from: [0, 900], dur: 16, seed: 8, wobbleDeg: 3 });
  const pulse = 1 + 0.05 * Math.sin(Math.PI * ramp(f2, cue.youDo, 10, EASE.inOut)) + 0.03 * Math.sin(Math.PI * ramp(f2, cue.seeYou, 10, EASE.inOut));

  return (
    <SceneRoot>
      {!stage1Out.gone ? (
        <>
          {question.on ? (
            <Piece x={960 + question.dx} y={170 + question.dy + stage1Out.dy} rotate={question.rotate - 1}>
              <Label text="Why not print as much as we want?" fontSize={56} strip={THEME.ink} ink={COLORS.primary} depth={1.6 + question.lift} seed={10001} torn />
            </Piece>
          ) : null}
          {pair.on ? (
            <>
              <Piece x={700 + pair.dx} y={470 + pair.dy + stage1Out.dy} rotate={pair.rotate - 3 + idle}>
                <PaperNote w={320} value="$" fill={PAPER_COLORS.green.light} seed={10010} />
              </Piece>
              <Piece x={1220 - pair.dx} y={470 + pair.dy + stage1Out.dy} rotate={pair.rotate + 2 - idle}>
                <Loaf w={300} seed={10011} />
              </Piece>
            </>
          ) : null}
          {Array.from({ length: SHRINKING }, (_, k) => {
            const n = enter(frame, cue.buysLess + 2 + k * 8, { from: [900, 0], dur: 12, seed: 10020 + k });
            if (!n.on) return null;
            const last = k === SHRINKING - 1;
            return (
              <Piece key={k} x={520 + k * 220 + n.dx} y={800 + n.dy + stage1Out.dy} rotate={n.rotate + (k % 2 ? 3 : -3)} scale={mix(1, 0.35, k / (SHRINKING - 1))} opacity={last ? mix(1, 0.3, pale) : 1}>
                <PaperNote w={240} value="$" fill={PAPER_COLORS.green.light} seed={10030 + k} />
              </Piece>
            );
          })}
        </>
      ) : null}

      {press.on && !stage2Out.gone ? (
        <>
          <Piece x={PRESS.x + press.dx + jam} y={PRESS.y + press.dy + stage2Out.dy} rotate={press.rotate}>
            <PrintingPress spin={f2 < cue.printBread + 16 ? f2 * 8 : (cue.printBread + 16) * 8} />
          </Piece>
          {noteOut > 0 ? (
            <Piece x={PRESS.x + mix(120, 520, noteOut)} y={PRESS.y + 140 + stage2Out.dy} rotate={-4}>
              <PaperNote w={240} value="$" fill={PAPER_COLORS.green.light} seed={10040} />
            </Piece>
          ) : null}
          {loafOut > 0 ? (
            <Piece x={PRESS.x + mix(100, 400, loafOut)} y={PRESS.y + 100 + stage2Out.dy} rotate={jam * 2}>
              <Loaf w={200} seed={10041} />
            </Piece>
          ) : null}
          {huh.on ? (
            <Piece x={PRESS.x + 260 + huh.dx} y={PRESS.y - 220 + huh.dy + stage2Out.dy} rotate={huh.rotate}>
              <PaperText color={THEME.ink} fontSize={180} depth={1.6 + huh.lift} shadowOpacity={THEME.shadow}>
                ?
              </PaperText>
            </Piece>
          ) : null}
          {line1.on ? (
            <Piece x={960 + line1.dx} y={820 + line1.dy + stage2Out.dy} rotate={line1.rotate - 1}>
              <Label text="You can print money." fontSize={60} strip={COLORS.primary} depth={1.4 + line1.lift} seed={10050} />
            </Piece>
          ) : null}
          {line2.on ? (
            <Piece x={960 + line2.dx} y={920 + line2.dy + stage2Out.dy} rotate={line2.rotate + 1}>
              <Label text="You can't print bread." fontSize={60} strip={THEME.amber} depth={1.6 + line2.lift} seed={10051} />
            </Piece>
          ) : null}
        </>
      ) : null}

      {series.on ? (
        <Piece x={960 + series.dx} y={mix(480, 260, lift) + series.dy} rotate={series.rotate + idle} scale={mix(1, 0.8, lift)}>
          <Label text="How They Take Your Money" fontSize={84} strip={THEME.ink} ink={THEME.amber} depth={2 + series.lift} seed={10060} torn />
          <Piece x={0} y={120}>
            <Words text="Episode 1" size={56} />
          </Piece>
        </Piece>
      ) : null}
      {slip.on ? (
        <Piece x={960 + slip.dx} y={720 + slip.dy} rotate={slip.rotate - 2} scale={pulse}>
          <BettingSlip lines={["Sportsbooks don't gamble.", "You do."]} />
        </Piece>
      ) : null}

      {frame >= cue.education && frame < cue.newSeries ? (
        <div
          style={{
            position: "absolute",
            right: 128,
            top: 96,
            fontFamily: FONT.family,
            fontSize: 36,
            fontWeight: FONT.weight.body,
            color: THEME.ink,
            opacity: TEXT_OPACITY.secondary * ramp(f2, cue.education, 8),
          }}
        >
          Education, not financial advice
        </div>
      ) : null}
    </SceneRoot>
  );
};
