import type React from "react";
import { COLORS, FONT, PAPER_COLORS, SHORT, TYPE } from "../../../brand/tokens";
import { PaperBackground } from "../../../components/paper/PaperBackground";
import { At, PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { PaperText } from "../../../components/paper/PaperText";
import { paperRect, paperRoundRect } from "../../../components/paper/paperPath";
import { DATA, LABELS } from "../data";
import { Bank, Banknote, Entry, Label, Typewriter } from "../parts/kit";
import { BalanceCard } from "../scenes/S09Iou";
import { THEME } from "../theme";

/**
 * Instagram Reel covers (1080x1920). Everything that matters sits inside the
 * middle 1080x1440 band, which is what the 3:4 profile grid shows; the top
 * and bottom 240px are only seen when the Reel is opened full screen.
 */
const GRID = { top: (SHORT.height - 1440) / 2, bottom: (SHORT.height + 1440) / 2 } as const;
const TITLE_Y = GRID.top + 150;
/** Line heights: a highlighted line sits on a navy strip, which needs more room. */
const lineHeight = (isStrip: boolean) => TYPE.h1 * (isStrip ? 1.75 : 1.12);
/** Centre of title line i, stacking the lines by their own heights. */
const lineY = (lines: readonly string[], highlight: number | undefined, i: number) =>
  TITLE_Y +
  lines.slice(0, i).reduce((sum, _, k) => sum + lineHeight(k === highlight), 0) +
  lineHeight(i === highlight) / 2;

type CoverProps = {
  readonly lines: readonly string[];
  /** One title line may be amber (on a navy strip): its index. */
  readonly highlight?: number;
  readonly backdrop: keyof typeof PAPER_COLORS;
  readonly children: React.ReactNode;
};

export const Cover: React.FC<CoverProps> = ({ lines, highlight, backdrop, children }) => (
  <PaperBackground board={THEME.board} ink={THEME.ink}>
    {/* A coloured paper sheet behind the object, inside the grid band */}
    <Piece x={SHORT.width / 2} y={GRID.top + 930} rotate={-2}>
      <PaperSvg w={1000} h={800}>
        <PaperShape d={paperRoundRect(-430, -330, 860, 660, 40, { seed: 2400 })} fill={PAPER_COLORS[backdrop].light} depth={1.4} shadowOpacity={THEME.shadow} />
      </PaperSvg>
    </Piece>
    {lines.map((line, i) => (
      <At key={i} x={SHORT.width / 2} y={lineY(lines, highlight, i)}>
        {i === highlight ? (
          <div style={{ position: "relative" }}>
            <Label text={line} fontSize={TYPE.h1} strip={THEME.ink} ink={THEME.amber} depth={2} seed={2410 + i} />
          </div>
        ) : (
          <PaperText color={THEME.ink} fontSize={TYPE.h1} depth={1.6} shadowOpacity={THEME.shadow}>
            {line}
          </PaperText>
        )}
      </At>
    ))}
    <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    <At x={SHORT.width / 2} y={GRID.bottom - 70}>
      <PaperText color={THEME.ink} fontSize={44} weight={FONT.weight.body} depth={0}>
        Sum of Parts
      </PaperText>
    </At>
  </PaperBackground>
);

const CX = SHORT.width / 2;
const OBJ_Y = GRID.top + 930;

export const V2Cover01: React.FC = () => (
  <Cover lines={["Where is your", "money, really?"]} highlight={1} backdrop="sky">
    <Piece x={CX} y={OBJ_Y - 30} rotate={-6} scale={1.7}>
      <BalanceCard frame={1000} />
    </Piece>
    <Piece x={CX + 20} y={OBJ_Y - 10} rotate={-22}>
      <PaperSvg w={760} h={140}>
        <PaperShape d={paperRect(-330, -40, 660, 80, { seed: 2420, torn: "ends" })} fill={COLORS.coral} depth={2.2} shadowOpacity={THEME.shadow} />
      </PaperSvg>
    </Piece>
  </Cover>
);

export const V2Cover02: React.FC = () => (
  <Cover lines={["Banks create", "money by", "typing"]} highlight={2} backdrop="rose">
    <Piece x={CX} y={OBJ_Y - 120} rotate={-3}>
      <Entry text={`New money: ${LABELS.newMoney}`} fill={THEME.amber} w={640} seed={2430} depth={2} />
    </Piece>
    <Piece x={CX} y={OBJ_Y + 110} scale={1.6}>
      <Typewriter pressed={3} />
    </Piece>
  </Cover>
);

export const V2Cover03: React.FC = () => (
  <Cover lines={[`${LABELS.nineInTen} dollars`, "never printed"]} highlight={0} backdrop="leaf">
    {Array.from({ length: 10 }, (_, k) => {
      const real = k < 10 - DATA.neverPrintedOutOfTen;
      const r = Math.floor(k / 2);
      const c = k % 2;
      return (
        <Piece key={k} x={CX - 170 + c * 340} y={OBJ_Y - 250 + r * 125} rotate={((k * 5) % 4) - 1.5}>
          {real ? (
            <div style={{ scale: "1.6" }}>
              <Banknote seed={2440 + k} depth={2} />
            </div>
          ) : (
            <PaperSvg w={320} h={140}>
              <PaperShape d={paperRect(-136, -54, 272, 108, { seed: 2450 + k })} fill={PAPER_COLORS.leaf.dark} depth={0.5} shadowOpacity={THEME.shadow} />
              <rect x={-124} y={-42} width={248} height={84} fill="none" stroke={COLORS.primary} strokeWidth={4} strokeDasharray="12 9" />
            </PaperSvg>
          )}
        </Piece>
      );
    })}
  </Cover>
);

export const V2Cover04: React.FC = () => (
  <Cover lines={[`The ${LABELS.svbWithdrawn}`, "bank run"]} highlight={0} backdrop="kraft">
    <Piece x={CX} y={OBJ_Y - 20} scale={1.6}>
      <Bank seed={2460} roof={THEME.ink} label="SVB" />
    </Piece>
    <Piece x={CX} y={OBJ_Y + 10} rotate={-8}>
      <Label text="CLOSED" fontSize={96} strip={COLORS.coral} ink={COLORS.primary} torn depth={2.4} seed={2470} />
    </Piece>
  </Cover>
);
