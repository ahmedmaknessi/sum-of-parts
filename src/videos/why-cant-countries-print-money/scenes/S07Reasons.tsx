import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { Bank, enter, Figure, FIGURE_COLORS, Label, leave, SourceLine, Words } from "../../../components/paper/kit";
import { Piece } from "../../../components/paper/Piece";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { LABELS, SOURCES } from "../data";
import { FlipCard, Globe, House, Lever, MoneyStack, PaperNote, Thermometer } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s07-reasons");

const CARD = { y: 190, w: 380, h: 150, xs: [360, 760, 1160, 1560] as const } as const;
const TITLES = ["Timing", "Dollar demand", "Own currency", "Trust"] as const;
const STAGE_Y = 620;

export const S07Reasons: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    timing: T.cue("timing"),
    shutDown: T.cue("shutDown"),
    savingInstead: T.cue("savingInstead"),
    satStill: T.cue("satStill"),
    wholeWorld: T.cue("wholeWorld"),
    fiftySeven: T.cue("fiftySeven"),
    heldByBanks: T.cue("heldByBanks"),
    printACurrency: T.cue("printACurrency"),
    spreads: T.cue("spreads"),
    ownCurrency: T.cue("ownCurrency"),
    manyCountries: T.cue("manyCountries"),
    cantPrintDollars: T.cue("cantPrintDollars"),
    debtsBigger: T.cue("debtsBigger"),
    trust: T.cue("trust"),
    independentFed: T.cue("independentFed"),
    raisedRates: T.cue("raisedRates"),
    believed: T.cue("believed"),
  };
  const idle = idleJitter(frame, 71);
  const flips = [cue.timing, cue.wholeWorld, cue.ownCurrency, cue.trust] as const;
  const stage = (i: number) => {
    const inn = enter(frame, flips[i] + 10, { from: [0, 900], dur: 16, seed: 10 + i });
    const out = leave(frame, i < 3 ? flips[i + 1] : Infinity, [0, 1000], 14);
    return { on: inn.on && !out.gone, dy: inn.dy + out.dy, rotate: inn.rotate };
  };

  // 1. Timing: everyone home, the money piles up unspent.
  const s1 = stage(0);
  const home = enter(frame, cue.shutDown, { from: [-500, 0], dur: 14, seed: 19 });
  const saved = mix(2, 12, ramp(f2, cue.savingInstead, 50, EASE.inOut));
  const still = enter(frame, cue.satStill, { from: [0, -400], dur: 12, seed: 20, wobbleDeg: 3 });

  // 2. The world wants dollars: banks around the globe hold them; new ones spread out.
  const s2 = stage(1);
  const share = enter(frame, cue.fiftySeven, { from: [0, -400], dur: 12, seed: 21, wobbleDeg: 3 });
  const minted = ramp(f2, cue.printACurrency, 12, EASE.settle);
  const spread = ramp(f2, cue.spreads, 40, EASE.out);

  // 3. Own currency: the right-hand loan grows while its local currency shrinks.
  const s3 = stage(2);
  const them = enter(frame, cue.manyCountries, { from: [700, 0], dur: 14, seed: 22 });
  const local = mix(1, 0.45, ramp(f2, cue.cantPrintDollars + 2, 40, EASE.inOut));
  const debt = mix(1, 1.5, ramp(f2, cue.debtsBigger, 24, EASE.inOut));
  const cant = enter(frame, cue.cantPrintDollars, { from: [0, -40], dur: 10, seed: 26, wobbleDeg: 6 });
  const debtLabel = enter(frame, cue.debtsBigger + 8, { from: [0, 400], dur: 12, seed: 23 });

  // 4. Trust: an independent central bank pulls the rates lever; inflation comes down.
  const s4 = stage(3);
  const indep = enter(frame, cue.independentFed, { from: [0, -400], dur: 12, seed: 24, wobbleDeg: 3 });
  const pull = ramp(f2, cue.raisedRates, 14, EASE.settle);
  const cool = ramp(f2, cue.raisedRates + 20, 60, EASE.inOut);
  const believed = enter(frame, cue.believed, { from: [0, 400], dur: 12, seed: 25 });

  return (
    <SceneRoot>
      {CARD.xs.map((x, i) => {
        const e = enter(frame, T.anchor + i * 5, { from: [0, -500], dur: 12, seed: 1 + i });
        if (!e.on) return null;
        const active = f2 >= flips[i] && (i === 3 || f2 < flips[i + 1]);
        return (
          <Piece key={i} x={x + e.dx} y={CARD.y + e.dy + (active ? -10 : 0)} rotate={e.rotate + idle * (i % 2 ? 1 : -1)} scale={active ? 1.06 : 1}>
            <FlipCard frame={frame} at={flips[i]} w={CARD.w} h={CARD.h} number={String(i + 1)} seed={7000 + i}>
              <Words text={TITLES[i]} size={46} color={active ? THEME.ink : COLORS.mutedStrong} />
            </FlipCard>
          </Piece>
        );
      })}

      {s1.on ? (
        <Piece x={0} y={s1.dy}>
          <Piece x={620} y={STAGE_Y + 40} rotate={s1.rotate}>
            <House w={360} body={PAPER_COLORS.sky.light} roof={PAPER_COLORS.sky.dark} seed={7100} />
            {home.on ? (
              <Piece x={home.dx} y={30} rotate={home.rotate}>
                <Figure body={FIGURE_COLORS[0]} seed={7110} size={0.5} />
              </Piece>
            ) : null}
          </Piece>
          <Piece x={1240} y={STAGE_Y + 260} rotate={-s1.rotate}>
            <MoneyStack layers={saved} w={300} layerH={24} />
          </Piece>
          {still.on ? (
            <Piece x={1240 + still.dx} y={STAGE_Y - 180 + still.dy} rotate={still.rotate - 2}>
              <Label text="Money sat still" fontSize={56} strip={COLORS.primary} depth={1.6 + still.lift} seed={7120} />
            </Piece>
          ) : null}
        </Piece>
      ) : null}

      {s2.on ? (
        <Piece x={0} y={s2.dy}>
          <Piece x={800} y={STAGE_Y + 20} rotate={s2.rotate + f2 * 0.15}>
            <Globe r={210} />
          </Piece>
          {Array.from({ length: 6 }, (_, k) => {
            const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
            const b = enter(frame, cue.heldByBanks + k * 4, { from: [0, -500], dur: 10, seed: 7200 + k });
            if (!b.on) return null;
            return (
              <Piece key={k} x={800 + Math.cos(a) * 330 + b.dx} y={STAGE_Y + 20 + Math.sin(a) * 250 + b.dy} rotate={b.rotate}>
                <Bank w={110} seed={7210 + k * 10} />
              </Piece>
            );
          })}
          {Array.from({ length: 10 }, (_, k) => {
            if (minted <= 0) return null;
            const a = (k / 10) * Math.PI * 2;
            return (
              <Piece key={k} x={800 + Math.cos(a) * (40 + spread * 480)} y={STAGE_Y + 20 + Math.sin(a) * (30 + spread * 300)} rotate={k * 36 + f2} scale={minted}>
                <PaperNote w={90} fill={PAPER_COLORS.green.light} seed={7230 + k} />
              </Piece>
            );
          })}
          {share.on ? (
            <Piece x={1460 + share.dx} y={STAGE_Y - 60 + share.dy} rotate={share.rotate + 2}>
              <Label text={LABELS.usdShareNote} fontSize={52} strip={THEME.amber} depth={1.8 + share.lift} seed={7240} />
            </Piece>
          ) : null}
        </Piece>
      ) : null}
      <SourceLine text={SOURCES.cofer} frame={frame} at={cue.fiftySeven + 10} until={cue.ownCurrency} />

      {s3.on ? (
        <Piece x={0} y={s3.dy}>
          <Piece x={560} y={STAGE_Y + 80} rotate={s3.rotate}>
            <Figure body={FIGURE_COLORS[0]} seed={7300} size={0.9} />
            <Piece x={-200} y={-240} rotate={-4}>
              <Label text="Debt in $" fontSize={44} strip={PAPER_COLORS.kraft.light} seed={7301} />
            </Piece>
            <Piece x={150} y={20} rotate={6}>
              <PaperNote w={180} value="$" fill={PAPER_COLORS.green.light} seed={7302} />
            </Piece>
            <Piece x={0} y={140}>
              <Words text="United States" size={44} />
            </Piece>
          </Piece>
          {them.on ? (
            <Piece x={1360 + them.dx} y={STAGE_Y + 80 + them.dy} rotate={them.rotate}>
              <Figure body={FIGURE_COLORS[2]} seed={7310} size={0.9} />
              <Piece x={-200} y={-240} rotate={4} scale={debt}>
                <Label text="Debt in $" fontSize={44} strip={COLORS.coral} ink={COLORS.primary} seed={7311} />
              </Piece>
              {cant.on ? (
                <Piece x={170 + cant.dx} y={-120 + cant.dy} rotate={cant.rotate + 5}>
                  <Label text="Can't print $" fontSize={40} strip={COLORS.primary} depth={1.6 + cant.lift} seed={7313} />
                </Piece>
              ) : null}
              <Piece x={150} y={20} rotate={-6} scale={local}>
                <PaperNote w={180} value="Local" fill={PAPER_COLORS.plum.light} seed={7312} />
              </Piece>
              <Piece x={0} y={140}>
                <Words text="Other countries" size={44} />
              </Piece>
            </Piece>
          ) : null}
          {debtLabel.on ? (
            <Piece x={960 + debtLabel.dx} y={STAGE_Y + 300 + debtLabel.dy} rotate={debtLabel.rotate}>
              <Label text="Debt in someone else's currency" fontSize={48} strip={COLORS.primary} seed={7320} />
            </Piece>
          ) : null}
        </Piece>
      ) : null}

      {s4.on ? (
        <Piece x={0} y={s4.dy}>
          <Piece x={620} y={STAGE_Y + 60} rotate={s4.rotate}>
            <Bank w={340} roof={PAPER_COLORS.sky.dark} label="Central bank" seed={7400} />
          </Piece>
          <Piece x={960} y={STAGE_Y + 120} rotate={-s4.rotate}>
            <Lever pull={pull} />
            <Piece x={0} y={170}>
              <Words text="Rates" size={44} />
            </Piece>
          </Piece>
          <Piece x={1300} y={STAGE_Y + 30} scale={0.62}>
            <Thermometer level={mix(9.1 * 0.09, 0.35, cool)} />
          </Piece>
          {indep.on ? (
            <Piece x={620 + indep.dx} y={STAGE_Y - 220 + indep.dy} rotate={indep.rotate - 2}>
              <Label text="Independent central bank" fontSize={48} strip={THEME.amber} depth={1.8 + indep.lift} seed={7410} />
            </Piece>
          ) : null}
          {believed.on ? (
            <Piece x={1560 + believed.dx} y={STAGE_Y - 120 + believed.dy} rotate={believed.rotate + 3}>
              <Label text="People believed it" fontSize={44} strip={COLORS.primary} seed={7420} />
            </Piece>
          ) : null}
        </Piece>
      ) : null}
    </SceneRoot>
  );
};
