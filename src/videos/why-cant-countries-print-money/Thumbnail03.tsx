import type React from "react";
import { COLORS, PAPER_COLORS } from "../../brand/tokens";
import { PaperBackground } from "../../components/paper/PaperBackground";
import { At, PaperSvg, Piece } from "../../components/paper/Piece";
import { PaperShape } from "../../components/paper/PaperShape";
import { PaperText } from "../../components/paper/PaperText";
import { paperCircle, paperRect, paperRoundRect } from "../../components/paper/paperPath";
import { Backdrop, Thick } from "../money-in-your-bank-doesnt-exist/Thumbnail02";
import { LABELS } from "./data";
import { Loaf, PaperNote, PrintingPress } from "./parts/v3";
import { THEME } from "./theme";

/**
 * Three 1280x720 papercut thumbnails for YouTube's "Test & compare".
 * A is the script's design (navy board, a generic cream note with the full
 * number, an amber "= $30" tag, a loaf with a "?"); B and C are colourful.
 * Never the real banknote design. The bottom-right corner stays clear for the
 * duration badge. Every number comes from data.ts.
 */
const W = 1280;
const H = 720;

/** A big generic paper banknote with the full number cut into it. */
const BigNote: React.FC<{ readonly w: number; readonly fill: string; readonly seed: number; readonly size: number }> = ({ w, fill, seed, size }) => {
  const h = w * 0.48;
  return (
    <>
      <PaperSvg w={w + 60} h={h + 60}>
        <PaperShape d={paperRect(-w / 2, -h / 2, w, h, { seed })} fill={fill} depth={2.4} />
        <rect x={-w / 2 + 22} y={-h / 2 + 22} width={w - 44} height={h - 44} fill="none" stroke={THEME.ink} strokeOpacity={0.4} strokeWidth={5} />
      </PaperSvg>
      <At x={0} y={-20}>
        <PaperText color={THEME.ink} fontSize={size} depth={0.3}>
          {LABELS.noteDigits}
        </PaperText>
      </At>
    </>
  );
};

/** An amber hanging tag on a string. */
const Tag: React.FC<{ readonly text: string; readonly size: number; readonly seed: number }> = ({ text, size, seed }) => {
  const w = text.length * size * 0.6 + 70;
  const h = size * 1.5;
  return (
    <>
      <PaperSvg w={w + 60} h={h + 200}>
        <path d={`M ${-w / 2 + 30} ${-h / 2} L ${-w / 2 - 10} ${-h / 2 - 50}`} stroke={THEME.ink} strokeWidth={4} />
        <PaperShape d={paperRoundRect(-w / 2, -h / 2, w, h, 14, { seed })} fill={THEME.amber} depth={2.6} />
        <PaperShape d={paperCircle(-w / 2 + 30, -h / 2 + 22, 9, { seed: seed + 1 })} fill={THEME.ink} depth={0.3} />
      </PaperSvg>
      <At x={10} y={0}>
        <PaperText color={THEME.ink} fontSize={size} depth={0.3}>
          {text}
        </PaperText>
      </At>
    </>
  );
};

// A: the script's design, on navy paper.
export const Thumbnail03A: React.FC = () => (
  <PaperBackground board={COLORS.background} ink={COLORS.primary}>
    <Piece x={480} y={340} rotate={-7}>
      <BigNote w={760} fill={COLORS.primary} seed={3300} size={62} />
      <Piece x={300} y={230} rotate={10}>
        <Tag text={LABELS.noteEquals} size={84} seed={3301} />
      </Piece>
    </Piece>
    <Piece x={1080} y={430} rotate={4}>
      <Loaf w={300} seed={3302} />
    </Piece>
    <At x={1080} y={230}>
      <PaperText color={COLORS.primary} fontSize={200} depth={2}>
        ?
      </PaperText>
    </At>
  </PaperBackground>
);

// B: "$100 TRILLION" over a big note, "= $30" on the tag.
export const Thumbnail03B: React.FC = () => (
  <PaperBackground board={PAPER_COLORS.rose.base}>
    <Piece x={W / 2} y={H / 2}>
      <Backdrop hue="rose" seed={3400} />
    </Piece>
    <At x={W / 2} y={130}>
      <Thick text={LABELS.noteShort} size={124} color={COLORS.primary} under={THEME.ink} />
    </At>
    <Piece x={560} y={430} rotate={-5}>
      <BigNote w={700} fill={PAPER_COLORS.green.light} seed={3410} size={56} />
    </Piece>
    <Piece x={1000} y={600} rotate={-8}>
      <Tag text={LABELS.noteEquals} size={110} seed={3411} />
    </Piece>
  </PaperBackground>
);

// C: the press prints money, not bread.
export const Thumbnail03C: React.FC = () => (
  <PaperBackground board={PAPER_COLORS.sky.base}>
    <Piece x={W / 2} y={H / 2}>
      <Backdrop hue="sky" seed={3500} />
    </Piece>
    <At x={360} y={150}>
      <Thick text="PRINT" size={150} color={COLORS.primary} under={THEME.ink} />
    </At>
    <At x={360} y={320}>
      <Thick text="MORE?" size={150} color={THEME.amber} under={THEME.ink} />
    </At>
    <Piece x={330} y={540} scale={0.6}>
      <PrintingPress spin={20} />
    </Piece>
    {Array.from({ length: 7 }, (_, k) => (
      <Piece key={k} x={560 + k * 62} y={560 - k * 34 + (k % 2) * 26} rotate={-20 + k * 9}>
        <PaperNote w={150} value="$" fill={PAPER_COLORS.green.light} seed={3510 + k} depth={2} />
      </Piece>
    ))}
    <Piece x={1060} y={430} rotate={6}>
      <Loaf w={260} seed={3520} />
    </Piece>
    <At x={1060} y={240}>
      <Thick text="?" size={190} color={COLORS.primary} under={THEME.ink} />
    </At>
  </PaperBackground>
);
