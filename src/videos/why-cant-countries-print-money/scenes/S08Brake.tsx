import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { enter, Label, leave, Strip, Words } from "../../../components/paper/kit";
import { emissions, MoneyMachine } from "../../../components/paper/machine";
import { Piece } from "../../../components/paper/Piece";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { LABELS } from "../data";
import { BrakePedal } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s08-brake");

const STRIPS = { base: 880, w: 220, xs: [760, 1160] as const } as const;

export const S08Brake: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    createdByBanks: T.cue("createdByBanks"),
    higherRates: T.cue("higherRates"),
    brake: T.cue("brake"),
    alwaysBad: T.cue("alwaysBad"),
    littleInflation: T.cue("littleInflation"),
    twoPercent: T.cue("twoPercent"),
    slowly: T.cue("slowly"),
    danger: T.cue("danger"),
    faster: T.cue("faster"),
  };
  const idle = idleJitter(frame, 81);

  // The money machine from video 02 slides back in; higher rates slow its output.
  const machineIn = ramp(f2, 0, 18, EASE.settle);
  const machineOut = leave(frame, cue.alwaysBad, [0, 1100], 16);
  const callback = enter(frame, T.anchor + 6, { from: [0, -400], dur: 12, seed: 1, wobbleDeg: 5 });
  const emitAt = emissions(cue.createdByBanks, cue.alwaysBad, 7, cue.higherRates + 10, 30);
  const dial = ramp(f2, cue.higherRates, 16, EASE.settle);
  const press = ramp(f2, cue.brake + 8, 10, EASE.settle);
  const brakeIn = enter(frame, cue.brake, { from: [-600, 0], dur: 12, seed: 2 });

  // Economy and money grow together at about 2%, until money runs away and tears.
  const strips = enter(frame, cue.littleInflation, { from: [0, 30], dur: 14, seed: 3 });
  const steady = ramp(f2, cue.littleInflation + 10, cue.danger - cue.littleInflation, EASE.inOut);
  const runaway = ramp(f2, cue.faster, 30, EASE.inOut);
  // "A slowly growing money supply": both strips nod together.
  const nod = Math.sin(Math.PI * ramp(f2, cue.slowly, 14, EASE.inOut)) * 2;
  const sprout = ramp(f2, cue.littleInflation, 12, EASE.out);
  const econH = mix(20, 140, sprout) + 220 * steady;
  const moneyH = mix(20, 140, sprout) + 220 * steady + runaway * 760;
  // "So is printing money always bad?": the question holds the stage until the strips arrive.
  const ask = enter(frame, cue.alwaysBad + 8, { from: [0, -500], dur: 14, seed: 6, wobbleDeg: 3 });
  const askOut = leave(frame, cue.littleInflation, [0, -700], 12);
  const askNod = Math.sin(Math.PI * ramp(f2, cue.alwaysBad + 80, 16, EASE.inOut)) * 2;
  const target = enter(frame, cue.twoPercent, { from: [0, -400], dur: 12, seed: 4, wobbleDeg: 4 });
  const danger = enter(frame, cue.faster + 10, { from: [600, 0], dur: 12, seed: 5, wobbleDeg: 3 });

  return (
    <SceneRoot>
      {!machineOut.gone ? (
        <Piece x={mix(1400, 0, machineIn)} y={machineOut.dy}>
          <MoneyMachine
            frame={frame}
            buildAt={-200}
            emitAt={emitAt}
            dialAngle={[mix(-40, 90, dial), 20, -30]}
            highlight={[dial, 0, 0]}
            dim={[0, dial, dial]}
          />
          {f2 >= cue.higherRates + 6 ? (
            <Piece x={720} y={300} rotate={-3}>
              <Label text="Interest rates" fontSize={40} strip={THEME.amber} seed={8010} />
            </Piece>
          ) : null}
        </Piece>
      ) : null}
      {callback.on && !machineOut.gone ? (
        <Piece x={430 + callback.dx} y={190 + callback.dy + machineOut.dy} rotate={callback.rotate - 4}>
          <Label text="From the last video" fontSize={44} strip={PAPER_COLORS.kraft.light} depth={1.4 + callback.lift} seed={8001} />
        </Piece>
      ) : null}
      {brakeIn.on && !machineOut.gone ? (
        <Piece x={330 + brakeIn.dx} y={760 + machineOut.dy} rotate={brakeIn.rotate + idle}>
          <BrakePedal press={press} />
          <Piece x={0} y={170}>
            <Words text="Brake" size={48} />
          </Piece>
        </Piece>
      ) : null}

      {ask.on && !askOut.gone ? (
        <Piece x={960 + ask.dx} y={480 + ask.dy + askOut.dy} rotate={ask.rotate - 2 + askNod}>
          <Label text="Is printing money always bad?" fontSize={76} strip={THEME.ink} ink={COLORS.primary} depth={1.8 + ask.lift} seed={8050} torn />
        </Piece>
      ) : null}
      {strips.on ? (
        <>
          {STRIPS.xs.map((x, i) => (
            <Piece key={x} x={x} y={STRIPS.base + strips.dy} rotate={strips.rotate * (i ? -1 : 1) + nod}>
              <Strip w={STRIPS.w} h={i === 0 ? econH : moneyH} fill={i === 0 ? PAPER_COLORS.leaf.base : PAPER_COLORS.green.base} tornTop={i === 1 && runaway > 0.5} seed={8020 + i} />
              <Piece x={0} y={50}>
                <Words text={i === 0 ? "Economy" : "Money"} size={48} />
              </Piece>
            </Piece>
          ))}
          {target.on ? (
            <Piece x={STRIPS.xs[0] + target.dx} y={STRIPS.base - econH - 90 + target.dy} rotate={target.rotate}>
              <Label text={`${LABELS.target} a year`} fontSize={48} strip={COLORS.primary} depth={1.4 + target.lift} seed={8030} />
            </Piece>
          ) : null}
          {danger.on ? (
            <Piece x={1560 + danger.dx} y={420 + danger.dy} rotate={danger.rotate + 2}>
              <Label text="Too fast" fontSize={60} strip={COLORS.coral} ink={COLORS.primary} depth={1.6 + danger.lift} seed={8040} torn />
            </Piece>
          ) : null}
        </>
      ) : null}
    </SceneRoot>
  );
};
