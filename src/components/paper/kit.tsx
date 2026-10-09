/**
 * Video 02 paper kit: the recurring paper objects (banknotes, banks, figures,
 * the ledger, the typewriter...) and labels, all built from a few paper
 * pieces each, like a pop-up book. Every object is drawn around (0, 0):
 * place it with <Piece>. Colours come from the brand and paper palettes.
 */
import type React from "react";
import { COLORS, FONT, PAPER_COLORS, TEXT_OPACITY } from "../../brand/tokens";
import { At, PaperSvg, Piece } from "./Piece";
import { PaperShape } from "./PaperShape";
import { PaperText } from "./PaperText";
import {
  jitter,
  paperCircle,
  paperEllipse,
  paperPolygon,
  paperRect,
  paperRoundRect,
} from "./paperPath";
import { EASE } from "../../brand/tokens";
import { mix, ramp } from "../../lib/motion";
import { onTwos, placed } from "../../lib/paper-motion";
import { THEME } from "./theme";

const S = THEME.shadow;

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export type Entry = {
  /** Offset still to travel (px): 0 once landed. */
  readonly dx: number;
  readonly dy: number;
  readonly rotate: number;
  /** Extra shadow depth while travelling. */
  readonly lift: number;
  /** False before the entry starts: don't draw. */
  readonly on: boolean;
  readonly t: number;
};

/** A piece placed by hand: comes in from an offset, overshoots slightly, settles (on twos). */
export const enter = (
  frame: number,
  at: number,
  { from = [0, -500] as readonly [number, number], dur = 14, seed = 1, wobbleDeg = 2 } = {},
): Entry => {
  const p = placed(frame, at, dur, { seed, wobbleDeg });
  const rest = 1 - p.t;
  return { dx: from[0] * rest, dy: from[1] * rest, rotate: p.rotate, lift: p.lift * 1.6, on: frame >= at, t: p.t };
};

/** A piece leaving: 0 before `at`, then the offset it has travelled (eases in, on twos). */
export const leave = (frame: number, at: number, to: readonly [number, number], dur = 14) => {
  const t = Number.isFinite(at) ? ramp(onTwos(frame), at, dur, EASE.in) : 0;
  return { dx: to[0] * t, dy: to[1] * t, gone: t >= 1, t };
};

// ---------------------------------------------------------------------------
// Labels and text
// ---------------------------------------------------------------------------

type LabelProps = {
  readonly text: string;
  readonly fontSize?: number;
  /** Paper strip behind the text. */
  readonly strip?: string;
  readonly ink?: string;
  readonly depth?: number;
  readonly seed?: number;
  readonly weight?: number;
  readonly torn?: boolean;
  readonly padX?: number;
};

/** A word cut from paper, on its own paper strip. */
export const Label: React.FC<LabelProps> = ({
  text,
  fontSize = 44,
  strip = COLORS.primary,
  ink = THEME.ink,
  depth = 1,
  seed = 1,
  weight = FONT.weight.heading,
  torn = false,
  padX = 28,
}) => {
  const w = text.length * fontSize * 0.58 + padX * 2;
  const h = fontSize * 1.55;
  return (
    <>
      <PaperSvg w={w + 40} h={h + 40}>
        <PaperShape d={paperRect(-w / 2, -h / 2, w, h, { seed, torn: torn ? "ends" : undefined })} fill={strip} depth={depth} shadowOpacity={S} />
      </PaperSvg>
      <At x={0} y={0}>
        <PaperText color={ink} fontSize={fontSize} weight={weight} depth={0.3} shadowOpacity={S}>
          {text}
        </PaperText>
      </At>
    </>
  );
};

/** Paper text alone, centred on the piece. */
export const Words: React.FC<{
  readonly text: string;
  readonly size?: number;
  readonly color?: string;
  readonly depth?: number;
  readonly weight?: number;
  readonly x?: number;
  readonly y?: number;
}> = ({ text, size = 52, color = THEME.ink, depth = 0.8, weight = FONT.weight.heading, x = 0, y = 0 }) => (
  <At x={x} y={y}>
    <PaperText color={color} fontSize={size} weight={weight} depth={depth} shadowOpacity={S}>
      {text}
    </PaperText>
  </At>
);

/** A flat source line (lower third): no shadow, no grain, so it stays readable. */
export const SourceLine: React.FC<{ readonly text: string; readonly frame: number; readonly at: number; readonly until?: number }> = ({
  text,
  frame,
  at,
  until = Infinity,
}) => {
  if (frame < at || frame >= until) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 128,
        bottom: 96,
        fontFamily: FONT.family,
        fontSize: 36,
        fontWeight: FONT.weight.body,
        color: THEME.ink,
        opacity: TEXT_OPACITY.secondary * ramp(onTwos(frame), at, 8),
      }}
    >
      Source: {text}
    </div>
  );
};

/** The small pinned "Example" tag (script: whenever Sarah is on screen). */
export const ExampleTag: React.FC<{ readonly frame: number; readonly at: number; readonly until?: number; readonly text?: string }> = ({
  frame,
  at,
  until = Infinity,
  text = "Example",
}) => {
  const e = enter(frame, at, { from: [0, -200], dur: 12, seed: 501 });
  const out = leave(frame, until, [0, -260], 10);
  if (!e.on || out.gone) return null;
  return (
    <Piece x={1792 - (text.length * 38 * 0.58 + 56) / 2 - 10 + e.dx} y={160 + e.dy + out.dy} rotate={4 + e.rotate}>
      <Label text={text} fontSize={38} strip={PAPER_COLORS.kraft.light} depth={1.2 + e.lift} seed={502} />
      <PaperSvg w={40} h={40}>
        <PaperShape d={paperCircle(0, -38, 9, { seed: 503 })} fill={COLORS.coral} depth={0.8} shadowOpacity={S} />
      </PaperSvg>
    </Piece>
  );
};

/**
 * Paper flip-digit tiles showing `text`. From `flipAt`, digit tiles flip
 * through random digits and settle; `changeAt` re-flips to `next`.
 */
export const FlipNumber: React.FC<{
  readonly text: string;
  readonly frame: number;
  readonly flipAt: number;
  readonly size?: number;
  readonly tile?: string;
  readonly ink?: string;
  readonly seed?: number;
}> = ({ text, frame, flipAt, size = 96, tile = COLORS.primary, ink = THEME.ink, seed = 1 }) => {
  const f = onTwos(frame);
  const chars = text.split("");
  const tw = (c: string) => (/[\d$]/.test(c) ? size * 0.72 : size * 0.36);
  const gap = size * 0.06;
  const total = chars.reduce((s, c) => s + tw(c) + gap, -gap);
  let x = -total / 2;
  return (
    <>
      {chars.map((c, i) => {
        const w = tw(c);
        const cx = x + w / 2;
        x += w + gap;
        const isDigit = /\d/.test(c);
        const flips = isDigit ? 3 + Math.floor(((jitter(seed, i) + 1) / 2) * 4) : 0;
        const start = flipAt + i * 2;
        const k = Math.floor((f - start) / 4);
        const flipping = f >= start && k < flips;
        const shown = f < start ? "" : flipping ? String(Math.floor(((jitter(seed + 7 + i, k) + 1) / 2) * 10) % 10) : c;
        const squash = flipping && (f - start) % 4 < 2 ? 0.2 : 1;
        const bg = /[\d$]/.test(c);
        return (
          <Piece key={i} x={cx} y={0} scaleY={squash}>
            {bg ? (
              <PaperSvg w={w + 16} h={size * 1.25 + 16}>
                <PaperShape d={paperRoundRect(-w / 2, -size * 0.62, w, size * 1.24, size * 0.1, { seed: seed + 30 + i })} fill={tile} depth={0.8} shadowOpacity={S} />
              </PaperSvg>
            ) : null}
            <At x={0} y={2}>
              <PaperText color={ink} fontSize={size} depth={0}>
                {shown}
              </PaperText>
            </At>
          </Piece>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Objects
// ---------------------------------------------------------------------------

/** A paper banknote (green), optionally labelled. */
export const Banknote: React.FC<{ readonly seed?: number; readonly label?: string; readonly w?: number; readonly depth?: number }> = ({
  seed = 1,
  label,
  w = 170,
  depth = 1,
}) => {
  const h = w * 0.48;
  return (
    <>
      <PaperSvg w={w + 30} h={h + 30}>
        <PaperShape d={paperRect(-w / 2, -h / 2, w, h, { seed })} fill={PAPER_COLORS.green.base} depth={depth} shadowOpacity={S} />
        <PaperShape d={paperRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, { seed: seed + 5 })} fill={PAPER_COLORS.green.light} depth={0.3} shadowOpacity={S} />
        <PaperShape d={paperCircle(0, 0, h * 0.28, { seed: seed + 9 })} fill={PAPER_COLORS.green.dark} depth={0.3} shadowOpacity={S} />
      </PaperSvg>
      {label ? <Words text={label} size={36} y={0} depth={0} color={COLORS.primary} /> : null}
    </>
  );
};

/** A paper bank: roof (triangle or dome), three columns, a base. */
export const Bank: React.FC<{
  readonly seed?: number;
  readonly dome?: boolean;
  readonly label?: string;
  readonly roof?: string;
  readonly w?: number;
  /** Colour of the cornice and base bars (navy; brown in the sepia flashback). */
  readonly ink?: string;
}> = ({ seed = 1, dome = false, label, roof = PAPER_COLORS.sky.dark, w = 300, ink = THEME.ink }) => {
  const h = w * 0.62;
  const colW = w * 0.12;
  const roofH = w * 0.34;
  const roofPath = dome
    ? paperEllipse(0, -h / 2, w * 0.52, roofH * 0.95, { seed: seed + 1 })
    : paperPolygon(
        [
          [-w * 0.58, -h / 2],
          [0, -h / 2 - roofH],
          [w * 0.58, -h / 2],
        ],
        { seed: seed + 1 },
      );
  return (
    <>
      <PaperSvg w={w * 1.4} h={h + roofH * 2 + 60}>
        <PaperShape d={roofPath} fill={roof} depth={1.2} shadowOpacity={S} />
        <PaperShape d={paperRect(-w * 0.55, -h / 2 - 6, w * 1.1, 26, { seed: seed + 2 })} fill={ink} depth={0.8} shadowOpacity={S} />
        {[-1, 0, 1].map((k) => (
          <PaperShape key={k} d={paperRect(k * w * 0.32 - colW / 2, -h / 2 + 20, colW, h - 40, { seed: seed + 3 + k })} fill={COLORS.primary} depth={0.9} shadowOpacity={S} />
        ))}
        <PaperShape d={paperRect(-w * 0.6, h / 2 - 24, w * 1.2, 34, { seed: seed + 7 })} fill={ink} depth={1} shadowOpacity={S} />
      </PaperSvg>
      {label ? <Words text={label} size={40} y={h / 2 + 50} depth={0.6} color={ink} /> : null}
    </>
  );
};

/** A faceless paper figure: head, body, two arms. `reach` lifts the right arm forward. */
export const Figure: React.FC<{
  readonly body: string;
  readonly seed?: number;
  readonly scarf?: boolean;
  readonly reach?: number;
  readonly size?: number;
}> = ({ body, seed = 1, scarf = false, reach = 0, size = 1 }) => {
  const s = size;
  const armR = mix(12, -70, reach);
  return (
    <PaperSvg w={260 * s} h={420 * s}>
      <g transform={`translate(${34 * s} ${-70 * s}) rotate(${armR})`}>
        <PaperShape d={paperRoundRect(-11 * s, 0, 22 * s, 120 * s, 11 * s, { seed: seed + 4 })} fill={body} depth={0.9} shadowOpacity={S} />
      </g>
      <PaperShape d={paperRoundRect(-48 * s, -95 * s, 96 * s, 200 * s, 44 * s, { seed: seed + 1 })} fill={body} depth={1.1} shadowOpacity={S} />
      <g transform={`translate(${-34 * s} ${-70 * s}) rotate(${-12})`}>
        <PaperShape d={paperRoundRect(-11 * s, 0, 22 * s, 120 * s, 11 * s, { seed: seed + 5 })} fill={body} depth={0.9} shadowOpacity={S} />
      </g>
      <PaperShape d={paperCircle(0, -140 * s, 42 * s, { seed: seed + 2 })} fill={PAPER_COLORS.kraft.light} depth={1.1} shadowOpacity={S} />
      {scarf ? (
        <>
          <PaperShape d={paperRoundRect(-46 * s, -100 * s, 92 * s, 26 * s, 12 * s, { seed: seed + 6 })} fill={THEME.amber} depth={1} shadowOpacity={S} />
          <PaperShape d={paperRect(14 * s, -84 * s, 22 * s, 70 * s, { seed: seed + 7 })} fill={THEME.amber} depth={1} shadowOpacity={S} />
        </>
      ) : null}
    </PaperSvg>
  );
};

/** Sarah: rose body, amber scarf (always recognisable). */
export const Sarah: React.FC<{ readonly reach?: number; readonly size?: number }> = ({ reach = 0, size = 1 }) => (
  <Figure body={PAPER_COLORS.rose.base} scarf seed={700} reach={reach} size={size} />
);

/** Body colours for the other (anonymous) figures. */
export const FIGURE_COLORS = [PAPER_COLORS.sky.dark, PAPER_COLORS.green.dark, PAPER_COLORS.plum.base, PAPER_COLORS.kraft.base] as const;

/** The open ledger: navy cover, two cream pages, a spine. */
export const Ledger: React.FC<{ readonly w?: number; readonly h?: number }> = ({ w = 1100, h = 560 }) => (
  <PaperSvg w={w + 80} h={h + 80}>
    <PaperShape d={paperRoundRect(-w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 18, { seed: 801 })} fill={THEME.ink} depth={1.3} shadowOpacity={S} />
    <PaperShape d={paperRect(-w / 2, -h / 2, w / 2 - 6, h, { seed: 802 })} fill={COLORS.primary} depth={0.6} shadowOpacity={S} />
    <PaperShape d={paperRect(6, -h / 2, w / 2 - 6, h, { seed: 803 })} fill={COLORS.primary} depth={0.6} shadowOpacity={S} />
    {Array.from({ length: Math.max(0, Math.floor((h - 150) / 60)) }, (_, k) => (
      <g key={k}>
        <line x1={-w / 2 + 30} x2={-36} y1={-h / 2 + 120 + k * 60} y2={-h / 2 + 120 + k * 60} stroke={COLORS.mutedStrong} strokeOpacity={0.25} strokeWidth={2} />
        <line x1={36} x2={w / 2 - 30} y1={-h / 2 + 120 + k * 60} y2={-h / 2 + 120 + k * 60} stroke={COLORS.mutedStrong} strokeOpacity={0.25} strokeWidth={2} />
      </g>
    ))}
  </PaperSvg>
);

/** A strip of typed paper (a ledger entry). */
export const Entry: React.FC<{ readonly text: string; readonly fill?: string; readonly ink?: string; readonly w?: number; readonly seed?: number; readonly depth?: number }> = ({
  text,
  fill = COLORS.primary,
  ink = THEME.ink,
  w = 470,
  seed = 1,
  depth = 1,
}) => (
  <>
    <PaperSvg w={w + 30} h={110}>
      <PaperShape d={paperRect(-w / 2, -34, w, 68, { seed })} fill={fill} depth={depth} shadowOpacity={S} />
    </PaperSvg>
    <Words text={text} size={38} depth={0} color={ink} />
  </>
);

/** A paper typewriter: body, a row of keys (one can be pressed), the paper bail. */
export const Typewriter: React.FC<{ readonly pressed?: number; readonly w?: number }> = ({ pressed = -1, w = 420 }) => (
  <PaperSvg w={w + 60} h={260}>
    <PaperShape d={paperRect(-w * 0.42, -110, w * 0.84, 40, { seed: 851 })} fill={THEME.ink} depth={1} shadowOpacity={S} />
    <PaperShape d={paperRoundRect(-w / 2, -80, w, 170, 30, { seed: 852 })} fill={THEME.slate} depth={1.3} shadowOpacity={S} />
    {Array.from({ length: 7 }, (_, k) => (
      <PaperShape
        key={k}
        d={paperCircle(-w * 0.36 + k * w * 0.12, k === pressed ? 26 : 16, 18, { seed: 860 + k })}
        fill={COLORS.primary}
        depth={k === pressed ? 0.3 : 0.9}
        shadowOpacity={S}
      />
    ))}
  </PaperSvg>
);

/** A small paper car; wheels turn by `wheel` degrees. */
export const Car: React.FC<{ readonly wheel?: number; readonly body?: string }> = ({ wheel = 0, body = PAPER_COLORS.sky.base }) => (
  <PaperSvg w={340} h={200}>
    <PaperShape d={paperRoundRect(-90, -78, 180, 70, 28, { seed: 871 })} fill={body} depth={1} shadowOpacity={S} />
    <PaperShape d={paperRect(-60, -64, 50, 44, { seed: 872 })} fill={PAPER_COLORS.sky.light} depth={0.4} shadowOpacity={S} />
    <PaperShape d={paperRect(4, -64, 56, 44, { seed: 873 })} fill={PAPER_COLORS.sky.light} depth={0.4} shadowOpacity={S} />
    <PaperShape d={paperRoundRect(-150, -24, 300, 70, 24, { seed: 874 })} fill={body} depth={1.2} shadowOpacity={S} />
    {[-90, 90].map((x) => (
      <g key={x} transform={`translate(${x} 48) rotate(${wheel})`}>
        <PaperShape d={paperCircle(0, 0, 32, { seed: 875 + x })} fill={THEME.ink} depth={1} shadowOpacity={S} />
        <PaperShape d={paperRect(-4, -26, 8, 52, { seed: 877 })} fill={THEME.slate} depth={0.3} shadowOpacity={S} />
      </g>
    ))}
  </PaperSvg>
);

/** A paper piggy bank (other customers' savings). */
export const Piggy: React.FC<{ readonly seed?: number }> = ({ seed = 1 }) => (
  <PaperSvg w={220} h={170}>
    {[-40, 30].map((x) => (
      <PaperShape key={x} d={paperRect(x, 20, 22, 44, { seed: seed + x })} fill={PAPER_COLORS.rose.dark} depth={0.6} shadowOpacity={S} />
    ))}
    <PaperShape d={paperEllipse(0, 0, 80, 56, { seed })} fill={PAPER_COLORS.rose.light} depth={1} shadowOpacity={S} />
    <PaperShape d={paperEllipse(80, 4, 18, 22, { seed: seed + 1 })} fill={PAPER_COLORS.rose.base} depth={0.6} shadowOpacity={S} />
    <PaperShape d={paperRect(-14, -58, 34, 8, { seed: seed + 2 })} fill={PAPER_COLORS.rose.dark} depth={0.3} shadowOpacity={S} />
  </PaperSvg>
);

/** An aged paper document with a folded corner. */
export const Doc: React.FC<{ readonly w?: number; readonly h?: number }> = ({ w = 900, h = 560 }) => (
  <PaperSvg w={w + 60} h={h + 60}>
    <PaperShape
      d={paperPolygon(
        [
          [-w / 2, -h / 2],
          [w / 2 - 70, -h / 2],
          [w / 2, -h / 2 + 70],
          [w / 2, h / 2],
          [-w / 2, h / 2],
        ],
        { seed: 881 },
      )}
      fill={PAPER_COLORS.kraft.light}
      depth={1.3}
      shadowOpacity={S}
    />
    <PaperShape
      d={paperPolygon(
        [
          [w / 2 - 70, -h / 2],
          [w / 2 - 70, -h / 2 + 70],
          [w / 2, -h / 2 + 70],
        ],
        { seed: 882 },
      )}
      fill={PAPER_COLORS.kraft.base}
      depth={0.6}
      shadowOpacity={S}
    />
  </PaperSvg>
);

/** A paper box with a lid that opens (`open` 0..1). */
export const Box: React.FC<{ readonly open?: number; readonly w?: number; readonly fill?: string }> = ({ open = 0, w = 260, fill = PAPER_COLORS.kraft.base }) => (
  <PaperSvg w={w + 120} h={w + 160}>
    <PaperShape d={paperRect(-w / 2, -w * 0.3, w, w * 0.75, { seed: 891 })} fill={fill} depth={1.2} shadowOpacity={S} />
    <PaperShape d={paperRect(-w / 2 + 16, -w * 0.3 + 16, w - 32, w * 0.75 - 32, { seed: 892 })} fill={PAPER_COLORS.kraft.dark} depth={0} />
    <g transform={`translate(${-w / 2 - 6} ${-w * 0.3}) rotate(${-110 * open})`}>
      <PaperShape d={paperRect(0, -18, w + 12, 36, { seed: 893 })} fill={PAPER_COLORS.kraft.light} depth={1.4} shadowOpacity={S} />
    </g>
  </PaperSvg>
);

/** A paper shield (three layered pieces). */
export const Shield: React.FC<{ readonly w?: number; readonly fill?: string }> = ({ w = 420, fill = PAPER_COLORS.sky.base }) => {
  const shape = (s: number, seed: number) =>
    paperPolygon(
      [
        [-w / 2 * s, -w * 0.55 * s],
        [w / 2 * s, -w * 0.55 * s],
        [w / 2 * s, 0],
        [0, w * 0.62 * s],
        [-w / 2 * s, 0],
      ],
      { seed },
    );
  return (
    <PaperSvg w={w + 80} h={w * 1.4}>
      <PaperShape d={shape(1, 901)} fill={THEME.ink} depth={1.4} shadowOpacity={S} />
      <PaperShape d={shape(0.86, 902)} fill={fill} depth={0.8} shadowOpacity={S} />
      <PaperShape d={shape(0.66, 903)} fill={PAPER_COLORS.sky.light} depth={0.6} shadowOpacity={S} />
    </PaperSvg>
  );
};

/** A tall paper strip (a bar) of given height, growing from its bottom. */
export const Strip: React.FC<{ readonly w: number; readonly h: number; readonly fill: string; readonly seed?: number; readonly depth?: number; readonly tornTop?: boolean }> = ({
  w,
  h,
  fill,
  seed = 1,
  depth = 1,
  tornTop = false,
}) => (
  <PaperSvg w={w + 40} h={h * 2 + 40}>
    <PaperShape d={paperRect(-w / 2, -h, w, h, { seed, torn: tornTop ? "all" : undefined })} fill={fill} depth={depth} shadowOpacity={S} />
  </PaperSvg>
);

/** A thin torn strip used to cross things out. */
export const CrossStrip: React.FC<{ readonly w?: number; readonly fill?: string; readonly seed?: number }> = ({ w = 520, fill = THEME.amber, seed = 1 }) => (
  <PaperSvg w={w + 40} h={120}>
    <PaperShape d={paperRect(-w / 2, -30, w, 60, { seed, torn: "ends" })} fill={fill} depth={1.6} shadowOpacity={S} />
  </PaperSvg>
);

/**
 * Position along hand-placed keyframes [frame, x, y]: holds at each key and
 * travels to the next over `travel` frames before its frame (eased, on twos).
 * Returns the position and whether it is mid-travel (for lift/shadow).
 */
export const track = (frame: number, keys: readonly (readonly [number, number, number])[], travel = 14) => {
  const f = onTwos(frame);
  let x = keys[0][1];
  let y = keys[0][2];
  let moving = 0;
  for (let i = 1; i < keys.length; i++) {
    const [at, kx, ky] = keys[i];
    const t = ramp(f, at - travel, travel, EASE.inOut);
    if (t > 0 && t < 1) moving = Math.sin(Math.PI * t);
    x = mix(x, kx, t);
    y = mix(y, ky, t);
  }
  return { x, y, moving };
};
