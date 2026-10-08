/**
 * The paper money machine (Scenes 10 and 11): a body, a hopper, an output
 * slot and three dials. It builds itself piece by piece, pops amber squares
 * (new money) out of its slot on a schedule, and can fall apart.
 */
import type React from "react";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { jitter, paperCircle, paperPolygon, paperRect, paperRoundRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { onTwos, placed } from "../../../lib/paper-motion";
import { THEME } from "../theme";

export const MACHINE = { x: 960, y: 520, w: 760, h: 380 } as const;
export const DIAL_X = [MACHINE.x - 240, MACHINE.x, MACHINE.x + 240] as const;
export const DIAL_Y = MACHINE.y - 40;
const SLOT = { x: MACHINE.x + MACHINE.w / 2, y: MACHINE.y + 100 } as const;

const BODY = paperRoundRect(-MACHINE.w / 2, -MACHINE.h / 2, MACHINE.w, MACHINE.h, 34, { seed: 1200 });
const HOPPER = paperPolygon(
  [
    [-200, -90],
    [200, -90],
    [120, 30],
    [-120, 30],
  ],
  { seed: 1201 },
);
const SLOT_PATH = paperRect(-20, -46, 70, 92, { seed: 1202 });
const DIAL = (i: number) => paperCircle(0, 0, 66, { seed: 1210 + i });
const RING = (i: number) => paperCircle(0, 0, 84, { seed: 1220 + i });
const POINTER = paperRoundRect(-8, -54, 16, 58, 8, { seed: 1230 });

/** Frames at which a square pops out: every `fast` frames, then slowing to every `slow` after `slowFrom`. */
export const emissions = (from: number, to: number, fast: number, slowFrom = Infinity, slow = fast): number[] => {
  const out: number[] = [];
  let t = from;
  while (t < to) {
    out.push(t);
    const k = Math.min(1, Math.max(0, (t - slowFrom) / 40));
    t += Math.round(mix(fast, slow, k));
  }
  return out;
};

type MachineProps = {
  readonly frame: number;
  /** Pieces drop in from here (negative: already built). */
  readonly buildAt: number;
  readonly emitAt: readonly number[];
  /** Pointer angle per dial, degrees. */
  readonly dialAngle?: readonly [number, number, number];
  /** 0..1 per dial: lifted and ringed in amber. */
  readonly highlight?: readonly [number, number, number];
  /** 0..1 per dial: pushed back (dimmed). */
  readonly dim?: readonly [number, number, number];
  /** The pieces loosen and fall from here. */
  readonly fallAt?: number;
};

export const MoneyMachine: React.FC<MachineProps> = ({
  frame,
  buildAt,
  emitAt,
  dialAngle = [-40, 20, -30],
  highlight = [0, 0, 0],
  dim = [0, 0, 0],
  fallAt = Infinity,
}) => {
  const f = onTwos(frame);
  /** Piece k: where it is in the build (drop from above) and the fall. */
  const piece = (k: number) => {
    const p = placed(frame, buildAt + k * 6, 14, { seed: 1240 + k, wobbleDeg: 3 });
    const fall = Number.isFinite(fallAt) ? ramp(f, fallAt + k * 5, 26, EASE.in) : 0;
    const dir = jitter(1250, k) >= 0 ? 1 : -1;
    return {
      on: frame >= buildAt + k * 6 && fall < 1,
      dx: fall * dir * 160,
      dy: -(1 - Math.min(p.t, 1)) * 700 + fall * fall * 1000,
      rotate: p.rotate + fall * dir * 40,
      lift: p.lift + fall * 2,
    };
  };
  const body = piece(0);
  const hopper = piece(1);
  const slot = piece(2);

  return (
    <>
      {/* New money: amber squares out of the slot (behind the machine, so they appear from it) */}
      {emitAt.map((at, k) => {
        const t = ramp(f, at, 34, EASE.in);
        if (t <= 0 || t >= 1 || f >= fallAt) return null;
        const x = SLOT.x + 30 + t * (260 + jitter(1260, k) * 60);
        const y = SLOT.y + t * t * 560 - Math.sin(Math.PI * Math.min(t * 2, 1)) * 60;
        return (
          <Piece key={k} x={x} y={y} rotate={jitter(1261, k) * 120 * t}>
            <PaperSvg w={80} h={80}>
              <PaperShape d={paperRoundRect(-22, -22, 44, 44, 6, { seed: 1270 + k })} fill={THEME.amber} depth={1.2} shadowOpacity={THEME.shadow} />
            </PaperSvg>
          </Piece>
        );
      })}

      {hopper.on ? (
        <Piece x={MACHINE.x + hopper.dx} y={MACHINE.y - MACHINE.h / 2 - 30 + hopper.dy} rotate={hopper.rotate}>
          <PaperSvg w={460} h={200}>
            <PaperShape d={HOPPER} fill={PAPER_COLORS.kraft.base} depth={1.2 + hopper.lift} shadowOpacity={THEME.shadow} />
          </PaperSvg>
        </Piece>
      ) : null}
      {body.on ? (
        <Piece x={MACHINE.x + body.dx} y={MACHINE.y + body.dy} rotate={body.rotate}>
          <PaperSvg w={MACHINE.w + 60} h={MACHINE.h + 60}>
            <PaperShape d={BODY} fill={PAPER_COLORS.sky.base} depth={1.4 + body.lift} shadowOpacity={THEME.shadow} />
          </PaperSvg>
        </Piece>
      ) : null}
      {slot.on ? (
        <Piece x={SLOT.x + slot.dx} y={SLOT.y + slot.dy} rotate={slot.rotate}>
          <PaperSvg w={120} h={140}>
            <PaperShape d={SLOT_PATH} fill={THEME.ink} depth={1 + slot.lift} shadowOpacity={THEME.shadow} />
          </PaperSvg>
        </Piece>
      ) : null}
      {DIAL_X.map((x, i) => {
        const d = piece(3 + i);
        if (!d.on) return null;
        const h = highlight[i];
        const lit = h > 0;
        return (
          <Piece key={i} x={x + d.dx} y={DIAL_Y + d.dy - h * 8} rotate={d.rotate}>
            <PaperSvg w={220} h={220}>
              {lit ? <PaperShape d={RING(i)} fill={THEME.amber} depth={1.2 + h} shadowOpacity={THEME.shadow} /> : null}
              <PaperShape d={DIAL(i)} fill={COLORS.primary} depth={1 + d.lift + h} shade={dim[i] * 0.45} shadowOpacity={THEME.shadow} />
              <g transform={`rotate(${dialAngle[i]})`}>
                <PaperShape d={POINTER} fill={THEME.ink} depth={0.6} shadowOpacity={THEME.shadow} />
              </g>
            </PaperSvg>
          </Piece>
        );
      })}
    </>
  );
};
