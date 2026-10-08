import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, PAPER_COLORS } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { paperCircle, paperRect } from "../../../components/paper/paperPath";
import { onTwos } from "../../../lib/paper-motion";
import { EXAMPLES, LABELS } from "../data";
import { Bank, Banknote, Box, enter, FIGURE_COLORS, Figure, Label, track } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s03-textbook");

/** The old school textbook page. No amber in this scene: it's the old idea. */
export const PAGE = { x: 960, y: 560, w: 1700, h: 860 } as const;
const PAGE_PATH = paperRect(-PAGE.w / 2, -PAGE.h / 2, PAGE.w, PAGE.h, { seed: 300 });
const TAB_PATH = paperRect(-210, -36, 420, 72, { seed: 301 });

/** Row of cut-outs across the page: figure, bank, figure, bank... (x positions). */
const X = { fig1: 230, bankA: 470, fig2: 720, bankB: 960, fig3: 1200, bankC: 1440, fig4: 1680 } as const;
const BANK_Y = 540;
const FIG_Y = 620;
const VAULT_Y = 820;
const HAND_Y = 640;

/** The textbook page itself (shared with Scene 04, which rips it). */
export const TextbookPage: React.FC<{ readonly dx?: number; readonly dy?: number; readonly rotate?: number; readonly lift?: number }> = ({
  dx = 0,
  dy = 0,
  rotate = 0,
  lift = 0,
}) => (
  <Piece x={PAGE.x + dx} y={PAGE.y + dy} rotate={rotate}>
    <PaperSvg w={PAGE.w + 60} h={PAGE.h + 60}>
      <PaperShape d={PAGE_PATH} fill={PAPER_COLORS.kraft.light} depth={1 + lift} shadowOpacity={THEME.shadow} />
      {Array.from({ length: 12 }, (_, k) => (
        <line
          key={k}
          x1={-PAGE.w / 2 + 40}
          x2={PAGE.w / 2 - 40}
          y1={-PAGE.h / 2 + 110 + k * 64}
          y2={-PAGE.h / 2 + 110 + k * 64}
          stroke={PAPER_COLORS.sky.dark}
          strokeOpacity={0.18}
          strokeWidth={2}
        />
      ))}
      <line x1={-PAGE.w / 2 + 120} x2={-PAGE.w / 2 + 120} y1={-PAGE.h / 2} y2={PAGE.h / 2} stroke={COLORS.coral} strokeOpacity={0.3} strokeWidth={2} />
    </PaperSvg>
    <Piece x={-PAGE.w / 2 + 300} y={-PAGE.h / 2 - 10} rotate={-1}>
      <PaperSvg w={460} h={110}>
        <PaperShape d={TAB_PATH} fill={PAPER_COLORS.sky.light} depth={0.8} shadowOpacity={THEME.shadow} />
      </PaperSvg>
      <Label text="The textbook version" fontSize={38} strip={PAPER_COLORS.sky.light} depth={0} />
    </Piece>
  </Piece>
);

export const S03Textbook: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    deposit: T.cue("deposit"),
    vault: T.cue("vault"),
    lends: T.cue("lends"),
    savingsLoan: T.cue("savingsLoan"),
    anotherBank: T.cue("anotherBank"),
    multiplier: T.cue("multiplier"),
  };

  const page = enter(frame, T.anchor, { from: [0, 900], dur: 16, seed: 1 });
  const bankA = enter(frame, T.anchor + 30, { from: [0, -700], dur: 14, seed: 2 });
  const vaultA = enter(frame, cue.vault, { from: [0, 500], dur: 12, seed: 3 });
  const fig2 = enter(frame, cue.lends, { from: [0, 600], dur: 12, seed: 4 });
  const bankB = enter(frame, cue.anotherBank, { from: [0, -700], dur: 14, seed: 5 });
  const vaultB = enter(frame, cue.anotherBank + 30, { from: [0, 500], dur: 12, seed: 6 });
  const fig3 = enter(frame, cue.anotherBank + 40, { from: [0, 600], dur: 12, seed: 7 });
  const bankC = enter(frame, cue.anotherBank + 70, { from: [0, -700], dur: 14, seed: 8 });
  const fig4 = enter(frame, cue.anotherBank + 100, { from: [0, 600], dur: 12, seed: 9 });
  const label = enter(frame, cue.multiplier, { from: [0, -400], dur: 14, seed: 10, wobbleDeg: 4 });

  // Figure 1 walks in from the left on "You deposit", bobbing on twos.
  const walk = track(frame, [
    [0, -300, FIG_Y],
    [cue.deposit + 26, X.fig1, FIG_Y],
  ], 26);
  const bob = walk.moving > 0 ? Math.abs(Math.sin(f2 * 0.6)) * -14 : 0;

  // Banknotes: five arrive with figure 1 and go into bank A; one to the vault, the rest
  // lent to figure 2, then on through bank B (one kept) to figure 3, bank C and figure 4.
  const at = (x: number, y: number, k: number) => [x + k * 6, y - k * 10] as const;
  const noteKeys = (k: number): (readonly [number, number, number])[] => {
    const keys: [number, number, number][] = [
      [0, walk.x + 70 + k * 6, HAND_Y - k * 10],
      [cue.deposit + 50 + k * 3, ...at(X.bankA, BANK_Y + 40, k)],
    ];
    if (k === 0) {
      keys.push([cue.vault + 10, X.bankA, VAULT_Y - 20]);
      return keys;
    }
    keys.push([cue.lends + 16 + k * 3, ...at(X.fig2 + 70, HAND_Y, k)]);
    keys.push([cue.anotherBank + 18 + k * 3, ...at(X.bankB, BANK_Y + 40, k)]);
    if (k === 1) {
      keys.push([cue.anotherBank + 50, X.bankB, VAULT_Y - 20]);
      return keys;
    }
    keys.push([cue.anotherBank + 60 + k * 3, ...at(X.fig3 + 70, HAND_Y, k)]);
    keys.push([cue.anotherBank + 96 + k * 3, ...at(X.bankC, BANK_Y + 40, k)]);
    if (k === 2) return keys;
    keys.push([cue.anotherBank + 130 + k * 3, ...at(X.fig4 + 70, HAND_Y, k)]);
    return keys;
  };

  return (
    <SceneRoot>
      {page.on ? <TextbookPage dx={page.dx} dy={page.dy} rotate={page.rotate} lift={page.lift} /> : null}

      {/* Banks and their vault boxes */}
      {[
        { e: bankA, x: X.bankA, seed: 310, v: vaultA },
        { e: bankB, x: X.bankB, seed: 320, v: vaultB },
        { e: bankC, x: X.bankC, seed: 330, v: null },
      ].map(({ e, x, seed, v }) =>
        e.on ? (
          <div key={seed}>
            <Piece x={x + e.dx} y={BANK_Y + e.dy} rotate={e.rotate} scale={0.78}>
              <Bank seed={seed} roof={PAPER_COLORS.sky.dark} />
            </Piece>
            {v?.on ? (
              <Piece x={x + v.dx} y={VAULT_Y + v.dy} rotate={v.rotate} scale={0.5}>
                <Box fill={THEME.slate} open={0.6} />
              </Piece>
            ) : null}
          </div>
        ) : null,
      )}

      {/* Figures */}
      <Piece x={walk.x} y={walk.y + bob}>
        <Figure body={FIGURE_COLORS[0]} seed={340} size={0.78} reach={0.4} />
      </Piece>
      {[
        { e: fig2, x: X.fig2, c: FIGURE_COLORS[1], seed: 350 },
        { e: fig3, x: X.fig3, c: FIGURE_COLORS[2], seed: 360 },
        { e: fig4, x: X.fig4, c: FIGURE_COLORS[3], seed: 370 },
      ].map(({ e, x, c, seed }) =>
        e.on ? (
          <Piece key={seed} x={x + e.dx} y={FIG_Y + e.dy} rotate={e.rotate}>
            <Figure body={c} seed={seed} size={0.78} reach={0.4} />
          </Piece>
        ) : null,
      )}

      {/* The $1,000 as five banknotes */}
      {Array.from({ length: EXAMPLES.textbookNotes }, (_, k) => {
        const p = track(frame, noteKeys(k));
        return frame >= cue.deposit ? (
          <Piece key={k} x={p.x} y={p.y} rotate={-6 + k * 3} scale={0.66}>
            <Banknote seed={380 + k * 10} depth={1 + p.moving * 1.6} />
          </Piece>
        ) : null;
      })}
      {frame >= cue.deposit && frame < cue.deposit + 60 ? (
        <Piece x={X.fig1 + 80} y={HAND_Y - 150} rotate={-3}>
          <Label text={LABELS.textbookDeposit} fontSize={40} strip={COLORS.primary} seed={390} />
        </Piece>
      ) : null}

      {/* "Your savings become their loan" */}
      {(() => {
        const e = enter(frame, cue.savingsLoan, { from: [0, -200], dur: 10, seed: 11, wobbleDeg: 5 });
        return e.on && frame < cue.anotherBank ? (
          <Piece x={X.fig2 + 80 + e.dx} y={HAND_Y - 130 + e.dy} rotate={e.rotate + 4}>
            <Label text="Loan" fontSize={40} strip={COLORS.primary} seed={391} />
          </Piece>
        ) : null;
      })()}

      {/* "the money multiplier": a label pinned at the top of the page */}
      {label.on ? (
        <Piece x={960 + label.dx} y={210 + label.dy} rotate={label.rotate - 2}>
          <Label text="The money multiplier" fontSize={56} strip={COLORS.primary} depth={1.4 + label.lift} seed={392} />
          <PaperSvg w={40} h={40}>
            <PaperShape d={paperCircle(0, -44, 12, { seed: 393 })} fill={COLORS.coral} depth={0.8} shadowOpacity={THEME.shadow} />
          </PaperSvg>
        </Piece>
      ) : null}
    </SceneRoot>
  );
};
