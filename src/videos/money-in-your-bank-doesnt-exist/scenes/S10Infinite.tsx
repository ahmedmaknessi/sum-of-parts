import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE } from "../../../brand/tokens";
import { Piece } from "../../../components/paper/Piece";
import { jitter } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { enter, Label, leave, Typewriter, Words } from "../parts/kit";
import { DIAL_X, emissions, MACHINE, MoneyMachine } from "../parts/machine";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s10-infinite");

/** The three limits, one per dial (script wording). */
const LIMITS = ["Borrowers who can repay", "Capital rules", "Interest rates"] as const;
const LABEL_Y = [MACHINE.y + MACHINE.h / 2 + 80, MACHINE.y + MACHINE.h / 2 + 170, MACHINE.y + MACHINE.h / 2 + 80] as const;
/** Label centres: the outer two pulled apart so the long first label never touches the third. */
const LABEL_X = [DIAL_X[0] - 160, DIAL_X[1], DIAL_X[2] + 180] as const;

/** Output schedule shared with Scene 11's opening (slow rate). */
export const SLOW_RATE = 22;

export const S10Infinite: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    infinite: T.cue("infinite"),
    threeThings: T.cue("threeThings"),
    makesSense: T.cue("makesSense"),
    borrowers: T.cue("borrowers"),
    capital: T.cue("capital"),
    rates: T.cue("rates"),
    lastOne: T.cue("lastOne"),
    ratesUp: T.cue("ratesUp"),
    fightInflation: T.cue("fightInflation"),
  };

  // "if banks can create money by typing": the typewriter clacks, then leaves for the machine.
  const typewriter = enter(frame, T.anchor, { from: [0, 500], dur: 14, seed: 1 });
  const twOut = leave(frame, cue.infinite, [0, 600], 14);
  const pressed = f2 < cue.infinite ? Math.floor(((jitter(1300, Math.floor(f2 / 4)) + 1) / 2) * 7) : -1;

  const title = enter(frame, cue.threeThings, { from: [0, -200], dur: 12, seed: 2 });
  const swapTitle = ramp(f2, cue.ratesUp + 120, 12, EASE.inOut);
  const result = enter(frame, cue.ratesUp + 126, { from: [0, -200], dur: 14, seed: 3, wobbleDeg: 3 });
  const resultPulse = 1 + 0.06 * Math.sin(Math.PI * ramp(f2, cue.fightInflation, 10, EASE.inOut));
  const labelAt = [cue.borrowers, cue.capital, cue.rates] as const;
  const lightAt = [cue.makesSense, cue.capital, cue.rates] as const;
  // Each dial lights up while it is being explained; "That last one matters most" keeps dial 3 lit, dims the others.
  const last = ramp(f2, cue.lastOne, 12, EASE.out);
  const lit = (i: number) => {
    const on = ramp(f2, lightAt[i], 10, EASE.out);
    const next = i < 2 ? ramp(f2, lightAt[i + 1], 10, EASE.inOut) : 0;
    return i === 2 ? Math.max(on, last) : on * (1 - next) * (1 - last);
  };
  // "When rates go up": dial 3 turns, the output slows.
  const turn = ramp(f2, cue.ratesUp, 30, EASE.inOut);
  const emitAt = emissions(cue.infinite + 40, T.duration, 6, cue.ratesUp + 10, SLOW_RATE);

  return (
    <SceneRoot>
      {typewriter.on && !twOut.gone ? (
        <Piece x={960 + typewriter.dx} y={760 + typewriter.dy + twOut.dy} rotate={typewriter.rotate} scale={1.2}>
          <Typewriter pressed={pressed} />
        </Piece>
      ) : null}

      <MoneyMachine
        frame={frame}
        buildAt={cue.infinite}
        emitAt={emitAt}
        dialAngle={[-40, 20, mix(-50, 70, turn)]}
        highlight={[lit(0), lit(1), lit(2)]}
        dim={[last, last, 0]}
      />

      {title.on && swapTitle < 1 ? (
        <Piece x={960 + title.dx} y={150 + title.dy - swapTitle * 300} rotate={title.rotate * 0.5}>
          <Words text="Three things stop them" size={64} depth={1 + title.lift} />
        </Piece>
      ) : null}
      {result.on ? (
        <Piece x={960 + result.dx} y={160 + result.dy} rotate={result.rotate - 1} scale={resultPulse}>
          <Label text="Higher rates = less new money" fontSize={56} strip={THEME.ink} ink={COLORS.primary} depth={1.6 + result.lift} seed={1310} />
        </Piece>
      ) : null}

      {LIMITS.map((text, i) => {
        const e = enter(frame, labelAt[i], { from: [0, 300], dur: 12, seed: 1320 + i, wobbleDeg: 3 });
        return e.on ? (
          <Piece key={text} x={LABEL_X[i] + e.dx} y={LABEL_Y[i] + e.dy} rotate={e.rotate + (i - 1) * 2}>
            <Label text={text} fontSize={44} strip={i === 2 ? THEME.amber : COLORS.primary} depth={1.2 + e.lift} seed={1330 + i} />
          </Piece>
        ) : null;
      })}
    </SceneRoot>
  );
};
