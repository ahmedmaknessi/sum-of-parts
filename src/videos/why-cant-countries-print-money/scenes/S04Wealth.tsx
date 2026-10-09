import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { enter, Label } from "../../../components/paper/kit";
import { Piece } from "../../../components/paper/Piece";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { BalanceScale, Doctor, House, Loaf, PaperNote, Phone, Ticket } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s04-wealth");

const SCALE = { x: 960, y: 440, arm: 400, tilt: 12 } as const;
/** Where a pan's contents sit, relative to the scale centre (same maths as BalanceScale). */
const panAt = (side: -1 | 1, tilt: number) => {
  const r = (tilt * Math.PI) / 180;
  return { x: side * SCALE.arm * Math.cos(r), y: side * SCALE.arm * Math.sin(r) + 130 };
};
/** Extra claim tickets poured onto the money pan. */
const TICKETS = 9;

export const S04Wealth: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    breadIs: T.cue("breadIs"),
    houses: T.cue("houses"),
    claim: T.cue("claim"),
    printingClaims: T.cue("printingClaims"),
    moreBread: T.cue("moreBread"),
  };
  const idle = idleJitter(frame, 41);

  const scale = enter(frame, 0, { from: [0, 900], dur: 16, seed: 1 });
  const title = enter(frame, T.anchor, { from: [0, -400], dur: 12, seed: 2, wobbleDeg: 3 });
  // "Bread is wealth": the goods side drops (and stays: more claims never move it).
  const drop = ramp(f2, cue.breadIs, 16, EASE.settle);
  const tilt = SCALE.tilt * drop + idle;
  const goods = [
    { at: cue.houses, x: -10, y: -40, el: <House w={96} seed={4100} /> },
    { at: cue.houses + 12, x: 92, y: -20, el: <Phone h={90} /> },
    { at: cue.houses + 24, x: -100, y: -60, el: <Doctor size={0.36} /> },
  ];
  const wealth = enter(frame, cue.breadIs + 10, { from: [0, 300], dur: 12, seed: 3 });

  // "Money is just a claim": the note flips over into a ticket.
  const flip = ramp(f2, cue.claim, 10, EASE.inOut);
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  const isTicket = flip >= 0.5;
  const strings = ramp(f2, cue.claim + 12, 14, EASE.out);
  // "doesn't create more bread": every string pulls tight to the same single loaf.
  const tight = ramp(f2, cue.moreBread, 16, EASE.inOut);

  const L = panAt(-1, tilt);
  const R = panAt(1, tilt);
  const loafPt = { x: SCALE.x + R.x, y: SCALE.y + R.y - 10 };
  const ticketPos = (k: number) => ({ x: ((k * 53) % 180) - 90, y: -24 - k * 16 });

  return (
    <SceneRoot>
      {title.on ? (
        <Piece x={960 + title.dx} y={170 + title.dy} rotate={title.rotate - 1}>
          <Label text="Money isn't wealth" fontSize={64} strip={THEME.ink} ink={COLORS.primary} depth={1.6 + title.lift} seed={4001} torn />
        </Piece>
      ) : null}

      {scale.on ? (
        <Piece x={SCALE.x} y={SCALE.y + scale.dy} rotate={scale.rotate}>
          <BalanceScale
            tilt={tilt}
            arm={SCALE.arm}
            left={
              <>
                <Piece x={0} y={-30} scaleY={1} rotate={-4}>
                  <div style={{ position: "absolute", left: 0, top: 0, scale: `${sx} 1` }}>
                    {isTicket ? <Ticket seed={4010} /> : <PaperNote w={150} fill={PAPER_COLORS.green.light} seed={4011} />}
                  </div>
                </Piece>
                {Array.from({ length: TICKETS }, (_, k) => {
                  const t = enter(frame, cue.printingClaims + k * 3, { from: [0, -700], dur: 10, seed: 4020 + k, wobbleDeg: 8 });
                  if (!t.on) return null;
                  const p = ticketPos(k);
                  return (
                    <Piece key={k} x={p.x + t.dx} y={p.y + t.dy - 40} rotate={t.rotate + ((k * 37) % 20) - 10}>
                      <Ticket seed={4030 + k} />
                    </Piece>
                  );
                })}
              </>
            }
            right={
              <>
                {goods.map((g, k) => {
                  const e = enter(frame, g.at, { from: [0, -700], dur: 12, seed: 4040 + k, wobbleDeg: 4 });
                  return e.on ? (
                    <Piece key={k} x={g.x + e.dx} y={g.y + e.dy} rotate={e.rotate}>
                      {g.el}
                    </Piece>
                  ) : null;
                })}
                <Piece x={10} y={-18} rotate={2}>
                  <Loaf w={150} seed={4050} />
                </Piece>
              </>
            }
          />
        </Piece>
      ) : null}

      {/* Strings: every claim is tied to the same goods. */}
      {strings > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 1 + Math.min(TICKETS, Math.max(0, Math.floor((f2 - cue.printingClaims) / 3) + 1)) }, (_, k) => {
            const p = k === 0 ? { x: 0, y: -30 } : ticketPos(k - 1);
            const sx0 = SCALE.x + L.x + p.x;
            const sy0 = SCALE.y + L.y + p.y - (k === 0 ? 0 : 40);
            const ex = mix(sx0, loafPt.x, strings);
            const ey = mix(sy0, loafPt.y, strings);
            const sag = mix(160 - k * 8, 0, tight);
            return (
              <path
                key={k}
                d={`M ${sx0} ${sy0} Q ${(sx0 + ex) / 2} ${(sy0 + ey) / 2 + sag} ${ex} ${ey}`}
                fill="none"
                stroke={THEME.ink}
                strokeOpacity={0.55}
                strokeWidth={3}
              />
            );
          })}
        </svg>
      ) : null}

      {wealth.on ? (
        <Piece x={SCALE.x + R.x + wealth.dx} y={SCALE.y + R.y + 170 + wealth.dy} rotate={wealth.rotate + 2}>
          <Label text="Wealth" fontSize={52} strip={PAPER_COLORS.leaf.light} depth={1.2 + wealth.lift} seed={4060} />
        </Piece>
      ) : null}
      {f2 >= cue.claim + 6 ? (
        <Piece x={SCALE.x + L.x} y={SCALE.y + L.y + 170} rotate={-2}>
          <Label text="Claims" fontSize={52} strip={PAPER_COLORS.plum.light} depth={1.2} seed={4061} />
        </Piece>
      ) : null}
    </SceneRoot>
  );
};
