import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { Bank, CrossStrip, enter, Figure, FIGURE_COLORS, FlipNumber, Label, leave, Piggy, SourceLine, Words } from "../../../components/paper/kit";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { paperRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { LABELS, SOURCES } from "../data";
import { Crate, Factory, MapOutline, PaperNote, PressOutput, PrintingPress, Shop, SkyBody, Thermometer, Wallet } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s05-zimbabwe");

const MAP = { x: 420, y: 540, size: 520 } as const;
const PRESS = { x: 960, y: 380 } as const;
const GOV = { x: 1520, y: 400 } as const;
const FACTORY = { x: 1040, y: 790 } as const;
const BARS = { x: 560, w0: 360, y: [420, 640] as const, h: 110 } as const;
const WALLET = { x: 960, y: 640 } as const;
const SHOP = { x: 1300, y: 600 } as const;
const NOTES_X = 1440;

/** A horizontal paper bar growing from its left end. */
const Bar: React.FC<{ readonly w: number; readonly fill: string; readonly seed: number }> = ({ w, fill, seed }) => (
  <PaperSvg w={2 * w + 80} h={BARS.h + 40}>
    <PaperShape d={paperRect(0, -BARS.h / 2, w, BARS.h, { seed, torn: "ends" })} fill={fill} depth={1.2} shadowOpacity={THEME.shadow} />
  </PaperSvg>
);

export const S05Zimbabwe: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    payBills: T.cue("payBills"),
    lessAndLess: T.cue("lessAndLess"),
    moreFewer: T.cue("moreFewer"),
    peak: T.cue("peak"),
    seventyNine: T.cue("seventyNine"),
    thinkAbout: T.cue("thinkAbout"),
    paidMorning: T.cue("paidMorning"),
    evening: T.cue("evening"),
    saving: T.cue("saving"),
    spend: T.cue("spend"),
    faster: T.cue("faster"),
    april: T.cue("april"),
    stopped: T.cue("stopped"),
    switched: T.cue("switched"),
  };
  const idle = idleJitter(frame, 51);

  // Stage 1: the map, the press feeding the government, output shrinking.
  const map = enter(frame, T.anchor, { from: [-900, 0], dur: 16, seed: 1 });
  const mapAside = leave(frame, cue.moreFewer, [-900, 0], 16);
  const mapBack = enter(frame, cue.april + 2, { from: [-900, 0], dur: 16, seed: 2 });
  const stage1Out = leave(frame, cue.moreFewer, [0, 1000], 16);
  const press = enter(frame, cue.payBills, { from: [0, -800], dur: 14, seed: 3 });
  const gov = enter(frame, cue.payBills + 8, { from: [800, 0], dur: 14, seed: 4 });
  const stream = Array.from({ length: Math.floor((cue.moreFewer - cue.payBills - 20) / 7) }, (_, k) => cue.payBills + 20 + k * 7);
  const factory = enter(frame, cue.lessAndLess, { from: [0, 700], dur: 14, seed: 5 });
  const cratesLeft = 4 - Math.min(3, Math.max(0, Math.floor((f2 - cue.lessAndLess) / 12)));

  // Stage 2: money bar up, goods bar down; then the peak number.
  const bars = enter(frame, cue.moreFewer, { from: [0, 700], dur: 14, seed: 6 });
  const barsOut = leave(frame, cue.seventyNine, [0, 1000], 14);
  const grow = ramp(f2, cue.moreFewer + 10, 50, EASE.inOut);
  const peakTag = enter(frame, cue.peak, { from: [0, -500], dur: 12, seed: 7, wobbleDeg: 5 });
  const bigNumber = enter(frame, cue.seventyNine, { from: [0, -900], dur: 10, seed: 8, wobbleDeg: 2 });
  const numberOut = leave(frame, cue.thinkAbout, [0, -900], 14);

  // Stage 3: morning to evening, the note in the wallet shrinks.
  const wallet = enter(frame, cue.thinkAbout + 8, { from: [0, 800], dur: 14, seed: 9 });
  const dayOut = leave(frame, cue.spend, [0, 1000], 14);
  const sunUp = ramp(f2, cue.paidMorning, 24, EASE.out);
  const sunSet = ramp(f2, cue.evening, 30, EASE.inOut);
  const moonUp = ramp(f2, cue.evening + 20, 24, EASE.out);
  const shrink = mix(1, 0.22, ramp(f2, cue.evening + 6, 40, EASE.inOut));
  const piggy = enter(frame, cue.saving, { from: [600, 0], dur: 12, seed: 10 });
  const cross = enter(frame, cue.saving + 14, { from: [0, -300], dur: 8, seed: 11 });

  // Stage 4: everyone rushes to the shop; prices run up faster.
  const shop = enter(frame, cue.spend + 4, { from: [800, 0], dur: 14, seed: 12 });
  const stage4Out = leave(frame, cue.april, [0, 1000], 12);
  const therm = enter(frame, cue.faster, { from: [0, 800], dur: 12, seed: 13 });
  const heat = ramp(f2, cue.faster + 8, 40, EASE.inOut);

  // Stage 5: suspended; local notes become US dollars.
  const sign = enter(frame, cue.april + 10, { from: [0, -900], dur: 8, seed: 14, wobbleDeg: 3 });
  const notesIn = (k: number) => enter(frame, cue.stopped + k * 4, { from: [800, 0], dur: 12, seed: 15 + k });
  const flipAt = (k: number) => cue.switched + 2 + k * 5;

  const showMap1 = map.on && !mapAside.gone;
  return (
    <SceneRoot>
      {showMap1 ? (
        <Piece x={MAP.x + map.dx + mapAside.dx} y={MAP.y + map.dy} rotate={map.rotate + idle}>
          <MapOutline country="zimbabwe" size={MAP.size} fill={PAPER_COLORS.leaf.base} seed={5001} />
          <Piece x={0} y={MAP.size * 0.5} rotate={-2}>
            <Label text="Zimbabwe" fontSize={48} strip={COLORS.primary} seed={5002} />
          </Piece>
        </Piece>
      ) : null}

      {!stage1Out.gone ? (
        <>
          {gov.on ? (
            <Piece x={GOV.x + gov.dx} y={GOV.y + gov.dy + stage1Out.dy} rotate={gov.rotate}>
              <Bank w={300} dome roof={PAPER_COLORS.kraft.base} label="Government" seed={5010} />
            </Piece>
          ) : null}
          {press.on ? (
            <Piece x={PRESS.x + press.dx} y={PRESS.y + press.dy + stage1Out.dy} rotate={press.rotate} scale={0.62}>
              <PrintingPress spin={f2 * 8} />
            </Piece>
          ) : null}
          <Piece x={0} y={stage1Out.dy}>
            <PressOutput frame={frame} from={[PRESS.x + 60, PRESS.y + 60]} times={stream} to={() => [GOV.x - 40, GOV.y + 20]} w={110} travel={20} />
          </Piece>
          {factory.on ? (
            <Piece x={FACTORY.x + factory.dx} y={FACTORY.y + factory.dy + stage1Out.dy} rotate={factory.rotate} scale={0.7}>
              <Factory />
            </Piece>
          ) : null}
          {factory.on
            ? Array.from({ length: cratesLeft }, (_, k) => (
                <Piece key={k} x={FACTORY.x + 210 + k * 96} y={FACTORY.y + 40 + factory.dy + stage1Out.dy} rotate={(k % 2) * 3 - 1}>
                  <Crate seed={5020 + k} />
                </Piece>
              ))
            : null}
        </>
      ) : null}

      {bars.on && !barsOut.gone ? (
        <>
          {(["Money", "Goods"] as const).map((name, i) => {
            const w = i === 0 ? mix(BARS.w0, 1040, grow) : mix(BARS.w0 * 2, 200, grow);
            return (
              <Piece key={name} x={BARS.x + bars.dx} y={BARS.y[i] + bars.dy + barsOut.dy} rotate={bars.rotate * (i ? -1 : 1)}>
                <Bar w={w} fill={i === 0 ? PAPER_COLORS.green.base : PAPER_COLORS.kraft.base} seed={5030 + i} />
                <Piece x={-150} y={0}>
                  <Words text={name} size={56} />
                </Piece>
              </Piece>
            );
          })}
        </>
      ) : null}
      {peakTag.on && !numberOut.gone ? (
        <Piece x={960 + peakTag.dx} y={190 + peakTag.dy + numberOut.dy} rotate={peakTag.rotate - 3}>
          <Label text={LABELS.peakWhenShort} fontSize={48} strip={PAPER_COLORS.kraft.light} depth={1.4 + peakTag.lift} seed={5040} />
        </Piece>
      ) : null}
      {bigNumber.on && !numberOut.gone ? (
        <Piece x={960 + bigNumber.dx} y={500 + bigNumber.dy + numberOut.dy} rotate={bigNumber.rotate}>
          <FlipNumber text={LABELS.peak} frame={frame} flipAt={cue.seventyNine + 6} size={124} tile={THEME.amber} seed={5041} />
          <Piece x={0} y={150}>
            <Words text={LABELS.peakWhen} size={52} />
          </Piece>
        </Piece>
      ) : null}
      <SourceLine text={SOURCES.hanke} frame={frame} at={cue.seventyNine + 10} until={cue.thinkAbout} />

      {wallet.on && !dayOut.gone ? (
        <>
          {sunUp > 0 ? (
            <Piece x={mix(360, 1560, sunSet)} y={mix(860, 260, sunUp) + Math.sin(Math.PI * sunSet) * -60 + sunSet * 300} rotate={f2 * 0.5} scale={1 - sunSet * sunSet}>
              <SkyBody r={80} />
            </Piece>
          ) : null}
          {moonUp > 0 ? (
            <Piece x={380} y={mix(860, 250, moonUp)} scale={moonUp}>
              <SkyBody moon r={70} />
            </Piece>
          ) : null}
          <Piece x={WALLET.x + wallet.dx} y={WALLET.y + wallet.dy + dayOut.dy} rotate={wallet.rotate}>
            <Wallet />
            <Piece x={0} y={-120} rotate={-4} scale={shrink}>
              <PaperNote w={300} value="Z$" fill={PAPER_COLORS.kraft.light} seed={5050} depth={1.6} />
            </Piece>
          </Piece>
          {piggy.on ? (
            <Piece x={1450 + piggy.dx} y={680 + piggy.dy + dayOut.dy} rotate={piggy.rotate} scale={1.3}>
              <Piggy seed={5060} />
              {cross.on ? (
                <Piece x={0} y={cross.dy * 0.3} rotate={-18}>
                  <CrossStrip w={260} fill={COLORS.coral} seed={5061} />
                </Piece>
              ) : null}
            </Piece>
          ) : null}
        </>
      ) : null}

      {shop.on && !stage4Out.gone ? (
        <>
          <Piece x={SHOP.x + shop.dx} y={SHOP.y + shop.dy + stage4Out.dy} rotate={shop.rotate} scale={1.5}>
            <Shop />
          </Piece>
          {Array.from({ length: 4 }, (_, k) => {
            const run = ramp(f2, cue.spend + 10 + k * 12, 60, EASE.inOut);
            const x = mix(-150, SHOP.x - 420 + k * 70, run);
            const hop = Math.abs(Math.sin(f2 * 0.35 + k)) * -24 * (run < 1 ? 1 : 0);
            return (
              <Piece key={k} x={x} y={700 + hop + stage4Out.dy} rotate={run < 1 ? 6 : 0}>
                <Figure body={FIGURE_COLORS[k]} seed={5070 + k * 10} size={0.85} reach={run} />
                <Piece x={50 + ((f2 + k * 7) % 30)} y={-60 - ((f2 + k * 11) % 40)} rotate={(f2 * 7 + k * 40) % 360} opacity={run < 1 ? 1 : 0}>
                  <PaperNote w={100} fill={PAPER_COLORS.kraft.light} seed={5080 + k} />
                </Piece>
              </Piece>
            );
          })}
          {therm.on ? (
            <Piece x={1680 + therm.dx} y={540 + therm.dy + stage4Out.dy} rotate={therm.rotate} scale={0.8}>
              <Thermometer level={mix(0.35, 0.95, heat)} />
            </Piece>
          ) : null}
        </>
      ) : null}

      {mapBack.on ? (
        <Piece x={700 + mapBack.dx} y={560 + mapBack.dy} rotate={mapBack.rotate + idle}>
          <MapOutline country="zimbabwe" size={560} fill={PAPER_COLORS.leaf.base} seed={5001} />
          {sign.on ? (
            <Piece x={sign.dx} y={sign.dy} rotate={-8 + sign.rotate} scale={mix(1.4, 1, sign.t)}>
              <Label text={LABELS.suspended} fontSize={40} strip={COLORS.coral} ink={COLORS.primary} depth={2 + sign.lift} seed={5090} torn />
            </Piece>
          ) : null}
        </Piece>
      ) : null}
      {Array.from({ length: 4 }, (_, k) => {
        const n = notesIn(k);
        if (!n.on) return null;
        const at = flipAt(k);
        const flip = ramp(f2, at, 8, EASE.inOut);
        const us = flip >= 0.5;
        return (
          <Piece key={k} x={NOTES_X + n.dx} y={330 + k * 140 + n.dy} rotate={n.rotate + (k % 2 ? 3 : -3)} scaleY={Math.max(0.05, Math.abs(Math.cos(Math.PI * flip)))}>
            <PaperNote w={260} value={us ? "US$" : "Z$"} fill={us ? PAPER_COLORS.green.light : PAPER_COLORS.kraft.light} seed={5100 + k} />
          </Piece>
        );
      })}
    </SceneRoot>
  );
};
