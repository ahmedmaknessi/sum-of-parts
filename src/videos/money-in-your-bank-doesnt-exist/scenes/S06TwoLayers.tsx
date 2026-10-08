import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { jitter, paperCircle, paperPolygon, paperRect, paperRoundRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { LABELS } from "../data";
import { Bank, Banknote, Car, enter, ExampleTag, Figure, Label, leave, Sarah, track, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";
import { BANNER_TEXT } from "./S05Watch";

const T = sceneTiming("s06-two-layers");

const BANK_A = { x: 460, y: 430 } as const;
const BANK_B = { x: 1460, y: 430 } as const;
const DEALER = { x: 1290, y: 780 } as const;
const SARAH = { x: 260, y: 760 } as const;
const CAR = { x: 520, y: 880 } as const;
const BANNER = { x: 960, y: 160 } as const;
/** The lower paper layer under the table, revealed by tilting the camera down. */
const TILT = 470;
const LOWER_Y = 1080 + 300;
const CENTRAL = { x: 960, y: LOWER_Y - 10 } as const;
const RESERVE_PATH_Y = LOWER_Y + 130;

/** The two stacked sheets ("like a cake"): bank money on top, cash and reserves below. */
const TOP_SHEET = { x: 960, y: 370, w: 1500, h: 420 } as const;
const BOTTOM_SHEET = { x: 960, y: 760, w: 1500, h: 230 } as const;

const tokens = (n: number, seed: number, box: { x: number; y: number; w: number; h: number }) =>
  Array.from({ length: n }, (_, k) => ({
    x: box.x - box.w / 2 + 70 + ((jitter(seed, k) + 1) / 2) * (box.w - 140),
    y: box.y - box.h / 2 + 120 + ((jitter(seed + 1, k) + 1) / 2) * (box.h - 170),
    r: jitter(seed + 2, k) * 14,
  }));
const BANK_MONEY = tokens(26, 610, TOP_SHEET);
const RESERVE_TOKENS = tokens(4, 620, BOTTOM_SHEET);

export const S06TwoLayers: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    toDealer: T.cue("toDealer"),
    doesntVanish: T.cue("doesntVanish"),
    differentBank: T.cue("differentBank"),
    sendReal: T.cue("sendReal"),
    secondKind: T.cue("secondKind"),
    reserves: T.cue("reserves"),
    neverTouch: T.cue("neverTouch"),
    twoLayers: T.cue("twoLayers"),
    centralCreates: T.cue("centralCreates"),
    commercialBanks: T.cue("commercialBanks"),
  };

  // Camera tilts down to the lower layer on "reserves", back up for the two layers.
  const tilt = ramp(frame, cue.reserves, 30, EASE.inOut) * (1 - ramp(frame, cue.twoLayers, 24, EASE.inOut));
  // Phase 1 (the story) clears on "two layers"; phase 2 (the cake) slides in.
  const clear = leave(frame, cue.twoLayers, [0, -1400], 18);

  // Sarah gets in the car; the car drives off to the right.
  const intoCar = ramp(f2, T.anchor + 4, 12, EASE.inOut);
  const drive = ramp(f2, T.anchor + 20, 50, EASE.in);
  const token = track(frame, [
    [0, SARAH.x + 60, SARAH.y - 90],
    [cue.toDealer + 26, DEALER.x + 120, DEALER.y - 40],
  ], 26);
  const check = enter(frame, cue.doesntVanish, { from: [0, -120], dur: 10, seed: 3, wobbleDeg: 6 });
  const bankB = enter(frame, cue.differentBank, { from: [700, 0], dur: 16, seed: 4 });
  const gap = enter(frame, cue.sendReal, { from: [0, -200], dur: 12, seed: 5 });
  const reserve = track(frame, [
    [0, BANK_A.x + 10, BANK_A.y + 190],
    [cue.reserves + 26, BANK_A.x + 160, RESERVE_PATH_Y],
    [cue.reserves + 80, BANK_B.x - 160, RESERVE_PATH_Y],
    [cue.reserves + 110, BANK_B.x - 10, BANK_B.y + 190],
  ], 26);
  const reserveIn = enter(frame, cue.secondKind, { from: [0, -200], dur: 12, seed: 6 });
  const centralIn = enter(frame, cue.reserves, { from: [0, 400], dur: 16, seed: 7 });
  const reachOut = ramp(f2, cue.neverTouch, 14, EASE.out) * (1 - ramp(f2, cue.neverTouch + 30, 10, EASE.in));
  const barrier = enter(frame, cue.neverTouch + 8, { from: [0, -300], dur: 8, seed: 8, wobbleDeg: 4 });

  const top = enter(frame, cue.twoLayers + 6, { from: [0, -900], dur: 18, seed: 9 });
  const bottom = enter(frame, cue.twoLayers + 14, { from: [0, 700], dur: 18, seed: 10 });
  const liftBottom = ramp(f2, cue.centralCreates, 12, EASE.out) * (1 - ramp(f2, cue.commercialBanks, 12, EASE.inOut));
  const liftTop = ramp(f2, cue.commercialBanks, 12, EASE.out);

  return (
    <SceneRoot>
      <ExampleTag frame={frame} at={0} until={cue.twoLayers} />

      {!clear.gone ? (
        <div style={{ position: "absolute", inset: 0, translate: `${clear.dx}px ${clear.dy - tilt * TILT}px` }}>
          {/* The lower layer under the table: the central bank and its reserves */}
          {centralIn.on ? (
            <>
              <Piece x={960} y={LOWER_Y + 260 + centralIn.dy}>
                <PaperSvg w={2000} h={700}>
                  <PaperShape d={paperRect(-980, -330, 1960, 660, { seed: 630, torn: "ends" })} fill={PAPER_COLORS.kraft.base} depth={1} shadowOpacity={THEME.shadow} />
                </PaperSvg>
              </Piece>
              <Piece x={CENTRAL.x} y={CENTRAL.y + centralIn.dy} scale={1.05}>
                <Bank seed={640} roof={THEME.ink} label="Central bank" />
              </Piece>
            </>
          ) : null}
          {reachOut > 0 ? (
            <>
              <Piece x={250} y={LOWER_Y + 230}>
                <Figure body={PAPER_COLORS.sky.dark} seed={650} size={0.8} reach={reachOut} />
              </Piece>
            </>
          ) : null}
          {barrier.on ? (
            <Piece x={520 + barrier.dx} y={LOWER_Y + 150 + barrier.dy} rotate={barrier.rotate}>
              <PaperSvg w={80} h={300}>
                <PaperShape d={paperRect(-16, -120, 32, 240, { seed: 651 })} fill={THEME.slate} depth={1.6} shadowOpacity={THEME.shadow} />
              </PaperSvg>
            </Piece>
          ) : null}

          {/* The table: two banks, Sarah, the dealer */}
          <Piece x={BANK_A.x} y={BANK_A.y}>
            <Bank seed={660} label="Sarah's bank" />
          </Piece>
          {bankB.on ? (
            <Piece x={BANK_B.x + bankB.dx} y={BANK_B.y + bankB.dy} rotate={bankB.rotate}>
              <Bank seed={670} dome roof={PAPER_COLORS.plum.base} label="Dealer's bank" />
            </Piece>
          ) : null}
          {gap.on ? (
            <Piece x={960 + gap.dx} y={BANK_A.y + gap.dy} rotate={gap.rotate}>
              <PaperSvg w={560} h={120}>
                <PaperShape
                  d={paperPolygon(
                    [
                      [-230, -12],
                      [180, -12],
                      [180, -40],
                      [250, 0],
                      [180, 40],
                      [180, 12],
                      [-230, 12],
                    ],
                    { seed: 680 },
                  )}
                  fill={PAPER_COLORS.kraft.base}
                  depth={1.2}
                  shadowOpacity={THEME.shadow}
                />
              </PaperSvg>
              <Words text="?" size={96} y={-80} depth={1} />
            </Piece>
          ) : null}
          <Piece x={DEALER.x} y={DEALER.y}>
            <Figure body={PAPER_COLORS.green.dark} seed={690} size={0.85} reach={token.moving > 0 || f2 > cue.toDealer ? 0.5 : 0} />
          </Piece>
          {drive < 1 ? (
            <>
              <Piece x={CAR.x + drive * 1700} y={CAR.y} scale={0.85}>
                <Car wheel={drive * 1400} />
              </Piece>
              {intoCar < 1 ? (
                <Piece x={mix(SARAH.x, CAR.x - 20, intoCar)} y={mix(SARAH.y, CAR.y - 60, intoCar)} scale={mix(1, 0.3, intoCar)}>
                  <Sarah size={0.85} />
                </Piece>
              ) : null}
            </>
          ) : null}
          <Piece x={token.x} y={token.y} rotate={token.moving * 6}>
            <Label text={LABELS.carLoan} fontSize={40} strip={THEME.amber} depth={1.2 + token.moving * 1.6} seed={700} />
          </Piece>
          {reserveIn.on ? (
            <Piece x={reserve.x + reserveIn.dx} y={reserve.y + reserveIn.dy} rotate={reserve.moving * 8}>
              <Label text="Reserves" fontSize={40} strip={COLORS.teal} ink={COLORS.primary} depth={1.4 + reserve.moving * 1.6} seed={701} />
            </Piece>
          ) : null}

          {/* The banner from Scene 05 stays: the money didn't vanish */}
          <Piece x={BANNER.x} y={BANNER.y} rotate={-1}>
            <Label text={BANNER_TEXT} fontSize={52} strip={THEME.amber} depth={1.6} seed={540} />
          </Piece>
          {check.on ? (
            <Piece x={BANNER.x + 360 + check.dx} y={BANNER.y + check.dy} rotate={check.rotate}>
              <PaperSvg w={120} h={120}>
                <PaperShape d={paperCircle(0, 0, 40, { seed: 710 })} fill={PAPER_COLORS.green.base} depth={1.4} shadowOpacity={THEME.shadow} />
                <PaperShape
                  d={paperPolygon(
                    [
                      [-20, 0],
                      [-8, 0],
                      [-4, 10],
                      [16, -18],
                      [26, -12],
                      [-2, 24],
                    ],
                    { seed: 711, wobble: 0.6 },
                  )}
                  fill={COLORS.primary}
                  depth={0.4}
                  shadowOpacity={THEME.shadow}
                />
              </PaperSvg>
            </Piece>
          ) : null}
        </div>
      ) : null}

      {/* Phase 2: two stacked sheets */}
      {top.on ? (
        <Piece x={TOP_SHEET.x + top.dx} y={TOP_SHEET.y + top.dy - liftTop * 10} rotate={top.rotate * 0.4}>
          <PaperSvg w={TOP_SHEET.w + 60} h={TOP_SHEET.h + 60}>
            <PaperShape
              d={paperRoundRect(-TOP_SHEET.w / 2, -TOP_SHEET.h / 2, TOP_SHEET.w, TOP_SHEET.h, 20, { seed: 720 })}
              fill={PAPER_COLORS.sky.light}
              depth={1.4 + liftTop}
              shadowOpacity={THEME.shadow}
            />
          </PaperSvg>
          <Words text="Bank money (your balance)" size={56} y={-TOP_SHEET.h / 2 + 60} depth={0.6} />
          {BANK_MONEY.map((tk, k) => {
            const pop = enter(frame, cue.twoLayers + 24 + k * 2 + (k > 14 ? cue.commercialBanks - cue.twoLayers - 30 : 0), { from: [0, -60], dur: 8, seed: 730 + k, wobbleDeg: 6 });
            return pop.on ? (
              <Piece key={k} x={tk.x - TOP_SHEET.x + pop.dx} y={tk.y - TOP_SHEET.y + 30 + pop.dy} rotate={tk.r + pop.rotate}>
                <PaperSvg w={90} h={70}>
                  <PaperShape d={paperRoundRect(-32, -20, 64, 40, 8, { seed: 740 + k })} fill={THEME.amber} depth={0.9} shadowOpacity={THEME.shadow} />
                </PaperSvg>
              </Piece>
            ) : null;
          })}
        </Piece>
      ) : null}
      {bottom.on ? (
        <Piece x={BOTTOM_SHEET.x + bottom.dx} y={BOTTOM_SHEET.y + bottom.dy - liftBottom * 16} rotate={bottom.rotate * 0.4}>
          <PaperSvg w={BOTTOM_SHEET.w + 60} h={BOTTOM_SHEET.h + 60}>
            <PaperShape
              d={paperRoundRect(-BOTTOM_SHEET.w / 2, -BOTTOM_SHEET.h / 2, BOTTOM_SHEET.w, BOTTOM_SHEET.h, 20, { seed: 750 })}
              fill={PAPER_COLORS.kraft.light}
              depth={1.4 + liftBottom * 1.4}
              shadowOpacity={THEME.shadow}
            />
          </PaperSvg>
          <Words text="Cash and reserves" size={52} x={-BOTTOM_SHEET.w / 2 + 290} y={-BOTTOM_SHEET.h / 2 + 50} depth={0.6} />
          {RESERVE_TOKENS.map((tk, k) => (
            <Piece key={k} x={200 + k * 150} y={30} rotate={tk.r}>
              <PaperSvg w={90} h={70}>
                <PaperShape d={paperRoundRect(-32, -20, 64, 40, 8, { seed: 760 + k })} fill={COLORS.teal} depth={0.9} shadowOpacity={THEME.shadow} />
              </PaperSvg>
            </Piece>
          ))}
          {[0, 1].map((k) => (
            <Piece key={`n${k}`} x={-420 + k * 170} y={40} rotate={-6 + k * 9} scale={0.7}>
              <Banknote seed={770 + k * 10} />
            </Piece>
          ))}
        </Piece>
      ) : null}
    </SceneRoot>
  );
};
