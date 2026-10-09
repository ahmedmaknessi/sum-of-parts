import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { enter, ExampleTag, Label, leave } from "../../../components/paper/kit";
import { Piece } from "../../../components/paper/Piece";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { ISLAND, LABELS } from "../data";
import { ArrowLabel, Globe, Island, Loaf, MarketTable, Palm, PaperNote, PressOutput, PriceTag, PrintingPress } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s03-island");

const ISLE = { x: 960, y: 730 } as const;
const TABLE = { x: 1000, y: 744, w: 1120 } as const;
/** Loaves sit in one row of ten on the table. */
const loafPos = (k: number) => ({ x: TABLE.x - 4.5 * 104 + k * 104, y: 690 });
const NOTE_ROW = { x0: 1010 - 4.5 * 118, dx: 118, y: 320, y2: 440 } as const;
const PRESS = { x: 1640, y: 600 } as const;
const PALM = { x: 250, y: 600 } as const;

export const S03Island: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    tiny: T.cue("tiny"),
    imagine: T.cue("imagine"),
    loaves: T.cue("loaves"),
    tenDollars: T.cue("tenDollars"),
    oneDollar: T.cue("oneDollar"),
    decides: T.cue("decides"),
    prints: T.cue("prints"),
    twiceMoney: T.cue("twiceMoney"),
    onlyTen: T.cue("onlyTen"),
    bakers: T.cue("bakers"),
    towardTwo: T.cue("towardTwo"),
    nobodyRicher: T.cue("nobodyRicher"),
    doubled: T.cue("doubled"),
    halfAsMuch: T.cue("halfAsMuch"),
    simplest: T.cue("simplest"),
    chasing: T.cue("chasing"),
  };
  const idle = idleJitter(frame, 31);

  // "let's shrink the economy... something tiny": the whole world shrinks to a dot.
  const globe = enter(frame, T.anchor, { from: [0, -900], dur: 16, seed: 1 });
  const shrink = ramp(f2, cue.tiny, 40, EASE.inOut);
  const globeGone = f2 >= cue.imagine + 6;

  // The island rises out of the sea; waves slide on twos.
  const rise = ramp(f2, cue.imagine, 20, EASE.settle);
  const wave = Math.sin(f2 * 0.07) * 26;
  const palm = enter(frame, cue.imagine + 10, { from: [0, 500], dur: 14, seed: 2, wobbleDeg: 4 });
  const table = enter(frame, cue.loaves, { from: [0, 600], dur: 12, seed: 3 });

  // Stage 1 (the market) clears on "each dollar now buys half as much".
  const clearMarket = leave(frame, cue.halfAsMuch, [0, 900], 16);
  const marketOn = !clearMarket.gone;
  const bakerHop = (k: number) =>
    Math.sin(Math.PI * ramp(f2, cue.bakers + k * 3, 10, EASE.inOut)) * -26;
  const tagFlip = (k: number) => cue.towardTwo + 2 + k * 4;
  const doubledPulse = 1 + 0.08 * Math.sin(Math.PI * ramp(f2, cue.doubled, 14, EASE.inOut));

  const press = enter(frame, cue.decides, { from: [700, 0], dur: 16, seed: 4 });
  const printTimes = Array.from({ length: ISLAND.printed }, (_, k) => cue.prints + 8 + k * 6);

  const money = enter(frame, cue.twiceMoney, { from: [0, -400], dur: 12, seed: 5 });
  const bread = enter(frame, cue.onlyTen, { from: [0, -400], dur: 12, seed: 6 });
  const counters = leave(frame, cue.nobodyRicher, [0, -400], 12);
  const nobody = enter(frame, cue.nobodyRicher + 8, { from: [0, -400], dur: 12, seed: 7, wobbleDeg: 3 });

  // Stage 2: one dollar against half a loaf.
  const one = enter(frame, cue.halfAsMuch + 14, { from: [-900, 0], dur: 14, seed: 8 });
  const split = ramp(f2, cue.halfAsMuch + 34, 16, EASE.inOut);
  const clearHalf = leave(frame, cue.chasing, [0, 900], 14);
  const inflation = enter(frame, cue.simplest, { from: [0, -500], dur: 12, seed: 9, wobbleDeg: 3 });

  // Stage 3: "more money chasing the same amount of stuff": a conga line around the island.
  const conga = ramp(f2, cue.chasing, 16, EASE.out);
  const run = (f2 - cue.chasing) * 0.035;
  const congaItems = Array.from({ length: ISLAND.loaves + ISLAND.money + ISLAND.printed }, (_, k) => k);
  const congaPos = (k: number) => {
    const a = run - k * 0.2 - 0.6;
    return { x: 960 + Math.cos(a) * 640, y: 560 + Math.sin(a) * 250, a };
  };

  return (
    <SceneRoot>
      <ExampleTag frame={frame} at={T.anchor + 8} text="Simplified example" />

      {globe.on && !globeGone ? (
        <Piece x={960 + globe.dx} y={520 + globe.dy} rotate={globe.rotate + f2 * 0.2} scale={mix(1, 0.04, shrink)}>
          <Globe r={300} />
        </Piece>
      ) : null}

      {rise > 0 ? (
        <Piece x={ISLE.x} y={ISLE.y + mix(500, 0, rise)}>
          <Island t={1} wave={wave} />
        </Piece>
      ) : null}
      {palm.on ? (
        <Piece x={PALM.x + palm.dx} y={PALM.y + palm.dy} rotate={palm.rotate}>
          <Palm sway={Math.sin(f2 * 0.05) * 3} />
        </Piece>
      ) : null}

      {marketOn && table.on ? (
        <Piece x={TABLE.x + table.dx} y={TABLE.y + table.dy + clearMarket.dy} rotate={table.rotate}>
          <MarketTable w={TABLE.w} />
        </Piece>
      ) : null}

      {/* Ten loaves drop onto the table one by one; each gets a $1 tag that flips to $2. */}
      {marketOn
        ? Array.from({ length: ISLAND.loaves }, (_, k) => {
            const l = enter(frame, cue.loaves + 8 + k * 4, { from: [0, -700], dur: 10, seed: 10 + k, wobbleDeg: 5 });
            if (!l.on) return null;
            const p = loafPos(k);
            const tagOn = f2 >= cue.oneDollar + k * 3;
            const flipped = f2 >= tagFlip(k) + 2;
            const squash = f2 >= tagFlip(k) && f2 < tagFlip(k) + 4 ? 0.2 : 1;
            return (
              <Piece key={k} x={p.x + l.dx} y={p.y + l.dy + bakerHop(k) + clearMarket.dy} rotate={l.rotate + idle}>
                <Loaf w={96} seed={40 + k} />
                {tagOn ? (
                  <Piece x={0} y={-58} rotate={(k % 2 ? 4 : -4)} scaleY={squash}>
                    <PriceTag text={flipped ? LABELS.islandAfter : LABELS.islandBefore} fill={flipped ? COLORS.coral : PAPER_COLORS.kraft.light} size={36} seed={60 + k} />
                  </Piece>
                ) : null}
              </Piece>
            );
          })
        : null}

      {/* Ten dollars in a row; ten more (amber, new) join from the press. */}
      {marketOn
        ? Array.from({ length: ISLAND.money }, (_, k) => {
            const n = enter(frame, cue.tenDollars + 2 + k * 3, { from: [0, -500], dur: 10, seed: 80 + k });
            if (!n.on) return null;
            return (
              <Piece key={k} x={NOTE_ROW.x0 + k * NOTE_ROW.dx + n.dx} y={NOTE_ROW.y + n.dy + clearMarket.dy} rotate={n.rotate + (k % 3) - 1} scale={doubledPulse}>
                <PaperNote w={100} fill={PAPER_COLORS.green.light} seed={100 + k} />
              </Piece>
            );
          })
        : null}
      {marketOn && press.on ? (
        <Piece x={PRESS.x + press.dx} y={PRESS.y + press.dy + clearMarket.dy} rotate={press.rotate} scale={0.5}>
          <PrintingPress spin={f2 >= cue.prints ? (f2 - cue.prints) * 8 : 0} />
        </Piece>
      ) : null}
      {marketOn ? (
        <Piece x={0} y={clearMarket.dy}>
          <Piece x={0} y={0} scale={1}>
            <PressOutput
              frame={frame}
              from={[PRESS.x, PRESS.y + 40]}
              times={printTimes}
              to={(k) => [NOTE_ROW.x0 + k * NOTE_ROW.dx, NOTE_ROW.y2]}
              fill={THEME.amber}
              w={100}
              travel={18}
            />
          </Piece>
        </Piece>
      ) : null}

      {!counters.gone && money.on ? (
        <Piece x={520 + money.dx} y={170 + money.dy + counters.dy} rotate={money.rotate - 1}>
          <ArrowLabel left={LABELS.islandMoney[0]} right={LABELS.islandMoney[1]} fontSize={48} strip={COLORS.primary} seed={120} />
        </Piece>
      ) : null}
      {!counters.gone && bread.on ? (
        <Piece x={1170 + bread.dx} y={170 + bread.dy + counters.dy} rotate={bread.rotate + 1}>
          <ArrowLabel left={LABELS.islandBread[0]} right={LABELS.islandBread[1]} fontSize={48} strip={PAPER_COLORS.kraft.light} seed={122} />
        </Piece>
      ) : null}
      {marketOn && nobody.on ? (
        <Piece x={960 + nobody.dx} y={170 + nobody.dy} rotate={nobody.rotate}>
          <Label text="Nobody got richer" fontSize={60} strip={THEME.ink} ink={COLORS.primary} depth={1.6 + nobody.lift} seed={124} torn />
        </Piece>
      ) : null}

      {/* One dollar now buys half a loaf: the loaf splits and half slides away. */}
      {!clearHalf.gone && one.on ? (
        <>
          <Piece x={700 + one.dx} y={460 + one.dy + clearHalf.dy} rotate={one.rotate - 3} scale={1.4}>
            <PaperNote w={240} value={LABELS.islandBefore} fill={PAPER_COLORS.green.light} seed={130} />
          </Piece>
          <Piece x={1200 - one.dx} y={460 + one.dy + clearHalf.dy} rotate={one.rotate}>
            <Piece x={0} y={0}>
              <Loaf w={340} seed={131} half="left" />
            </Piece>
            <Piece x={split * 420} y={split * 120} rotate={split * 18} opacity={1 - ramp(f2, cue.halfAsMuch + 50, 10)}>
              <Loaf w={340} seed={131} half="right" />
            </Piece>
          </Piece>
        </>
      ) : null}
      {!clearHalf.gone && inflation.on ? (
        <Piece x={960 + inflation.dx} y={170 + inflation.dy + clearHalf.dy} rotate={inflation.rotate - 2}>
          <Label text="Inflation" fontSize={76} strip={COLORS.coral} ink={COLORS.primary} depth={1.8 + inflation.lift} seed={132} torn />
        </Piece>
      ) : null}

      {conga > 0
        ? congaItems.map((k) => {
            const p = congaPos(k);
            const isLoaf = k < ISLAND.loaves;
            const hop = Math.abs(Math.sin(f2 * 0.3 + k)) * -14;
            return (
              <Piece key={k} x={p.x} y={p.y + hop + (1 - conga) * 700} rotate={Math.sin(f2 * 0.3 + k) * 8}>
                {isLoaf ? (
                  <Loaf w={110} seed={140 + k} />
                ) : (
                  <PaperNote w={100} fill={k >= ISLAND.loaves + ISLAND.money ? THEME.amber : PAPER_COLORS.green.light} seed={160 + k} />
                )}
              </Piece>
            );
          })
        : null}
    </SceneRoot>
  );
};
