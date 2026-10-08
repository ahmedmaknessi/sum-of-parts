import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperDefs, PaperShape } from "../../../components/paper/PaperShape";
import { jitter, paperHill, paperPolygon, paperRect, paperRoundRect } from "../../../components/paper/paperPath";
import { formatUSD } from "../../../lib/finance";
import { mix, ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { EXAMPLES, LABELS, SOURCES } from "../data";
import { Car, enter, Entry, ExampleTag, FlipNumber, Label, leave, Ledger, SourceLine, track, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";
import { DEPOSIT_TEXT, ENTRY_Y, LedgerHeadings, LOAN_TEXT } from "./S05Watch";

const T = sceneTiming("s07-destroyed");

const SHIFT = -150;
const LEDGER = { x: 960 + SHIFT, y: 430, w: 980, h: 470 } as const;
const PAGE_X = { owns: LEDGER.x - LEDGER.w / 4, owes: LEDGER.x + LEDGER.w / 4 } as const;
const BANNER_Y = LEDGER.y + 120;
const SHREDDER = { x: 1620, y: 520 } as const;
const PAYMENTS = 4;
const ENTRY_W = 440;

/** The banner amount after k of the PAYMENTS repayments: +$20,000 ... +$0. */
const remaining = (k: number) => {
  const left = EXAMPLES.carLoan * (1 - k / PAYMENTS);
  return left === 0 ? LABELS.newMoneyGone : formatUSD(left, { signed: true });
};

// --- The town (from "It's created every time someone borrows") -----------------
type Building = { x: number; y: number; w: number; h: number; body: string; roof: string; scale: number };
const BUILDINGS: Building[] = [
  { x: 250, y: 760, w: 170, h: 150, body: PAPER_COLORS.rose.base, roof: PAPER_COLORS.rose.dark, scale: 0.9 },
  { x: 520, y: 700, w: 140, h: 220, body: PAPER_COLORS.sky.base, roof: PAPER_COLORS.sky.dark, scale: 0.85 },
  { x: 760, y: 780, w: 200, h: 140, body: PAPER_COLORS.kraft.base, roof: PAPER_COLORS.kraft.dark, scale: 1 },
  { x: 1010, y: 690, w: 150, h: 240, body: PAPER_COLORS.plum.base, roof: PAPER_COLORS.plum.dark, scale: 0.85 },
  { x: 1250, y: 770, w: 180, h: 150, body: PAPER_COLORS.leaf.base, roof: PAPER_COLORS.green.dark, scale: 0.95 },
  { x: 1490, y: 710, w: 140, h: 210, body: PAPER_COLORS.rose.light, roof: PAPER_COLORS.rose.dark, scale: 0.85 },
  { x: 1650, y: 780, w: 170, h: 140, body: PAPER_COLORS.sky.light, roof: PAPER_COLORS.sky.dark, scale: 0.9 },
];
const HOUSE = (b: Building, i: number) => ({
  body: paperRect(-b.w / 2, -b.h, b.w, b.h, { seed: 1000 + i }),
  roof: paperPolygon(
    [
      [-b.w / 2 - 18, -b.h],
      [0, -b.h - b.w * 0.45],
      [b.w / 2 + 18, -b.h],
    ],
    { seed: 1020 + i },
  ),
  door: paperRoundRect(-18, -60, 36, 60, 14, { seed: 1040 + i }),
});
const HOUSES = BUILDINGS.map(HOUSE);
const BACK_HILL = paperHill(-60, 1980, 640, 1100, { seed: 1060, amplitude: 50, waves: 1.5 });
const GROUND = paperRect(-40, 800, 2000, 320, { seed: 1061, straightTop: true });

/** Town events: an amber square (a new loan) pops up, or a cream one (a repayment) folds away. */
type TownEvent = { at: number; building: number; loan: boolean };
const townEvents = (start: number, end: number, mortgage: number, repayment: number): TownEvent[] => {
  const out: TownEvent[] = [];
  for (let t = start, k = 0; t < end; t += 14, k++) {
    out.push({ at: t, building: Math.floor(((jitter(1070, k) + 1) / 2) * BUILDINGS.length) % BUILDINGS.length, loan: jitter(1071, k) > -0.1 });
  }
  // Bursts on "Every mortgage..." (loans) and "Every repayment..." (repayments).
  [0, 2, 4].forEach((b, i) => out.push({ at: mortgage + i * 4, building: b, loan: true }));
  [1, 3, 5].forEach((b, i) => out.push({ at: repayment + i * 4, building: b, loan: false }));
  return out;
};

export const S07Destroyed: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    paysBack: T.cue("paysBack"),
    destroys: T.cue("destroys"),
    notFixed: T.cue("notFixed"),
    createdEvery: T.cue("createdEvery"),
    everyMortgage: T.cue("everyMortgage"),
    everyRepayment: T.cue("everyRepayment"),
  };

  const ledger = enter(frame, 0, { from: [0, 0], dur: 1, seed: 1 });
  const shredder = enter(frame, T.anchor, { from: [600, 0], dur: 16, seed: 2 });
  const away = leave(frame, cue.notFixed, [0, 1000], 18);
  // Payment k leaves the left edge and is fed into the shredder.
  const slipStart = (k: number) => cue.paysBack + k * 40;
  const slipIn = (k: number) => slipStart(k) + 28;
  const paid = [0, 1, 2, 3].filter((k) => f2 >= slipIn(k)).length;
  const shrink = (k: number) => ramp(f2, slipIn(k), 8, EASE.out);
  const entryW = ENTRY_W * (1 - [0, 1, 2, 3].reduce((s, k) => s + shrink(k), 0) / PAYMENTS);
  // The town follows the ledger out without a gap; its labels arrive on "created every time".
  const town = enter(frame, cue.notFixed + 14, { from: [0, 800], dur: 20, seed: 3 });
  const events = townEvents(cue.createdEvery + 20, T.duration - 10, cue.everyMortgage, cue.everyRepayment);

  return (
    <SceneRoot>
      <ExampleTag frame={frame} at={0} until={cue.notFixed} />

      {!away.gone ? (
        <div style={{ position: "absolute", inset: 0, translate: `0px ${away.dy}px` }}>
          <Piece x={LEDGER.x} y={LEDGER.y + ledger.dy}>
            <Ledger w={LEDGER.w} h={LEDGER.h} />
          </Piece>
          <div style={{ position: "absolute", inset: 0, translate: `${SHIFT}px 0px` }}>
            <LedgerHeadings frame={frame + 1000} at={0} />
          </div>
          {entryW > 4 ? (
            <>
              {/* Each repayment tears a piece off the right end of both strips (text cut with the paper) */}
              {[
                { x: PAGE_X.owns, text: LOAN_TEXT, fill: COLORS.primary, seed: 550 },
                { x: PAGE_X.owes, text: DEPOSIT_TEXT, fill: THEME.amber, seed: 551 },
              ].map((e) => (
                <div
                  key={e.seed}
                  style={{ position: "absolute", left: e.x - ENTRY_W / 2 - 20, top: ENTRY_Y - 60, width: entryW + 20, height: 120, overflow: "hidden" }}
                >
                  <Piece x={ENTRY_W / 2 + 20} y={60}>
                    <Entry text={e.text} fill={e.fill} w={ENTRY_W} seed={e.seed} />
                  </Piece>
                </div>
              ))}
            </>
          ) : null}

          {/* The banner's amount flips down with every repayment */}
          <Piece x={LEDGER.x} y={BANNER_Y} rotate={-1}>
            <PaperSvg w={720} h={130}>
              <PaperShape d={paperRect(-330, -44, 660, 88, { seed: 540 })} fill={THEME.amber} depth={1.6} shadowOpacity={THEME.shadow} />
            </PaperSvg>
            <Words text="New money:" size={52} x={-160} depth={0.3} />
            <Piece x={150} y={0}>
              <FlipNumber key={paid} text={remaining(paid)} frame={frame} flipAt={paid === 0 ? -100 : slipIn(paid - 1)} size={52} tile={COLORS.primary} seed={1080 + paid} />
            </Piece>
          </Piece>

          {/* The shredder, the payment slips and the confetti */}
          {shredder.on ? (
            <Piece x={SHREDDER.x + shredder.dx} y={SHREDDER.y} rotate={shredder.rotate * 0.5}>
              <PaperSvg w={340} h={340}>
                <PaperShape d={paperRoundRect(-130, -110, 260, 230, 24, { seed: 1090 })} fill={THEME.slate} depth={1.4} shadowOpacity={THEME.shadow} />
                <PaperShape d={paperRect(-90, -120, 180, 16, { seed: 1091 })} fill={THEME.ink} depth={0.6} shadowOpacity={THEME.shadow} />
                <PaperShape d={paperRect(-100, 108, 200, 14, { seed: 1092 })} fill={THEME.ink} depth={0.6} shadowOpacity={THEME.shadow} />
              </PaperSvg>
              <Words text="Shredder" size={36} y={0} color={COLORS.primary} depth={0.3} />
            </Piece>
          ) : null}
          {(() => {
            const tag = enter(frame, cue.paysBack, { from: [0, -160], dur: 10, seed: 1153, wobbleDeg: 4 });
            return tag.on ? (
              <Piece x={330 + tag.dx} y={720 + tag.dy} rotate={tag.rotate - 3}>
                <Label text="Monthly payments" fontSize={40} strip={PAPER_COLORS.kraft.light} seed={1154} />
              </Piece>
            ) : null;
          })()}
          {[0, 1, 2, 3].map((k) => {
            const p = track(frame, [
              [0, -200, 880],
              [slipStart(k) + 18, SHREDDER.x - 200, SHREDDER.y - 170],
              [slipIn(k), SHREDDER.x, SHREDDER.y - 130],
            ], 18);
            const sink = ramp(f2, slipIn(k) - 4, 10, EASE.in);
            return f2 >= slipStart(k) && sink < 1 ? (
              <Piece key={k} x={p.x} y={p.y + sink * 60} scaleY={1 - sink} origin="0px 30px" rotate={p.moving * 8}>
                <Label text="Payment" fontSize={40} strip={COLORS.primary} depth={1.2 + p.moving * 1.6} seed={1100 + k} />
              </Piece>
            ) : null;
          })}
          {Array.from({ length: 28 }, (_, k) => {
            const start = slipIn(Math.min(3, Math.floor(k / 7))) + (k % 7) * 3;
            const fall = ramp(f2, start, 40, EASE.in);
            if (fall <= 0 || fall >= 1) return null;
            return (
              <Piece
                key={k}
                x={SHREDDER.x - 80 + ((jitter(1110, k) + 1) / 2) * 160 + jitter(1111, k) * fall * 120}
                y={SHREDDER.y + 130 + fall * 520}
                rotate={jitter(1112, k) * 200 * fall}
              >
                <PaperSvg w={30} h={70}>
                  <PaperShape d={paperRect(-5, -26, 10, 52, { seed: 1120 + k })} fill={k % 3 === 0 ? THEME.amber : COLORS.primary} depth={1} shadowOpacity={THEME.shadow} />
                </PaperSvg>
              </Piece>
            );
          })}
        </div>
      ) : null}

      {/* The paper town: new loans pop up as amber squares, repayments fold away */}
      {town.on ? (
        <div style={{ position: "absolute", inset: 0, translate: `0px ${town.dy}px` }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <PaperShapeLayer />
          </svg>
          {BUILDINGS.map((b, i) => (
            <Piece key={i} x={b.x} y={b.y + 40} scale={b.scale}>
              <PaperSvg w={b.w + 120} h={(b.h + b.w) * 2 + 40}>
                <PaperShape d={HOUSES[i].body} fill={b.body} depth={1.2} shadowOpacity={THEME.shadow} />
                <PaperShape d={HOUSES[i].roof} fill={b.roof} depth={1.3} shadowOpacity={THEME.shadow} />
                <PaperShape d={HOUSES[i].door} fill={THEME.ink} depth={0.4} shadowOpacity={THEME.shadow} />
              </PaperSvg>
            </Piece>
          ))}
          <Piece x={600} y={950} scale={0.6}>
            <Car body={PAPER_COLORS.rose.base} />
          </Piece>
          <Piece x={1400} y={960} scale={0.55}>
            <Car body={PAPER_COLORS.sky.base} />
          </Piece>
          {events.map((ev, k) => {
            const b = BUILDINGS[ev.building];
            const top = b.y + 40 - (b.h + b.w * 0.45 + 70) * b.scale;
            const pop = enter(frame, ev.at, { from: [0, 40], dur: 8, seed: 1130 + k, wobbleDeg: 5 });
            if (!pop.on) return null;
            const fold = ev.loan ? 0 : ramp(f2, ev.at + 14, 10, EASE.in);
            const fade = ev.loan ? ramp(f2, ev.at + 60, 10, EASE.in) : 0;
            if (fold >= 1 || fade >= 1) return null;
            return (
              <Piece
                key={k}
                x={b.x + jitter(1131, k) * 30}
                y={top + pop.dy - (ev.loan ? ramp(f2, ev.at, 60, EASE.out) * 30 : 0)}
                rotate={pop.rotate}
                scale={mix(1, 0, fade)}
                scaleY={1 - fold}
              >
                <PaperSvg w={90} h={90}>
                  <PaperShape d={paperRoundRect(-26, -26, 52, 52, 8, { seed: 1140 + k })} fill={ev.loan ? THEME.amber : COLORS.primary} depth={1.2 + pop.lift} shadowOpacity={THEME.shadow} />
                </PaperSvg>
              </Piece>
            );
          })}
          {(() => {
            const labels = enter(frame, cue.createdEvery, { from: [0, -200], dur: 12, seed: 1152, wobbleDeg: 4 });
            return labels.on ? (
              <>
                <Piece x={330 + labels.dx} y={160 + labels.dy} rotate={labels.rotate - 2}>
                  <Label text="New loan" fontSize={40} strip={THEME.amber} seed={1150} />
                </Piece>
                <Piece x={640 + labels.dx} y={160 + labels.dy} rotate={labels.rotate + 2}>
                  <Label text="Repayment" fontSize={40} strip={COLORS.primary} seed={1151} />
                </Piece>
              </>
            ) : null;
          })()}
        </div>
      ) : null}

      <SourceLine text={SOURCES.boeShort} frame={frame} at={cue.destroys} until={cue.notFixed + 10} />
    </SceneRoot>
  );
};

/** The town's back hill and ground, as one SVG layer. */
const PaperShapeLayer: React.FC = () => (
  <>
    <PaperDefs />
    <PaperShape d={BACK_HILL} fill={PAPER_COLORS.leaf.light} depth={1} shadowOpacity={THEME.shadow} />
    <PaperShape d={GROUND} fill={PAPER_COLORS.green.base} depth={1.4} shadowOpacity={THEME.shadow} />
  </>
);
