import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { PaperDefs, PaperShape } from "../../../components/paper/PaperShape";
import { Piece } from "../../../components/paper/Piece";
import { paperRoundRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { DATA, LABELS, SOURCES } from "../data";
import { enter, Label, SourceLine, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s08-cash");

const N = 10;
const US = { x: 620, y: 615, cell: 56, gap: 7 } as const;
const UK = { x: 1380, y: 760, cell: 24, gap: 4 } as const;
const RIGHT_X = 1380;

type GridProps = {
  readonly frame: number;
  readonly cx: number;
  readonly cy: number;
  readonly cell: number;
  readonly gap: number;
  /** Squares assemble from the corners starting here. */
  readonly at: number;
  /** Number of squares that are cash (the last ones, bottom right). */
  readonly cash: number;
  readonly cashAt: number;
  readonly restAt: number;
  readonly seed: number;
};

/** A 10 x 10 grid of paper squares: assembles from the corners, then flips to banknotes and amber. */
const MoneyGrid: React.FC<GridProps> = ({ frame, cx, cy, cell, gap, at, cash, cashAt, restAt, seed }) => {
  const f = onTwos(frame);
  const size = N * cell + (N - 1) * gap;
  const left = cx - size / 2;
  const top = cy - size / 2;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <PaperDefs />
      {Array.from({ length: N * N }, (_, i) => {
        const r = Math.floor(i / N);
        const c = i % N;
        // Distance (in cells) from the nearest corner sets the order; squares slide in from that corner.
        const cornerR = r < N / 2 ? 0 : N - 1;
        const cornerC = c < N / 2 ? 0 : N - 1;
        const dist = Math.abs(r - cornerR) + Math.abs(c - cornerC);
        const drop = ramp(f, at + dist * 3, 10, EASE.settle);
        if (drop <= 0) return null;
        const isCash = i >= N * N - cash;
        const flipAt = isCash ? cashAt + (N * N - 1 - i) * 2 : restAt + ((i * 7) % 30);
        const flip = ramp(f, flipAt, 8, EASE.inOut);
        const sx = Math.abs(Math.cos(Math.PI * flip));
        const flipped = flip >= 0.5;
        const fill = flipped ? (isCash ? PAPER_COLORS.green.base : THEME.amber) : PAPER_COLORS.sky.light;
        const x = left + c * (cell + gap) + cell / 2 + (cornerC === 0 ? -1 : 1) * (1 - drop) * 240;
        const y = top + r * (cell + gap) + cell / 2 + (cornerR === 0 ? -1 : 1) * (1 - drop) * 240;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${Math.max(sx, 0.04)} 1)`}>
            <PaperShape
              d={paperRoundRect(-cell / 2, -cell / 2, cell, cell, cell * 0.12, { seed: seed + i })}
              fill={fill}
              depth={mix(1.8, 0.7, Math.min(drop, 1)) + Math.sin(Math.PI * flip) * 1.2}
              shadowOpacity={THEME.shadow}
            />
            {flipped && isCash ? (
              <rect x={-cell * 0.3} y={-cell * 0.18} width={cell * 0.6} height={cell * 0.36} rx={2} fill={PAPER_COLORS.green.light} />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

export const S08Cash: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    unitedStates: T.cue("unitedStates"),
    broadMoney: T.cue("broadMoney"),
    cash: T.cue("cash"),
    nineInTen: T.cue("nineInTen"),
    uk: T.cue("uk"),
    ninetySeven: T.cue("ninetySeven"),
  };
  const title = enter(frame, T.anchor, { from: [0, -200], dur: 14, seed: 1 });
  const us = enter(frame, cue.unitedStates, { from: [-300, 0], dur: 12, seed: 2 });
  const m2 = enter(frame, cue.broadMoney, { from: [0, -160], dur: 12, seed: 3 });
  const cashLabel = enter(frame, cue.cash + 10, { from: [300, 0], dur: 12, seed: 4 });
  const nine = enter(frame, cue.nineInTen + 6, { from: [0, -400], dur: 14, seed: 5, wobbleDeg: 3 });
  const ukIn = enter(frame, cue.uk, { from: [600, 0], dur: 16, seed: 6 });
  const ukLabel = enter(frame, cue.uk + 24, { from: [0, -160], dur: 12, seed: 7 });
  // On "In the UK" the right column makes room: "9 in 10" moves up, the cash label leaves.
  const room = ramp(f2, cue.uk, 14, EASE.inOut);
  const pulse = 1 + 0.08 * Math.sin(Math.PI * ramp(f2, cue.ninetySeven, 10, EASE.inOut));

  return (
    <SceneRoot>
      {title.on ? (
        <Piece x={960 + title.dx} y={136 + title.dy} rotate={title.rotate * 0.5}>
          <Words text="How much of it is actually cash?" size={52} depth={1 + title.lift} />
        </Piece>
      ) : null}
      {us.on ? (
        <Piece x={US.x + us.dx} y={US.y - 418 + us.dy} rotate={us.rotate - 2}>
          <Label text={`US money (M2): ${LABELS.m2}`} fontSize={48} strip={COLORS.primary} depth={1.2 + us.lift} seed={801} />
        </Piece>
      ) : null}
      {m2.on ? <MoneyGrid frame={frame} cx={US.x} cy={US.y} cell={US.cell} gap={US.gap} at={cue.broadMoney} cash={DATA.cashSquares} cashAt={cue.cash} restAt={cue.nineInTen} seed={810} /> : null}

      {cashLabel.on && room < 1 ? (
        <Piece x={RIGHT_X + cashLabel.dx + room * 700} y={820 + cashLabel.dy} rotate={cashLabel.rotate + 2}>
          <Label text={`Cash: ${LABELS.cash}`} fontSize={52} strip={PAPER_COLORS.green.base} ink={COLORS.primary} depth={1.3 + cashLabel.lift} seed={802} />
        </Piece>
      ) : null}
      {nine.on ? (
        <Piece x={RIGHT_X + nine.dx} y={mix(440, 330, room) + nine.dy} rotate={nine.rotate - 2} scale={mix(1, 0.8, room)}>
          <Label text={LABELS.nineInTen} fontSize={150} strip={THEME.amber} depth={2 + nine.lift} seed={803} padX={40} />
          <Words text="never printed" size={60} y={150} depth={0.8} />
        </Piece>
      ) : null}

      {ukIn.on ? (
        <div style={{ position: "absolute", inset: 0, translate: `${ukIn.dx}px 0px` }}>
          <MoneyGrid frame={frame} cx={UK.x} cy={UK.y} cell={UK.cell} gap={UK.gap} at={cue.uk} cash={DATA.ukCashSquares} cashAt={cue.uk + 30} restAt={cue.uk + 34} seed={950} />
        </div>
      ) : null}
      {ukLabel.on ? (
        <Piece x={UK.x + 290 + ukLabel.dx} y={UK.y + ukLabel.dy} rotate={ukLabel.rotate + 3} scale={pulse}>
          <Label text={`UK: ${LABELS.ukShare}`} fontSize={52} strip={THEME.amber} depth={1.6 + ukLabel.lift} seed={804} />
        </Piece>
      ) : null}

      <SourceLine text={`${SOURCES.h6}. ${SOURCES.boeShort}.`} frame={frame} at={cue.broadMoney + 20} />
    </SceneRoot>
  );
};
