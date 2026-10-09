import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { Bank, enter, Label } from "../../../components/paper/kit";
import { jitter } from "../../../components/paper/paperPath";
import { Piece } from "../../../components/paper/Piece";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { PaperNote, PressOutput, PrintingPress, RopeFence, Sign } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s09-who");

const FENCE = { x: 900, y: 600 } as const;
const PRESS = { x: 1480, y: 760 } as const;
const SIGNS = [
  { text: "Election", y: 330 },
  { text: "War", y: 590 },
  { text: "Crisis", y: 850 },
] as const;

export const S09Who: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    notPresident: T.cue("notPresident"),
    independent: T.cue("independent"),
    onPurpose: T.cue("onPurpose"),
    election: T.cue("election"),
    separated: T.cue("separated"),
    oneVote: T.cue("oneVote"),
    breaks: T.cue("breaks"),
    stories: T.cue("stories"),
  };
  const idle = idleJitter(frame, 91);

  const question = enter(frame, T.anchor, { from: [0, -400], dur: 12, seed: 1, wobbleDeg: 3 });
  const questionOut = enter(frame, cue.notPresident, { from: [0, 0], dur: 2, seed: 1 });
  const press = enter(frame, T.anchor + 10, { from: [900, 0], dur: 16, seed: 2 });
  const gov = enter(frame, cue.notPresident, { from: [-800, 0], dur: 14, seed: 3 });
  const parl = enter(frame, cue.notPresident + 10, { from: [-800, 0], dur: 14, seed: 4 });
  const fence = enter(frame, cue.notPresident + 24, { from: [0, -900], dur: 12, seed: 5 });
  const cb = enter(frame, cue.independent, { from: [0, -900], dur: 14, seed: 6 });
  const purpose = enter(frame, cue.onPurpose, { from: [0, -400], dur: 12, seed: 7, wobbleDeg: 4 });

  // Signs push toward the fence, then bounce back off it ("isn't one vote away").
  const push = ramp(f2, cue.separated, 60, EASE.inOut);
  const bounce = ramp(f2, cue.oneVote, 12, EASE.settle);
  // "When that separation breaks": the rope is cut and the government side reaches the press.
  const cut = ramp(f2, cue.breaks + 6, 12, EASE.in);
  const rush = ramp(f2, cue.breaks + 16, 24, EASE.inOut);
  const signX = mix(560, 780, push) - bounce * 160 * (1 - rush) + rush * (PRESS.x - 520 - 560);
  const pour = Array.from({ length: Math.max(0, Math.floor((T.duration - cue.breaks - 30) / 2)) }, (_, k) => cue.breaks + 30 + k * 2);
  const flood = ramp(f2, cue.stories, 30, EASE.in);

  return (
    <SceneRoot>
      {question.on && !questionOut.on ? (
        <Piece x={600 + question.dx} y={300 + question.dy} rotate={question.rotate - 2}>
          <Label text="Who decides?" fontSize={72} strip={THEME.ink} ink={COLORS.primary} depth={1.6 + question.lift} seed={9001} torn />
        </Piece>
      ) : null}
      {gov.on ? (
        <Piece x={300 + gov.dx + rush * 140} y={380 + gov.dy} rotate={gov.rotate + idle}>
          <Bank w={240} roof={PAPER_COLORS.kraft.base} label="Government" seed={9010} />
        </Piece>
      ) : null}
      {parl.on ? (
        <Piece x={300 + parl.dx + rush * 140} y={790 + parl.dy} rotate={parl.rotate - idle}>
          <Bank w={240} dome roof={PAPER_COLORS.plum.base} label="Parliament" seed={9020} />
        </Piece>
      ) : null}
      {fence.on ? (
        <Piece x={FENCE.x} y={FENCE.y + fence.dy} rotate={fence.rotate}>
          <RopeFence cut={cut} h={640} />
        </Piece>
      ) : null}
      {cb.on ? (
        <Piece x={PRESS.x + cb.dx} y={330 + cb.dy} rotate={cb.rotate}>
          <Bank w={280} roof={PAPER_COLORS.sky.dark} label="Central bank" seed={9030} />
        </Piece>
      ) : null}
      {purpose.on && f2 < cue.election ? (
        <Piece x={FENCE.x + purpose.dx} y={210 + purpose.dy} rotate={purpose.rotate + 3}>
          <Label text="On purpose" fontSize={48} strip={THEME.amber} depth={1.6 + purpose.lift} seed={9040} />
        </Piece>
      ) : null}
      {press.on ? (
        <Piece x={PRESS.x + press.dx} y={PRESS.y + press.dy} rotate={press.rotate} scale={0.62}>
          <PrintingPress spin={f2 * (rush > 0 ? 18 : 3)} />
        </Piece>
      ) : null}
      {SIGNS.map((s, k) => {
        const e = enter(frame, cue.election + k * 14, { from: [-500, 0], dur: 10, seed: 9050 + k, wobbleDeg: 8 });
        if (!e.on) return null;
        return (
          <Piece key={s.text} x={signX + e.dx} y={s.y + e.dy} rotate={e.rotate + (k - 1) * 4}>
            <Sign text={s.text} fill={COLORS.primary} seed={9060 + k * 3} />
          </Piece>
        );
      })}
      <PressOutput
        frame={frame}
        from={[PRESS.x + 80, PRESS.y + 60]}
        times={pour}
        to={(k) => [jitter(9070, k) * 900 + 1000, 1000 - flood * 900 + jitter(9071, k) * 400]}
        w={180}
        travel={16}
      />
      {flood > 0
        ? Array.from({ length: 40 }, (_, k) => (
            <Piece key={k} x={((k * 211) % 2100) - 90} y={mix(-300, ((k * 97) % 1200) - 60, ramp(f2, cue.stories + (k % 10) * 2, 20, EASE.out))} rotate={(k * 47) % 360}>
              <PaperNote w={260} fill={k % 3 ? PAPER_COLORS.green.light : PAPER_COLORS.green.base} seed={9100 + k} depth={1.6} />
            </Piece>
          ))
        : null}
    </SceneRoot>
  );
};
