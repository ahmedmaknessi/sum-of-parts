import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { jitter, paperRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { FACTS, LABELS } from "../data";
import { enter, Label, Shield, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s12-insurance");

const STRIP = { x: 1240, base: 900, h: 600, w: 190 } as const;
const INSURED_H = STRIP.h * (1 - FACTS.svb.uninsuredShare);
const UNINSURED_H = STRIP.h - INSURED_H;

export const S12Insurance: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    twoFifty: T.cue("twoFifty"),
    since1933: T.cue("since1933"),
    atSvb: T.cue("atSvb"),
    ninetyFour: T.cue("ninetyFour"),
    notInsured: T.cue("notInsured"),
    coveredEveryone: T.cue("coveredEveryone"),
  };

  const shield = enter(frame, T.anchor, { from: [0, -900], dur: 16, seed: 1, wobbleDeg: 3 });
  const limit = enter(frame, cue.twoFifty, { from: [0, 120], dur: 12, seed: 2 });
  const since = enter(frame, cue.since1933, { from: [0, -200], dur: 12, seed: 3, wobbleDeg: 6 });
  // "At Silicon Valley Bank": the shield steps aside for SVB's deposit strip.
  const aside = ramp(f2, cue.atSvb, 18, EASE.inOut);
  const strip = enter(frame, cue.atSvb, { from: [0, 800], dur: 16, seed: 4 });
  const split = ramp(f2, cue.ninetyFour, 10, EASE.out);
  const uninsured = enter(frame, cue.ninetyFour + 4, { from: [200, 0], dur: 12, seed: 5, wobbleDeg: 3 });
  const insured = enter(frame, cue.ninetyFour + 14, { from: [200, 0], dur: 12, seed: 6, wobbleDeg: 3 });
  const shake = f2 >= cue.notInsured && f2 < cue.notInsured + 24 ? jitter(1600, f2) * 5 : 0;
  const cover = enter(frame, cue.coveredEveryone, { from: [0, 900], dur: 18, seed: 7 });

  return (
    <SceneRoot>
      {/* "regulators stepped in and covered everyone": a big second shield behind the strip */}
      {cover.on ? (
        <Piece x={STRIP.x + cover.dx} y={STRIP.base - STRIP.h / 2 - 30 + cover.dy} rotate={cover.rotate} scale={1.8}>
          <Shield fill={PAPER_COLORS.sky.dark} />
        </Piece>
      ) : null}

      {shield.on ? (
        <Piece x={mix(960, 520, aside) + shield.dx} y={mix(470, 520, aside) + shield.dy} rotate={shield.rotate} scale={mix(1.2, 0.9, aside)}>
          <Shield />
          {limit.on ? (
            <Piece x={limit.dx} y={20 + limit.dy} rotate={limit.rotate - 2}>
              <Label text={`${LABELS.fdicLimit} per depositor, per bank`} fontSize={44} strip={THEME.ink} ink={COLORS.primary} depth={1.8} seed={1610} />
            </Piece>
          ) : null}
          {since.on ? (
            <Piece x={since.dx} y={330 + since.dy} rotate={since.rotate + 3}>
              <Label text={LABELS.fdicSince} fontSize={44} strip={PAPER_COLORS.kraft.light} seed={1611} />
            </Piece>
          ) : null}
        </Piece>
      ) : null}

      {strip.on ? (
        <Piece x={STRIP.x + strip.dx + shake} y={STRIP.base + strip.dy}>
          <PaperSvg w={STRIP.w + 40} h={STRIP.h * 2 + 40}>
            <PaperShape d={paperRect(-STRIP.w / 2, -INSURED_H, STRIP.w, INSURED_H, { seed: 1620 })} fill={COLORS.primary} depth={1.3} shadowOpacity={THEME.shadow} />
            <PaperShape
              d={paperRect(-STRIP.w / 2, -STRIP.h - split * 10, STRIP.w, UNINSURED_H, { seed: 1621 })}
              fill={split > 0 ? THEME.amber : COLORS.primary}
              depth={1.3 + split * 0.8}
              shadowOpacity={THEME.shadow}
            />
          </PaperSvg>
          <Words text="SVB deposits" size={44} y={-STRIP.h - 60} depth={0.6} />
        </Piece>
      ) : null}
      {uninsured.on ? (
        <Piece x={STRIP.x + 330 + uninsured.dx} y={STRIP.base - STRIP.h / 2 + uninsured.dy} rotate={uninsured.rotate + 2}>
          <Label text={`${LABELS.svbUninsured} uninsured`} fontSize={52} strip={THEME.amber} depth={1.6} seed={1630} />
        </Piece>
      ) : null}
      {insured.on ? (
        <Piece x={STRIP.x + 260 + insured.dx} y={STRIP.base - INSURED_H / 2 + insured.dy} rotate={insured.rotate - 2}>
          <Label text="Insured" fontSize={40} strip={COLORS.primary} depth={1.2} seed={1631} />
        </Piece>
      ) : null}
    </SceneRoot>
  );
};
