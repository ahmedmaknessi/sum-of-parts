import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { jitter, paperRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { DATA, LABELS, SOURCES } from "../data";
import { Bank, Box, enter, Figure, FIGURE_COLORS, FlipNumber, Label, leave, SourceLine, Words } from "../parts/kit";
import { emissions, MoneyMachine } from "../parts/machine";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";
import { SLOW_RATE } from "./S10Infinite";

const T = sceneTiming("s11-trust");

const SEPIA = { page: PAPER_COLORS.kraft.light, ink: PAPER_COLORS.kraft.dark, roof: PAPER_COLORS.kraft.base } as const;
const OLD_BANKS = [330, 750, 1170, 1590] as const;
const SVB = { x: 620, y: 470 } as const;
/** The deposit strip: its full height is all of SVB's deposits. */
const STRIP = { x: 1180, base: 900, h: 620, w: 170 } as const;
const TORN_H = STRIP.h * DATA.svbWithdrawnShare;
const KEEP_H = STRIP.h - TORN_H;
const QUEUE_Y = 940;

export const S11Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    fallApart: T.cue("fallApart"),
    depression: T.cue("depression"),
    march9: T.cue("march9"),
    svbCustomers: T.cue("svbCustomers"),
    fortyTwo: T.cue("fortyTwo"),
    quarter: T.cue("quarter"),
    hundredBillion: T.cue("hundredBillion"),
    shutDown: T.cue("shutDown"),
    onHand: T.cue("onHand"),
    bonds: T.cue("bonds"),
    notEveryone: T.cue("notEveryone"),
  };

  // The 1930s flashback: a sepia page slides in, then turns away on "March ninth, 2023".
  const page = enter(frame, cue.depression, { from: [1900, 0], dur: 14, seed: 1 });
  const turn = ramp(f2, cue.march9, 16, EASE.in);
  const decade = enter(frame, cue.depression + 20, { from: [0, -200], dur: 12, seed: 2, wobbleDeg: 4 });

  const svb = enter(frame, cue.march9 + 8, { from: [0, -700], dur: 16, seed: 3 });
  const strip = enter(frame, cue.svbCustomers + 40, { from: [0, 800], dur: 16, seed: 4 });
  // The top quarter tears off on "forty-two billion" and is carried away to the right.
  const tear = ramp(f2, cue.fortyTwo, 8, EASE.out);
  const carry = ramp(f2, cue.fortyTwo + 14, 60, EASE.in);
  const counter = enter(frame, cue.fortyTwo, { from: [0, -300], dur: 12, seed: 5 });
  const quarter = enter(frame, cue.quarter, { from: [200, 0], dur: 12, seed: 6, wobbleDeg: 4 });
  const sign = enter(frame, cue.hundredBillion + 20, { from: [0, -300], dur: 12, seed: 7, wobbleDeg: 5 });
  const doors = ramp(f2, cue.shutDown, 8, EASE.in);
  const closed = enter(frame, cue.shutDown + 10, { from: [0, -400], dur: 8, seed: 8, wobbleDeg: 6 });
  const box = enter(frame, cue.onHand, { from: [-500, 0], dur: 14, seed: 9 });
  const bondsIn = enter(frame, cue.onHand + 30, { from: [-500, 0], dur: 14, seed: 10 });
  const shrinkBond = (k: number) => ramp(f2, cue.bonds + k * 8, 10, EASE.out);
  const shake = f2 >= cue.notEveryone && f2 < cue.notEveryone + 20 ? jitter(1400, f2) * 6 : 0;
  const machineOut = leave(frame, cue.depression + 10, [0, 0], 1);

  return (
    <SceneRoot>
      {/* "the promise holds" ... "things fall apart fast" */}
      {!machineOut.gone ? (
        <MoneyMachine frame={frame} buildAt={-200} emitAt={emissions(0, cue.fallApart, SLOW_RATE)} fallAt={cue.fallApart} dialAngle={[-40, 20, 70]} />
      ) : null}

      {/* SVB, 2023 (under the flashback page) */}
      {svb.on ? (
        <>
          <Piece x={SVB.x + svb.dx + shake} y={SVB.y + svb.dy} rotate={svb.rotate} scale={1.2}>
            <Bank seed={1410} roof={THEME.ink} label="SVB" />
          </Piece>
          {doors > 0 ? (
            <>
              {[-1, 1].map((side) => (
                <Piece key={side} x={SVB.x + side * mix(240, 92, doors)} y={SVB.y + 10}>
                  <PaperSvg w={220} h={260}>
                    <PaperShape d={paperRect(-90, -100, 180, 200, { seed: 1420 + side })} fill={THEME.slate} depth={1.6} shadowOpacity={THEME.shadow} />
                  </PaperSvg>
                </Piece>
              ))}
            </>
          ) : null}
          {closed.on ? (
            <Piece x={SVB.x + closed.dx} y={SVB.y + 20 + closed.dy} rotate={closed.rotate - 6}>
              <Label text={LABELS.svbClosed} fontSize={44} strip={COLORS.coral} ink={COLORS.primary} torn depth={2} seed={1430} />
            </Piece>
          ) : null}
        </>
      ) : null}

      {/* SVB's customers */}
      {frame >= cue.svbCustomers
        ? Array.from({ length: 6 }, (_, k) => {
            const e = enter(frame, cue.svbCustomers + k * 4, { from: [0, 300], dur: 10, seed: 1440 + k });
            return (
              <Piece key={k} x={330 + k * 110 + e.dx} y={QUEUE_Y - 60 + e.dy}>
                <Figure body={FIGURE_COLORS[k % 4]} seed={1450 + k * 10} size={0.42} />
              </Piece>
            );
          })
        : null}

      {/* The deposit strip, its torn top quarter and the "$42B in one day" counter */}
      {strip.on ? (
        <>
          <Piece x={STRIP.x + strip.dx} y={STRIP.base + strip.dy}>
            <PaperSvg w={STRIP.w + 40} h={STRIP.h * 2 + 40}>
              <PaperShape d={paperRect(-STRIP.w / 2, -KEEP_H, STRIP.w, KEEP_H, { seed: 1460 })} fill={PAPER_COLORS.sky.base} depth={1.3} shadowOpacity={THEME.shadow} />
            </PaperSvg>
            <Words text={`Deposits: ${LABELS.svbDeposits}`} size={44} y={-STRIP.h - 50} depth={0.6} />
          </Piece>
          {carry < 1 ? (
            <Piece
              x={STRIP.x + strip.dx + carry * 900}
              y={STRIP.base - KEEP_H - TORN_H / 2 - tear * 24 + strip.dy + Math.sin(f2 * 0.8) * 6 * carry}
              rotate={tear * 6 + carry * 10}
            >
              <PaperSvg w={STRIP.w + 40} h={TORN_H + 40}>
                <PaperShape
                  d={paperRect(-STRIP.w / 2, -TORN_H / 2, STRIP.w, TORN_H, { seed: 1461, torn: tear > 0 ? "all" : undefined })}
                  fill={THEME.amber}
                  depth={1.3 + tear * 1.2}
                  shadowOpacity={THEME.shadow}
                />
              </PaperSvg>
              {/* The tiny figures carrying it off */}
              {tear > 0
                ? [-1, 1].map((s) => (
                    <Piece key={s} x={s * 60} y={TORN_H / 2 + 50 + Math.abs(Math.sin(f2 * 0.7 + s)) * -8}>
                      <Figure body={FIGURE_COLORS[(s + 2) % 4]} seed={1470 + s} size={0.3} reach={0.8} />
                    </Piece>
                  ))
                : null}
            </Piece>
          ) : null}
        </>
      ) : null}
      {counter.on ? (
        <Piece x={1560 + counter.dx} y={380 + counter.dy} rotate={counter.rotate + 2}>
          <PaperSvg w={460} h={260}>
            <PaperShape d={paperRect(-200, -100, 400, 200, { seed: 1480 })} fill={COLORS.primary} depth={1.4 + counter.lift} shadowOpacity={THEME.shadow} />
          </PaperSvg>
          <Piece x={0} y={-24}>
            <FlipNumber text={LABELS.svbWithdrawn} frame={frame} flipAt={cue.fortyTwo + 4} size={80} tile={PAPER_COLORS.sky.light} seed={1481} />
          </Piece>
          <Words text="in one day" size={40} y={60} depth={0} />
        </Piece>
      ) : null}
      {quarter.on && carry >= 0.5 ? (
        <Piece x={STRIP.x + 280 + quarter.dx} y={STRIP.base - KEEP_H + 10 + quarter.dy} rotate={quarter.rotate + 3}>
          <Label text="A quarter of deposits" fontSize={40} strip={PAPER_COLORS.kraft.light} seed={1482} />
        </Piece>
      ) : null}

      {/* The queue for the next morning */}
      {frame >= cue.hundredBillion
        ? Array.from({ length: 12 }, (_, k) => {
            const walkIn = ramp(f2, cue.hundredBillion + k * 3, 30, EASE.out);
            return (
              <Piece key={k} x={mix(2100, 860 + k * 90, walkIn)} y={QUEUE_Y + (walkIn < 1 ? Math.abs(Math.sin(f2 * 0.6 + k)) * -10 : 0)}>
                <Figure body={FIGURE_COLORS[(k + 1) % 4]} seed={1490 + k * 10} size={0.36} />
              </Piece>
            );
          })
        : null}
      {sign.on ? (
        <Piece x={1560 + sign.dx} y={640 + sign.dy} rotate={sign.rotate - 3}>
          <Label text={`${LABELS.svbPending} pending`} fontSize={52} strip={PAPER_COLORS.kraft.light} depth={1.4 + sign.lift} seed={1500} />
        </Piece>
      ) : null}

      {/* Not enough on hand; bonds that lost value */}
      {box.on ? (
        <Piece x={240 + box.dx} y={370 + box.dy} rotate={box.rotate} scale={0.7}>
          <Box open={0.7} />
          <Words text="On hand" size={52} y={170} depth={0.6} />
        </Piece>
      ) : null}
      {bondsIn.on
        ? Array.from({ length: 4 }, (_, k) => {
            const s = shrinkBond(k);
            return (
              <Piece key={k} x={275 + bondsIn.dx} y={680 - k * 34 + bondsIn.dy} rotate={bondsIn.rotate + (k - 2) * 2} scale={1.3 * mix(1, 0.6, s)}>
                <PaperSvg w={260} h={120}>
                  <PaperShape d={paperRect(-110, -40, 220, 80, { seed: 1510 + k, torn: s > 0 ? "ends" : undefined })} fill={PAPER_COLORS.kraft.light} depth={1.1} shadowOpacity={THEME.shadow} />
                </PaperSvg>
                {k === 3 ? <Words text="Bonds" size={40} depth={0} /> : null}
              </Piece>
            );
          })
        : null}

      {/* The 1930s flashback page, over everything */}
      {page.on && turn < 1 ? (
        <div style={{ position: "absolute", inset: 0, scale: `${1 - turn} 1`, transformOrigin: "0px 0px" }}>
          <Piece x={960 + page.dx} y={540}>
            <PaperSvg w={2040} h={1180}>
              <PaperShape d={paperRect(-990, -560, 1980, 1120, { seed: 1520, torn: "ends" })} fill={SEPIA.page} depth={2.2} shadowOpacity={THEME.shadow} />
            </PaperSvg>
          </Piece>
          {OLD_BANKS.map((x, i) => {
            const shut = enter(frame, cue.depression + 50 + i * 30, { from: [0, -300], dur: 8, seed: 1530 + i, wobbleDeg: 6 });
            return (
              <div key={x}>
                <Piece x={x + page.dx} y={500} scale={0.85}>
                  <Bank seed={1540 + i * 10} roof={SEPIA.roof} ink={SEPIA.ink} />
                </Piece>
                {Array.from({ length: 4 }, (_, k) => (
                  <Piece key={k} x={x - 110 + k * 70 + page.dx} y={790}>
                    <Figure body={SEPIA.ink} seed={1560 + i * 10 + k} size={0.32} />
                  </Piece>
                ))}
                {shut.on ? (
                  <Piece x={x + page.dx + shut.dx} y={500 + shut.dy} rotate={shut.rotate - 5 + i * 3}>
                    <Label text="CLOSED" fontSize={44} strip={SEPIA.ink} ink={SEPIA.page} torn depth={1.6} seed={1570 + i} />
                  </Piece>
                ) : null}
              </div>
            );
          })}
          {decade.on ? (
            <Piece x={260 + page.dx + decade.dx} y={170 + decade.dy} rotate={decade.rotate - 3}>
              <Label text={LABELS.depressionDecade} fontSize={56} strip={SEPIA.ink} ink={SEPIA.page} seed={1580} />
            </Piece>
          ) : null}
        </div>
      ) : null}

      <SourceLine text={SOURCES.oig} frame={frame} at={cue.march9 + 20} />
    </SceneRoot>
  );
};
