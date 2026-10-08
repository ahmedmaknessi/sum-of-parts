import type React from "react";
import { COLORS, FONT, TEXT_OPACITY } from "../../brand/tokens";
import { Background } from "../../components";
import { formatUSD } from "../../lib/finance";
import { ASSUMPTIONS, DATA, LABELS } from "./data";

/**
 * Three 1280x720 thumbnails for YouTube's "Test & compare". All brand colors
 * and fonts, louder than the video itself: amber is the payoff, coral the
 * warning. The bottom-right corner stays clear for YouTube's duration badge.
 */
const W = 1280;
const H = 720;
const PAD = 48;

type Box = { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number };

/** Monthly balances as SVG points in a box, scaled so `max` reaches the top. Months before `from` are skipped. */
const curve = (values: readonly number[], box: Box, max: number, from = 0) =>
  values
    .map((v, month) => {
      const t = month / (values.length - 1);
      return [box.left + t * (box.right - box.left), box.bottom - (v / max) * (box.bottom - box.top)] as const;
    })
    .slice(from);

const toPoints = (pts: readonly (readonly [number, number])[]) =>
  pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** A filled arrowhead at the end of a polyline, pointing along its last segment. */
const arrowHead = (pts: readonly (readonly [number, number])[], size: number) => {
  const [x1, y1] = pts[pts.length - 1];
  const [x0, y0] = pts[pts.length - 6];
  const a = Math.atan2(y1 - y0, x1 - x0);
  const tip = [x1 + Math.cos(a) * size * 0.6, y1 + Math.sin(a) * size * 0.6];
  const back = (side: number) => [
    x1 - Math.cos(a) * size * 0.4 + Math.cos(a + (side * Math.PI) / 2) * size * 0.55,
    y1 - Math.sin(a) * size * 0.4 + Math.sin(a + (side * Math.PI) / 2) * size * 0.55,
  ];
  return [tip, back(1), back(-1)].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
};

const heading: React.CSSProperties = {
  position: "absolute",
  fontWeight: FONT.weight.heading,
  lineHeight: 1,
  letterSpacing: "-0.02em",
  color: COLORS.primary,
};

// ---------------------------------------------------------------------------
// A: "Not a typo". $100/mo shoots up the real 7% curve to $262,481.
// ---------------------------------------------------------------------------

const A_CURVE: Box = { left: 450, right: 1180, top: 110, bottom: 612 };
const A_POINTS = curve(DATA.curves.invested, A_CURVE, DATA.final.invested);

export const Thumbnail01A: React.FC = () => (
  <Background>
    <div style={{ ...heading, left: PAD - 6, top: 56, fontSize: 210, color: COLORS.accent }}>{LABELS.final}</div>
    <div
      style={{
        ...heading,
        left: PAD + 8,
        top: 300,
        fontSize: 64,
        letterSpacing: "0.01em",
        padding: "14px 28px 12px",
        borderRadius: 14,
        backgroundColor: COLORS.coral,
        color: COLORS.background,
        rotate: "-3deg",
      }}
    >
      NOT A TYPO
    </div>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <polyline
        points={toPoints(A_POINTS)}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={18}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points={arrowHead(A_POINTS, 70)} fill={COLORS.accent} />
    </svg>
    <div style={{ ...heading, left: PAD, top: 570, fontSize: 96 }}>
      {LABELS.deposit}
      <span style={{ fontSize: 56, opacity: TEXT_OPACITY.secondary }}>/mo</span>
    </div>
    <div
      style={{
        ...heading,
        left: A_CURVE.left + 40,
        top: 520,
        fontSize: 44,
        fontWeight: FONT.weight.body,
        opacity: TEXT_OPACITY.secondary,
      }}
    >
      {LABELS.years} years
    </div>
  </Background>
);

// ---------------------------------------------------------------------------
// B: "Who paid the other $214,481?" Your $48K is a sliver of one tall bar.
// ---------------------------------------------------------------------------

const B_BAR = { left: 110, width: 290, top: 64, bottom: 656, gap: 6 } as const;
const B_YOU_HEIGHT = (DATA.totalDeposited / DATA.final.invested) * (B_BAR.bottom - B_BAR.top);
const B_YOU_TOP = B_BAR.bottom - B_YOU_HEIGHT;

export const Thumbnail01B: React.FC = () => (
  <Background>
    {/* Growth: everything above your deposits */}
    <div
      style={{
        position: "absolute",
        left: B_BAR.left,
        width: B_BAR.width,
        top: B_BAR.top,
        height: B_YOU_TOP - B_BAR.gap - B_BAR.top,
        borderRadius: "16px 16px 0 0",
        backgroundColor: COLORS.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 280,
        fontWeight: FONT.weight.heading,
        lineHeight: 1,
        color: COLORS.background,
      }}
    >
      ?
    </div>
    {/* Your deposits */}
    <div
      style={{
        position: "absolute",
        left: B_BAR.left,
        width: B_BAR.width,
        top: B_YOU_TOP,
        height: B_YOU_HEIGHT,
        backgroundColor: COLORS.primary,
      }}
    />
    <div style={{ ...heading, left: B_BAR.left + B_BAR.width + 28, top: B_YOU_TOP + B_YOU_HEIGHT / 2 - 26, fontSize: 52 }}>
      You: {LABELS.totalDepositedK}
    </div>

    <div style={{ ...heading, left: 520, top: 92, fontSize: 104 }}>WHO PAID</div>
    <div style={{ ...heading, left: 520, top: 206, fontSize: 104 }}>THE OTHER</div>
    <div style={{ ...heading, left: 512, top: 330, fontSize: 148, color: COLORS.accent }}>{LABELS.growth}?</div>
  </Background>
);

// ---------------------------------------------------------------------------
// C: "Waiting 10 years costs $140,484". Start at 25 vs start at 35.
// ---------------------------------------------------------------------------

/** Leaves room right of the curve ends for their values. */
const C_CURVE: Box = { left: 72, right: 1060, top: 310, bottom: 636 };
const C_EARLY = curve(DATA.curves.invested, C_CURVE, DATA.final.invested);
const C_LATE = curve(DATA.curves.lateStart, C_CURVE, DATA.final.invested, ASSUMPTIONS.lateStartYears * 12);

export const Thumbnail01C: React.FC = () => (
  <Background>
    <div style={{ ...heading, left: PAD, top: 52, fontSize: 92 }}>WAITING {LABELS.lateStartYears} YEARS</div>
    <div style={{ ...heading, left: PAD, top: 160, fontSize: 120 }}>
      COSTS <span style={{ color: COLORS.coral }}>{LABELS.lateGap}</span>
    </div>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <line
        x1={C_CURVE.left}
        x2={C_CURVE.right}
        y1={C_CURVE.bottom}
        y2={C_CURVE.bottom}
        stroke={COLORS.mutedStrong}
        strokeWidth={4}
      />
      <polyline points={toPoints(C_LATE)} fill="none" stroke={COLORS.coral} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={toPoints(C_EARLY)} fill="none" stroke={COLORS.accent} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      {[C_EARLY, C_LATE].map((pts, i) => {
        const [x, y] = pts[pts.length - 1];
        return <circle key={i} cx={x} cy={y} r={16} fill={i === 0 ? COLORS.accent : COLORS.coral} />;
      })}
    </svg>
    {/* End values, right of each curve's end */}
    <div style={{ ...heading, left: C_CURVE.right + 32, top: C_EARLY[C_EARLY.length - 1][1] - 28, fontSize: 58, color: COLORS.accent }}>
      {formatUSD(DATA.final.invested, { compact: true })}
    </div>
    <div style={{ ...heading, left: C_CURVE.right + 32, top: C_LATE[C_LATE.length - 1][1] - 28, fontSize: 58, color: COLORS.coral }}>
      {formatUSD(DATA.late.balance, { compact: true })}
    </div>
    {/* Who's who, at the start of each curve */}
    <div style={{ ...heading, left: C_CURVE.left, top: C_CURVE.bottom - 76, fontSize: 44, color: COLORS.accent }}>
      Start at {LABELS.startAge}
    </div>
    <div style={{ ...heading, left: C_LATE[0][0] + 10, top: C_CURVE.bottom + 18, fontSize: 44, color: COLORS.coral }}>
      Start at {LABELS.lateStartAge}
    </div>
  </Background>
);
