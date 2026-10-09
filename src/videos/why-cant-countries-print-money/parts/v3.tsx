/**
 * Video 03 paper parts: bread, the printing press, generic banknotes, the
 * island, the balance scale, maps, a thermometer, flip cards... Each is drawn
 * around (0, 0): place it with <Piece>. Light paper theme, brand + paper
 * palettes only.
 */
import type React from "react";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { Figure, Label, Words } from "../../../components/paper/kit";
import { At, PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { jitter, paperCircle, paperEllipse, paperHill, paperPolygon, paperRect, paperRoundRect } from "../../../components/paper/paperPath";
import { THEME } from "../../../components/paper/theme";
import { mix, ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { OUTLINES } from "./outlines";

const S = THEME.shadow;

/** A loaf of bread: crust, a lighter top, three score marks. `half` cuts it. */
export const Loaf: React.FC<{ readonly seed?: number; readonly w?: number; readonly half?: "left" | "right" }> = ({ seed = 1, w = 120, half }) => {
  const h = w * 0.55;
  const clipId = half ? `loaf-${half}-${seed}-${w}` : undefined;
  return (
    <PaperSvg w={w + 30} h={h + 30}>
      {clipId ? (
        <defs>
          <clipPath id={clipId}>
            <rect x={half === "left" ? -w : 0} y={-h} width={w} height={h * 2} />
          </clipPath>
        </defs>
      ) : null}
      <g clipPath={clipId ? `url(#${clipId})` : undefined}>
        <PaperShape d={paperEllipse(0, 0, w / 2, h / 2, { seed })} fill={PAPER_COLORS.kraft.base} depth={1} shadowOpacity={S} />
        <PaperShape d={paperEllipse(0, -h * 0.12, w * 0.42, h * 0.3, { seed: seed + 1 })} fill={PAPER_COLORS.kraft.light} depth={0.4} shadowOpacity={S} />
        {[-1, 0, 1].map((k) => (
          <path
            key={k}
            d={`M ${k * w * 0.2 - w * 0.06} ${-h * 0.22} L ${k * w * 0.2 + w * 0.06} ${h * 0.02}`}
            stroke={PAPER_COLORS.kraft.dark}
            strokeWidth={Math.max(2, w * 0.035)}
            strokeLinecap="round"
          />
        ))}
      </g>
    </PaperSvg>
  );
};

/** A generic paper banknote (no real design): border and a value. */
export const PaperNote: React.FC<{
  readonly value?: string;
  readonly w?: number;
  readonly fill?: string;
  readonly ink?: string;
  readonly seed?: number;
  readonly depth?: number;
}> = ({ value = "$", w = 160, fill = COLORS.primary, ink = THEME.ink, seed = 1, depth = 1 }) => {
  const h = w * 0.48;
  return (
    <>
      <PaperSvg w={w + 30} h={h + 30}>
        <PaperShape d={paperRect(-w / 2, -h / 2, w, h, { seed })} fill={fill} depth={depth} shadowOpacity={S} />
        <rect x={-w / 2 + w * 0.06} y={-h / 2 + h * 0.12} width={w * 0.88} height={h * 0.76} fill="none" stroke={ink} strokeOpacity={0.35} strokeWidth={Math.max(2, w * 0.012)} />
      </PaperSvg>
      {w >= 140 ? <Words text={value} size={Math.max(36, Math.round(h * 0.42))} depth={0} color={ink} /> : null}
    </>
  );
};

/** A paper printing press: body, two turning rollers, an output tray. `spin` in degrees. */
export const PrintingPress: React.FC<{ readonly spin?: number; readonly w?: number }> = ({ spin = 0, w = 420 }) => {
  const s = w / 420;
  return (
    <PaperSvg w={w + 80} h={520 * s}>
      {[-1, 1].map((k) => (
        <PaperShape key={`leg${k}`} d={paperRect(k * 150 * s - 18 * s, 100 * s, 36 * s, 110 * s, { seed: 3006 + k })} fill={THEME.ink} depth={1} shadowOpacity={S} />
      ))}
      <PaperShape d={paperRect(-130 * s, -215 * s, 260 * s, 110 * s, { seed: 3009 })} fill={PAPER_COLORS.green.light} depth={0.9} shadowOpacity={S} />
      <PaperShape d={paperRect(-150 * s, -185 * s, 300 * s, 90 * s, { seed: 3010 })} fill={COLORS.primary} depth={1.1} shadowOpacity={S} />
      <PaperShape d={paperRoundRect(-200 * s, -130 * s, 400 * s, 250 * s, 26 * s, { seed: 3001 })} fill={THEME.slate} depth={1.4} shadowOpacity={S} />
      {[-1, 1].map((k) => (
        <g key={k} transform={`translate(${k * 90 * s} ${-35 * s}) rotate(${spin * k})`}>
          <PaperShape d={paperCircle(0, 0, 50 * s, { seed: 3002 + k })} fill={THEME.ink} depth={1} shadowOpacity={S} />
          <PaperShape d={paperRect(-6 * s, -40 * s, 12 * s, 80 * s, { seed: 3004 })} fill={THEME.slate} depth={0.3} shadowOpacity={S} />
        </g>
      ))}
      <PaperShape d={paperRect(-170 * s, 70 * s, 340 * s, 26 * s, { seed: 3005 })} fill={THEME.ink} depth={0.8} shadowOpacity={S} />
    </PaperSvg>
  );
};

/** Paper notes leaving a press: each pops out of the tray at its time and slides to its target. */
export const PressOutput: React.FC<{
  readonly frame: number;
  readonly from: readonly [number, number];
  readonly times: readonly number[];
  readonly to: (k: number) => readonly [number, number];
  readonly fill?: string;
  readonly w?: number;
  readonly travel?: number;
}> = ({ frame, from, times, to, fill = PAPER_COLORS.green.light, w = 90, travel = 16 }) => {
  const f = onTwos(frame);
  return (
    <>
      {times.map((at, k) => {
        if (f < at) return null;
        const t = ramp(f, at, travel, EASE.out);
        const [tx, ty] = to(k);
        const arc = Math.sin(Math.PI * t) * -60;
        return (
          <Piece key={k} x={mix(from[0], tx, t)} y={mix(from[1], ty, t) + arc} rotate={jitter(3010, k) * 12 * (1 - t) + jitter(3011, k) * 6}>
            <PaperNote w={w} fill={fill} seed={3020 + k} depth={1 + Math.sin(Math.PI * t) * 1.4} />
          </Piece>
        );
      })}
    </>
  );
};

/** A paper wall clock; `angle` turns the long hand (degrees). */
export const Clock: React.FC<{ readonly angle?: number; readonly r?: number }> = ({ angle = 0, r = 110 }) => (
  <PaperSvg w={r * 2 + 40} h={r * 2 + 40}>
    <PaperShape d={paperCircle(0, 0, r, { seed: 3030 })} fill={THEME.ink} depth={1.4} shadowOpacity={S} />
    <PaperShape d={paperCircle(0, 0, r - 16, { seed: 3031 })} fill={COLORS.primary} depth={0.4} shadowOpacity={S} />
    {Array.from({ length: 12 }, (_, k) => (
      <rect key={k} x={-3} y={-(r - 26)} width={6} height={14} fill={THEME.ink} transform={`rotate(${k * 30})`} />
    ))}
    <g transform={`rotate(${angle * 0.083})`}>
      <PaperShape d={paperRoundRect(-6, -(r - 50), 12, r - 50, 6, { seed: 3032 })} fill={THEME.ink} depth={0.6} shadowOpacity={S} />
    </g>
    <g transform={`rotate(${angle})`}>
      <PaperShape d={paperRoundRect(-4, -(r - 28), 8, r - 28, 4, { seed: 3033 })} fill={COLORS.coral} depth={0.8} shadowOpacity={S} />
    </g>
    <PaperShape d={paperCircle(0, 0, 10, { seed: 3034 })} fill={THEME.ink} depth={0.9} shadowOpacity={S} />
  </PaperSvg>
);

/** A small hanging price tag with paper digits. */
export const PriceTag: React.FC<{ readonly text: string; readonly fill?: string; readonly size?: number; readonly seed?: number }> = ({
  text,
  fill = PAPER_COLORS.kraft.light,
  size = 40,
  seed = 1,
}) => <Label text={text} fontSize={size} strip={fill} seed={seed} padX={18} />;

/** A paper palm tree: curved trunk segments and five leaves. */
export const Palm: React.FC<{ readonly sway?: number }> = ({ sway = 0 }) => (
  <PaperSvg w={360} h={460}>
    {Array.from({ length: 5 }, (_, k) => (
      <PaperShape key={k} d={paperRoundRect(-16 + k * 4, 180 - k * 70, 30, 74, 10, { seed: 3040 + k })} fill={PAPER_COLORS.kraft.dark} depth={1} shadowOpacity={S} />
    ))}
    <g transform={`translate(18 -170) rotate(${sway})`}>
      {[-150, -110, -60, -20, 30].map((a, k) => (
        <g key={a} transform={`rotate(${a})`}>
          <PaperShape d={paperEllipse(70, 0, 80, 22, { seed: 3050 + k })} fill={k % 2 ? PAPER_COLORS.green.base : PAPER_COLORS.leaf.base} depth={1.2} shadowOpacity={S} />
        </g>
      ))}
    </g>
  </PaperSvg>
);

/**
 * The island: a paper diorama card of sea (two layers, sliding with `wave`)
 * and a sandy island rising by `t`. Kept inside the safe area: 1700 px wide,
 * its bottom edge 220 px below the piece's origin.
 */
export const Island: React.FC<{ readonly t: number; readonly wave: number }> = ({ t, wave }) => (
  <PaperSvg w={1800} h={560}>
    <PaperShape d={paperRect(-850, 40, 1700, 180, { seed: 3060, torn: "all" })} fill={PAPER_COLORS.sky.base} depth={1} shadowOpacity={S} />
    <g transform={`translate(0 ${mix(240, 0, t)})`}>
      <PaperShape d={paperEllipse(0, 80, 640, 120, { seed: 3061 })} fill={PAPER_COLORS.kraft.light} depth={1.4} shadowOpacity={S} />
    </g>
    <g transform={`translate(${wave} 0)`}>
      <PaperShape d={paperHill(-800, 800, 170, 218, { seed: 3062, amplitude: 12, waves: 9 })} fill={PAPER_COLORS.sky.dark} depth={1.4} shadowOpacity={S} />
    </g>
  </PaperSvg>
);

/** A small market table. */
export const MarketTable: React.FC<{ readonly w?: number }> = ({ w = 820 }) => (
  <PaperSvg w={w + 40} h={200}>
    {[-1, 1].map((k) => (
      <PaperShape key={k} d={paperRect(k * (w / 2 - 50) - 10, 0, 20, 90, { seed: 3070 + k })} fill={PAPER_COLORS.kraft.dark} depth={0.8} shadowOpacity={S} />
    ))}
    <PaperShape d={paperRect(-w / 2, -18, w, 32, { seed: 3072 })} fill={PAPER_COLORS.kraft.base} depth={1.3} shadowOpacity={S} />
  </PaperSvg>
);

/** A balance scale: post, base, a beam tilted by `tilt` degrees, two pans (children render on the pans). */
export const BalanceScale: React.FC<{
  readonly tilt: number;
  readonly left: React.ReactNode;
  readonly right: React.ReactNode;
  readonly arm?: number;
}> = ({ tilt, left, right, arm = 380 }) => {
  const rad = (tilt * Math.PI) / 180;
  const pan = (side: -1 | 1) => ({ x: side * arm * Math.cos(rad), y: side * arm * Math.sin(rad) });
  const L = pan(-1);
  const R = pan(1);
  const pans = [
    { p: L, content: left },
    { p: R, content: right },
  ];
  return (
    <>
      <PaperSvg w={arm * 2 + 300} h={760}>
        <PaperShape d={paperRect(-140, 300, 280, 40, { seed: 3080 })} fill={THEME.ink} depth={1.4} shadowOpacity={S} />
        <PaperShape d={paperRect(-16, -20, 32, 320, { seed: 3081 })} fill={THEME.slate} depth={1.2} shadowOpacity={S} />
        <g transform={`rotate(${tilt})`}>
          <PaperShape d={paperRoundRect(-arm - 20, -14, arm * 2 + 40, 28, 12, { seed: 3082 })} fill={THEME.ink} depth={1.6} shadowOpacity={S} />
        </g>
        {pans.map(({ p }, k) => (
          <g key={k}>
            <line x1={p.x} y1={p.y} x2={p.x - 110} y2={p.y + 150} stroke={THEME.ink} strokeWidth={3} />
            <line x1={p.x} y1={p.y} x2={p.x + 110} y2={p.y + 150} stroke={THEME.ink} strokeWidth={3} />
            <PaperShape d={paperEllipse(p.x, p.y + 158, 150, 22, { seed: 3083 + k })} fill={THEME.slate} depth={1.2} shadowOpacity={S} />
          </g>
        ))}
        <PaperShape d={paperCircle(0, 0, 22, { seed: 3085 })} fill={PAPER_COLORS.kraft.base} depth={1.8} shadowOpacity={S} />
      </PaperSvg>
      {pans.map(({ p, content }, k) => (
        <Piece key={k} x={p.x} y={p.y + 130}>
          {content}
        </Piece>
      ))}
    </>
  );
};

/** A paper house. */
export const House: React.FC<{ readonly body?: string; readonly roof?: string; readonly w?: number; readonly seed?: number }> = ({
  body = PAPER_COLORS.rose.base,
  roof = PAPER_COLORS.rose.dark,
  w = 150,
  seed = 3090,
}) => (
  <PaperSvg w={w + 60} h={w * 1.3}>
    <PaperShape
      d={paperPolygon(
        [
          [-w / 2 - 14, -w * 0.15],
          [0, -w * 0.6],
          [w / 2 + 14, -w * 0.15],
        ],
        { seed },
      )}
      fill={roof}
      depth={1.3}
      shadowOpacity={S}
    />
    <PaperShape d={paperRect(-w / 2, -w * 0.15, w, w * 0.62, { seed: seed + 1 })} fill={body} depth={1.1} shadowOpacity={S} />
    <PaperShape d={paperRoundRect(-w * 0.12, w * 0.15, w * 0.24, w * 0.32, w * 0.08, { seed: seed + 2 })} fill={THEME.ink} depth={0.4} shadowOpacity={S} />
  </PaperSvg>
);

/** A paper phone. */
export const Phone: React.FC<{ readonly h?: number }> = ({ h = 150 }) => (
  <PaperSvg w={h} h={h + 30}>
    <PaperShape d={paperRoundRect(-h * 0.27, -h / 2, h * 0.54, h, h * 0.1, { seed: 3100 })} fill={THEME.ink} depth={1.2} shadowOpacity={S} />
    <PaperShape d={paperRoundRect(-h * 0.21, -h * 0.4, h * 0.42, h * 0.72, h * 0.05, { seed: 3101 })} fill={PAPER_COLORS.sky.light} depth={0.4} shadowOpacity={S} />
  </PaperSvg>
);

/** A faceless doctor: a figure in a white-cream coat with a stethoscope. */
export const Doctor: React.FC<{ readonly size?: number }> = ({ size = 0.5 }) => (
  <>
    <Figure body={THEME.card} seed={3110} size={size} />
    <PaperSvg w={200 * size} h={300 * size}>
      <path
        d={`M ${-26 * size} ${-90 * size} Q ${-30 * size} ${-20 * size} 0 ${-10 * size} Q ${30 * size} ${-20 * size} ${26 * size} ${-90 * size}`}
        fill="none"
        stroke={THEME.slate}
        strokeWidth={6 * size}
      />
      <PaperShape d={paperCircle(0, -6 * size, 10 * size, { seed: 3111 })} fill={THEME.slate} depth={0.6} shadowOpacity={S} />
    </PaperSvg>
  </>
);

/** A paper ticket ("Claim"). */
export const Ticket: React.FC<{ readonly text?: string; readonly seed?: number }> = ({ text = "Claim", seed = 3120 }) => (
  <Label text={text} fontSize={36} strip={PAPER_COLORS.plum.light} seed={seed} padX={16} />
);

/** A paper factory: building, chimney, sawtooth roof. */
export const Factory: React.FC = () => (
  <PaperSvg w={340} h={300}>
    <PaperShape d={paperRect(70, -130, 40, 110, { seed: 3130 })} fill={THEME.slate} depth={1} shadowOpacity={S} />
    <PaperShape
      d={paperPolygon(
        [
          [-140, -20],
          [-140, -80],
          [-80, -20],
          [-80, -80],
          [-20, -20],
          [-20, -80],
          [40, -20],
          [140, -20],
          [140, 100],
          [-140, 100],
        ],
        { seed: 3131 },
      )}
      fill={PAPER_COLORS.kraft.base}
      depth={1.2}
      shadowOpacity={S}
    />
  </PaperSvg>
);

/** A crate of goods. */
export const Crate: React.FC<{ readonly seed?: number }> = ({ seed = 3140 }) => (
  <PaperSvg w={110} h={100}>
    <PaperShape d={paperRect(-40, -34, 80, 68, { seed })} fill={PAPER_COLORS.kraft.light} depth={1} shadowOpacity={S} />
    <path d="M -40 -34 L 40 34 M 40 -34 L -40 34" stroke={PAPER_COLORS.kraft.dark} strokeWidth={4} />
  </PaperSvg>
);

/** A paper thermometer; `level` 0..1 fills the column. */
export const Thermometer: React.FC<{ readonly level: number; readonly h?: number; readonly fill?: string }> = ({ level, h = 520, fill = COLORS.coral }) => (
  <PaperSvg w={200} h={h + 160}>
    <PaperShape d={paperRoundRect(-36, -h / 2, 72, h, 36, { seed: 3150 })} fill={COLORS.primary} depth={1.4} shadowOpacity={S} />
    <PaperShape d={paperCircle(0, h / 2 + 30, 58, { seed: 3151 })} fill={fill} depth={1.4} shadowOpacity={S} />
    <PaperShape d={paperRoundRect(-18, h / 2 - (h - 40) * Math.min(1, level) - 10, 36, (h - 40) * Math.min(1, level) + 40, 18, { seed: 3152 })} fill={fill} depth={0.6} shadowOpacity={S} />
    {Array.from({ length: 9 }, (_, k) => (
      <rect key={k} x={36} y={h / 2 - 40 - k * ((h - 80) / 8)} width={22} height={4} fill={THEME.ink} opacity={0.6} />
    ))}
  </PaperSvg>
);

/** A country outline cut from paper (Natural Earth, simplified), `size` px along its longer side. */
export const MapOutline: React.FC<{ readonly country: keyof typeof OUTLINES; readonly size: number; readonly fill?: string; readonly seed?: number }> = ({
  country,
  size,
  fill = PAPER_COLORS.leaf.base,
  seed = 3160,
}) => {
  const o = OUTLINES[country];
  const pts = o.points.map(([x, y]) => [x * size, y * size] as [number, number]);
  return (
    <PaperSvg w={size + 60} h={size + 60}>
      <PaperShape d={paperPolygon(pts, { seed, wobble: 1 })} fill={fill} depth={1.4} shadowOpacity={S} />
    </PaperSvg>
  );
};

/** A stack of paper money: `layers` sheets, each `layerH` px, from the base up. */
export const MoneyStack: React.FC<{ readonly layers: number; readonly w?: number; readonly layerH?: number; readonly highlightFrom?: number }> = ({
  layers,
  w = 280,
  layerH = 18,
  highlightFrom = Infinity,
}) => (
  <PaperSvg w={w + 40} h={layers * layerH * 2 + 60}>
    {Array.from({ length: Math.max(0, Math.floor(layers)) }, (_, k) => (
      <PaperShape
        key={k}
        d={paperRect(-w / 2 + jitter(3170, k) * 6, -(k + 1) * layerH, w, layerH - 2, { seed: 3171 + k })}
        fill={k >= highlightFrom ? THEME.amber : k % 2 ? PAPER_COLORS.green.base : PAPER_COLORS.green.light}
        depth={0.7}
        shadowOpacity={S}
      />
    ))}
  </PaperSvg>
);

/** A paper globe. */
export const Globe: React.FC<{ readonly r?: number }> = ({ r = 120 }) => (
  <PaperSvg w={r * 2 + 40} h={r * 2 + 40}>
    <PaperShape d={paperCircle(0, 0, r, { seed: 3190 })} fill={PAPER_COLORS.sky.base} depth={1.4} shadowOpacity={S} />
    <PaperShape d={paperEllipse(-r * 0.3, -r * 0.2, r * 0.38, r * 0.28, { seed: 3191 })} fill={PAPER_COLORS.leaf.base} depth={0.5} shadowOpacity={S} />
    <PaperShape d={paperEllipse(r * 0.35, r * 0.25, r * 0.3, r * 0.4, { seed: 3192 })} fill={PAPER_COLORS.leaf.base} depth={0.5} shadowOpacity={S} />
  </PaperSvg>
);

/** A lever on a base; `pull` 0..1 pulls it down. */
export const Lever: React.FC<{ readonly pull: number }> = ({ pull }) => (
  <PaperSvg w={240} h={260}>
    <g transform={`rotate(${mix(-40, 40, pull)} 0 60)`}>
      <PaperShape d={paperRoundRect(-8, -70, 16, 130, 8, { seed: 3200 })} fill={THEME.slate} depth={1.2} shadowOpacity={S} />
      <PaperShape d={paperCircle(0, -78, 20, { seed: 3201 })} fill={COLORS.coral} depth={1.4} shadowOpacity={S} />
    </g>
    <PaperShape d={paperRoundRect(-60, 50, 120, 40, 12, { seed: 3202 })} fill={THEME.ink} depth={1.2} shadowOpacity={S} />
  </PaperSvg>
);

/** A brake pedal; `press` 0..1. */
export const BrakePedal: React.FC<{ readonly press: number }> = ({ press }) => (
  <PaperSvg w={260} h={300}>
    <g transform={`rotate(${mix(-25, 10, press)} 0 100)`}>
      <PaperShape d={paperRoundRect(-12, -40, 24, 140, 10, { seed: 3210 })} fill={THEME.slate} depth={1.2} shadowOpacity={S} />
      <PaperShape d={paperRoundRect(-70, -80, 140, 50, 14, { seed: 3211 })} fill={THEME.ink} depth={1.6} shadowOpacity={S} />
    </g>
  </PaperSvg>
);

/** A rope fence between two posts; `cut` 0..1 drops the two rope halves. */
export const RopeFence: React.FC<{ readonly cut: number; readonly h?: number }> = ({ cut, h = 360 }) => (
  <PaperSvg w={140} h={h + 80}>
    {[-1, 1].map((k) => (
      <PaperShape key={k} d={paperRect(-14, (k * h) / 2 - (k > 0 ? 60 : 0), 28, 60, { seed: 3220 + k })} fill={PAPER_COLORS.kraft.dark} depth={1.2} shadowOpacity={S} />
    ))}
    {cut <= 0 ? (
      <path d={`M 0 ${-h / 2 + 30} Q 26 0 0 ${h / 2 - 30}`} fill="none" stroke={COLORS.coral} strokeWidth={10} strokeLinecap="round" />
    ) : (
      <>
        <path d={`M 0 ${-h / 2 + 30} Q ${18 + cut * 30} ${-h / 6} ${cut * 40} ${-10 + cut * h * 0.25}`} fill="none" stroke={COLORS.coral} strokeWidth={10} strokeLinecap="round" />
        <path d={`M 0 ${h / 2 - 30} Q ${18 + cut * 30} ${h / 6} ${cut * 40} ${10 + cut * h * 0.15}`} fill="none" stroke={COLORS.coral} strokeWidth={10} strokeLinecap="round" />
      </>
    )}
  </PaperSvg>
);

/** A protest-style sign on a stick. */
export const Sign: React.FC<{ readonly text: string; readonly fill?: string; readonly seed?: number }> = ({ text, fill = COLORS.primary, seed = 3230 }) => (
  <>
    <PaperSvg w={40} h={240}>
      <PaperShape d={paperRect(-6, 0, 12, 110, { seed: seed + 1 })} fill={PAPER_COLORS.kraft.dark} depth={0.8} shadowOpacity={S} />
    </PaperSvg>
    <Label text={text} fontSize={40} strip={fill} seed={seed} />
  </>
);

/** A sun (or, with `moon`, a crescent-ish moon). */
export const SkyBody: React.FC<{ readonly moon?: boolean; readonly r?: number }> = ({ moon = false, r = 70 }) => (
  <PaperSvg w={r * 2 + 40} h={r * 2 + 40}>
    <PaperShape d={paperCircle(0, 0, r, { seed: moon ? 3241 : 3240 })} fill={moon ? PAPER_COLORS.sky.dark : PAPER_COLORS.rose.light} depth={1.2} shadowOpacity={S} />
    {moon ? <PaperShape d={paperCircle(r * 0.35, -r * 0.2, r * 0.75, { seed: 3242 })} fill={THEME.board} depth={0} /> : null}
  </PaperSvg>
);

/** A paper wallet. */
export const Wallet: React.FC = () => (
  <PaperSvg w={300} h={220}>
    <PaperShape d={paperRoundRect(-130, -80, 260, 160, 22, { seed: 3250 })} fill={PAPER_COLORS.kraft.dark} depth={1.4} shadowOpacity={S} />
    <PaperShape d={paperRoundRect(30, -24, 100, 48, 16, { seed: 3251 })} fill={PAPER_COLORS.kraft.base} depth={0.8} shadowOpacity={S} />
  </PaperSvg>
);

/** A little shop with an awning. */
export const Shop: React.FC = () => (
  <PaperSvg w={340} h={320}>
    <PaperShape d={paperRect(-130, -60, 260, 180, { seed: 3260 })} fill={PAPER_COLORS.sky.light} depth={1.2} shadowOpacity={S} />
    {Array.from({ length: 5 }, (_, k) => (
      <PaperShape key={k} d={paperRect(-150 + k * 60, -110, 60, 54, { seed: 3261 + k })} fill={k % 2 ? COLORS.primary : COLORS.coral} depth={1.4} shadowOpacity={S} />
    ))}
    <PaperShape d={paperRect(-40, 20, 80, 100, { seed: 3267 })} fill={THEME.ink} depth={0.5} shadowOpacity={S} />
  </PaperSvg>
);

/** A betting slip: cream paper, dashed tear line, two cut lines of text. */
export const BettingSlip: React.FC<{ readonly lines: readonly string[] }> = ({ lines }) => (
  <>
    <PaperSvg w={1000} h={360}>
      <PaperShape d={paperRect(-440, -140, 880, 280, { seed: 3270, torn: "ends" })} fill={COLORS.primary} depth={2} shadowOpacity={S} />
      <line x1={-400} x2={400} y1={-82} y2={-82} stroke={THEME.ink} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="12 10" />
    </PaperSvg>
    <Words text="BET SLIP" size={36} y={-108} depth={0} />
    {lines.map((l, i) => (
      <Words key={l} text={l} size={60} y={-10 + i * 78} depth={0.6} color={i === lines.length - 1 ? COLORS.coral : THEME.ink} />
    ))}
  </>
);

/** A card that flips over on its vertical axis at `at` (0 = face down, showing its back). */
export const FlipCard: React.FC<{
  readonly frame: number;
  readonly at: number;
  readonly w: number;
  readonly h: number;
  readonly number: string;
  readonly seed?: number;
  readonly children: React.ReactNode;
}> = ({ frame, at, w, h, number, seed = 3280, children }) => {
  const flip = ramp(onTwos(frame), at, 12, EASE.inOut);
  const sx = Math.max(Math.abs(Math.cos(Math.PI * flip)), 0.03);
  const front = flip >= 0.5;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, scale: `${sx} 1` }}>
      <PaperSvg w={w + 40} h={h + 40}>
        <PaperShape
          d={paperRoundRect(-w / 2, -h / 2, w, h, 26, { seed })}
          fill={front ? COLORS.primary : THEME.ink}
          depth={1.4 + Math.sin(Math.PI * flip) * 1.6}
          shadowOpacity={S}
        />
      </PaperSvg>
      {front ? (
        children
      ) : (
        <At x={0} y={0}>
          <Words text={number} size={140} color={THEME.amber} depth={0.8} />
        </At>
      )}
    </div>
  );
};

/** A label with a drawn paper arrow between two parts (Outfit has no "→" glyph). */
export const ArrowLabel: React.FC<{
  readonly left: string;
  readonly right: string;
  readonly fontSize?: number;
  readonly strip?: string;
  readonly ink?: string;
  readonly seed?: number;
}> = ({ left, right, fontSize = 44, strip = COLORS.primary, ink = THEME.ink, seed = 3290 }) => {
  const lw = left.length * fontSize * 0.58;
  const rw = right.length * fontSize * 0.58;
  const aw = fontSize * 1.2;
  const total = lw + aw + rw + fontSize;
  const h = fontSize * 1.55;
  return (
    <>
      <PaperSvg w={total + 60} h={h + 40}>
        <PaperShape d={paperRect(-total / 2 - 20, -h / 2, total + 40, h, { seed })} fill={strip} depth={1.2} shadowOpacity={S} />
        <PaperShape
          d={paperPolygon(
            [
              [-total / 2 + lw + fontSize * 0.2, -fontSize * 0.08],
              [-total / 2 + lw + aw * 0.75, -fontSize * 0.08],
              [-total / 2 + lw + aw * 0.75, -fontSize * 0.28],
              [-total / 2 + lw + aw + fontSize * 0.1, 0],
              [-total / 2 + lw + aw * 0.75, fontSize * 0.28],
              [-total / 2 + lw + aw * 0.75, fontSize * 0.08],
              [-total / 2 + lw + fontSize * 0.2, fontSize * 0.08],
            ],
            { seed: seed + 1, wobble: 0.6 },
          )}
          fill={ink}
          depth={0.3}
          shadowOpacity={S}
        />
      </PaperSvg>
      <Words text={left} size={fontSize} x={-total / 2 + lw / 2} depth={0.3} color={ink} />
      <Words text={right} size={fontSize} x={total / 2 - rw / 2} depth={0.3} color={ink} />
    </>
  );
};
