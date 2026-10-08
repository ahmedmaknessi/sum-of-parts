import type React from "react";
import { COLORS, FONT, PAPER_COLORS, TEXT_OPACITY } from "../../brand/tokens";
import { PaperBackground } from "../../components/paper/PaperBackground";
import { At, PaperSvg, Piece } from "../../components/paper/Piece";
import { PaperShape } from "../../components/paper/PaperShape";
import { PaperText } from "../../components/paper/PaperText";
import { paperCircle, paperHill, paperRect, paperRoundRect } from "../../components/paper/paperPath";
import { DATA, LABELS } from "./data";
import { Banknote, Typewriter } from "./parts/kit";
import { THEME } from "./theme";

/**
 * Three colourful 1280x720 papercut thumbnails for YouTube's "Test & compare".
 * Vivid paper backdrops (PAPER_COLORS), big simple hooks, every number from
 * data.ts. The bottom-right corner stays clear for the duration badge.
 */
const W = 1280;
const H = 720;

/** A layered paper backdrop: a base sheet and two lighter torn layers sweeping across. */
const Backdrop: React.FC<{ readonly hue: keyof typeof PAPER_COLORS; readonly seed: number }> = ({ hue, seed }) => (
  <PaperSvg w={W + 200} h={H + 200}>
    <PaperShape d={paperRect(-W / 2 - 40, -H / 2 - 40, W + 80, H + 80, { seed })} fill={PAPER_COLORS[hue].base} depth={0} />
    <PaperShape d={paperHill(-W / 2 - 60, W / 2 + 60, 130, H / 2 + 80, { seed: seed + 1, amplitude: 60, waves: 1.2 })} fill={PAPER_COLORS[hue].dark} depth={1.2} />
    <PaperShape d={paperHill(-W / 2 - 60, W / 2 + 60, -260, -H / 2 - 80, { seed: seed + 2, amplitude: 50, waves: 1.6 })} fill={PAPER_COLORS[hue].light} depth={1.2} />
  </PaperSvg>
);

/** Big cut-paper words with a thick-card offset layer under them. */
const Thick: React.FC<{ readonly text: string; readonly size: number; readonly color: string; readonly under: string }> = ({
  text,
  size,
  color,
  under,
}) => (
  <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", left: size * 0.03, top: size * 0.035 }}>
      <PaperText color={under} fontSize={size} depth={1.2}>
        {text}
      </PaperText>
    </div>
    <PaperText color={color} fontSize={size} depth={2.4}>
      {text}
    </PaperText>
  </div>
);

// ---------------------------------------------------------------------------
// A: the balance card with its number cut out, and a huge "$0"
// ---------------------------------------------------------------------------

const CARD = { w: 430, h: 250 } as const;

export const Thumbnail02A: React.FC = () => (
  <PaperBackground board={PAPER_COLORS.plum.base}>
    <Piece x={W / 2} y={H / 2}>
      <Backdrop hue="plum" seed={2100} />
    </Piece>
    {/* The phone with its balance card */}
    <Piece x={330} y={390} rotate={-8}>
      <PaperSvg w={420} h={640}>
        <PaperShape d={paperRoundRect(-180, -290, 360, 580, 48, { seed: 2110 })} fill={THEME.ink} depth={2.2} />
        <PaperShape d={paperRoundRect(-150, -230, 300, 470, 22, { seed: 2111 })} fill={COLORS.primary} depth={0.6} />
      </PaperSvg>
      <Piece x={0} y={-40} rotate={4}>
        <PaperSvg w={CARD.w + 60} h={CARD.h + 60}>
          <PaperShape d={paperRoundRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 26, { seed: 2112 })} fill={PAPER_COLORS.sky.light} depth={2.4} />
        </PaperSvg>
        <At x={0} y={-66}>
          <PaperText color={THEME.ink} fontSize={40} weight={FONT.weight.body} depth={0} style={{ opacity: TEXT_OPACITY.secondary }}>
            Balance
          </PaperText>
        </At>
        {/* The number, cut out: the navy phone shows through */}
        <At x={0} y={30}>
          <PaperText color={COLORS.background} fontSize={112} depth={0}>
            {LABELS.balance}
          </PaperText>
        </At>
        <Piece x={0} y={34} rotate={-22}>
          <PaperSvg w={600} h={130}>
            <PaperShape d={paperRect(-260, -36, 520, 72, { seed: 2113, torn: "ends" })} fill={COLORS.coral} depth={2.2} />
          </PaperSvg>
        </Piece>
      </Piece>
    </Piece>
    {/* "$0", thick cream card on an amber layer */}
    <At x={900} y={330}>
      <Thick text="$0" size={400} color={COLORS.primary} under={THEME.amber} />
    </At>
  </PaperBackground>
);

// ---------------------------------------------------------------------------
// B: 9 in 10 dollars were never printed
// ---------------------------------------------------------------------------

const NOTE = { w: 190, h: 92, gapX: 22, gapY: 26 } as const;
const NOTES_LEFT = 120;
const NOTES_TOP = 300;

export const Thumbnail02B: React.FC = () => {
  const printed = 10 - DATA.neverPrintedOutOfTen;
  return (
    <PaperBackground board={PAPER_COLORS.sky.base}>
      <Piece x={W / 2} y={H / 2}>
        <Backdrop hue="sky" seed={2200} />
      </Piece>
      <At x={W / 2} y={150}>
        <Thick text={`${LABELS.nineInTen} DOLLARS`} size={112} color={COLORS.primary} under={THEME.ink} />
      </At>
      {/* Ten notes in two rows: one real banknote, nine empty cut-outs */}
      {Array.from({ length: 10 }, (_, k) => {
        const r = Math.floor(k / 5);
        const c = k % 5;
        const x = NOTES_LEFT + c * (NOTE.w + NOTE.gapX) + NOTE.w / 2;
        const y = NOTES_TOP + r * (NOTE.h + NOTE.gapY) + NOTE.h / 2;
        const real = k < printed;
        return (
          <Piece key={k} x={x} y={y} rotate={((k * 7) % 5) - 2}>
            {real ? (
              <div style={{ scale: `${NOTE.w / 170}` }}>
                <Banknote seed={2210 + k} depth={2} />
              </div>
            ) : (
              <PaperSvg w={NOTE.w + 30} h={NOTE.h + 30}>
                <PaperShape d={paperRect(-NOTE.w / 2, -NOTE.h / 2, NOTE.w, NOTE.h, { seed: 2220 + k })} fill={PAPER_COLORS.sky.dark} depth={0.4} />
                <rect
                  x={-NOTE.w / 2 + 8}
                  y={-NOTE.h / 2 + 8}
                  width={NOTE.w - 16}
                  height={NOTE.h - 16}
                  fill="none"
                  stroke={COLORS.primary}
                  strokeWidth={4}
                  strokeDasharray="12 9"
                />
              </PaperSvg>
            )}
          </Piece>
        );
      })}
      <Piece x={NOTES_LEFT + 2.5 * (NOTE.w + NOTE.gapX) - NOTE.gapX / 2} y={NOTES_TOP + 2 * (NOTE.h + NOTE.gapY) + 70} rotate={-2}>
        <PaperSvg w={900} h={150}>
          <PaperShape d={paperRect(-400, -56, 800, 112, { seed: 2230, torn: "ends" })} fill={THEME.amber} depth={2.2} />
        </PaperSvg>
        <At x={0} y={0}>
          <PaperText color={THEME.ink} fontSize={84} depth={0.4}>
            NEVER PRINTED
          </PaperText>
        </At>
      </Piece>
    </PaperBackground>
  );
};

// ---------------------------------------------------------------------------
// C: banks type money: a typewriter typing a banknote out of nothing
// ---------------------------------------------------------------------------

export const Thumbnail02C: React.FC = () => (
  <PaperBackground board={PAPER_COLORS.rose.base}>
    <Piece x={W / 2} y={H / 2}>
      <Backdrop hue="rose" seed={2300} />
    </Piece>
    <At x={390} y={140}>
      <Thick text="BANKS" size={140} color={COLORS.primary} under={THEME.ink} />
    </At>
    <At x={390} y={300}>
      <Thick text="TYPE" size={140} color={THEME.amber} under={THEME.ink} />
    </At>
    <At x={390} y={460}>
      <Thick text="MONEY" size={140} color={COLORS.primary} under={THEME.ink} />
    </At>
    {/* The typewriter and the banknote it is typing */}
    <Piece x={930} y={520} scale={1.2}>
      <Typewriter pressed={3} />
    </Piece>
    <Piece x={930} y={290} rotate={-6} scale={1.6}>
      <Banknote seed={2310} depth={2.4} />
    </Piece>
    <Piece x={1080} y={150} rotate={8}>
      <PaperSvg w={340} h={120}>
        <PaperShape d={paperRoundRect(-140, -40, 280, 80, 12, { seed: 2320 })} fill={THEME.amber} depth={2} />
        <PaperShape d={paperCircle(-120, 0, 9, { seed: 2321 })} fill={COLORS.coral} depth={0.6} />
      </PaperSvg>
      <At x={8} y={0}>
        <PaperText color={THEME.ink} fontSize={52} depth={0.3}>
          {LABELS.newMoney}
        </PaperText>
      </At>
    </Piece>
  </PaperBackground>
);
