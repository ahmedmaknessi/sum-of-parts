import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, FONT, PAPER_COLORS, TEXT_OPACITY } from "../../../brand/tokens";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { PaperText } from "../../../components/paper/PaperText";
import { paperCircle, paperRect, paperRoundRect } from "../../../components/paper/paperPath";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { Banknote, CrossStrip, enter, Label, leave, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";
import { BalanceCard } from "./S09Iou";

const T = sceneTiming("s13-takeaway");

const CARD = { x: 960, y: 360, scale: 1.3 } as const;
const PILLARS = [
  { x: 700, label: "Rules" },
  { x: 960, label: "Insurance" },
  { x: 1220, label: "Trust" },
] as const;
const PILLAR = { top: 520, bottom: 940, w: 230 } as const;
const PRESS = { x: 1400, y: 600 } as const;

/** A small vault door (as in Scene 01). */
const Vault: React.FC = () => (
  <PaperSvg w={340} h={340}>
    <PaperShape d={paperCircle(0, 0, 150, { seed: 1700 })} fill={THEME.slate} depth={1.4} shadowOpacity={THEME.shadow} />
    <PaperShape d={paperCircle(0, 0, 112, { seed: 1701 })} fill={COLORS.muted} depth={0.6} shadowOpacity={THEME.shadow} />
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a + 15})`}>
        <PaperShape d={paperRect(-9, -76, 18, 152, { seed: 1702 })} fill={COLORS.primary} depth={0.8} shadowOpacity={THEME.shadow} />
      </g>
    ))}
    <PaperShape d={paperCircle(0, 0, 28, { seed: 1703 })} fill={PAPER_COLORS.kraft.base} depth={1} shadowOpacity={THEME.shadow} />
  </PaperSvg>
);

export const S13Takeaway: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    notCash: T.cue("notCash"),
    notVault: T.cue("notVault"),
    promise: T.cue("promise"),
    rules: T.cue("rules"),
    insurance: T.cue("insurance"),
    trust: T.cue("trust"),
    notPanic: T.cue("notPanic"),
    education: T.cue("education"),
    ifBanks: T.cue("ifBanks"),
    printWhy: T.cue("printWhy"),
    nextVideo: T.cue("nextVideo"),
    seeYou: T.cue("seeYou"),
  };

  const card = enter(frame, T.anchor, { from: [0, -800], dur: 16, seed: 1, wobbleDeg: 3 });
  const note = enter(frame, cue.notCash, { from: [-700, 0], dur: 12, seed: 2 });
  const vault = enter(frame, cue.notVault, { from: [700, 0], dur: 12, seed: 3 });
  const crossNote = enter(frame, cue.notCash + 14, { from: [0, -200], dur: 6, seed: 4 });
  const crossVault = enter(frame, cue.notVault + 14, { from: [0, -200], dur: 6, seed: 5 });
  const clearSides = leave(frame, cue.promise, [0, 900], 16);
  const promise = enter(frame, cue.promise, { from: [0, -500], dur: 12, seed: 6, wobbleDeg: 3 });
  const pillarAt = [cue.rules, cue.insurance, cue.trust] as const;
  // "if banks can create money": the little temple steps aside for the next question.
  const aside = ramp(f2, cue.ifBanks, 22, EASE.inOut);
  const press = enter(frame, cue.printWhy, { from: [900, 0], dur: 16, seed: 7 });
  const question = enter(frame, cue.printWhy + 30, { from: [0, -600], dur: 10, seed: 8, wobbleDeg: 5 });
  const next = enter(frame, cue.printWhy + 10, { from: [0, -250], dur: 14, seed: 9 });
  const nextPulse =
    1 + 0.05 * Math.sin(Math.PI * ramp(f2, cue.nextVideo, 10, EASE.inOut)) + 0.04 * Math.sin(Math.PI * ramp(f2, cue.seeYou, 10, EASE.inOut));
  // "That's not a reason to panic": the little temple settles with a gentle nod.
  const calm = Math.sin(Math.PI * ramp(f2, cue.notPanic, 16, EASE.inOut)) * 1.5;
  const idle = idleJitter(frame, 1710);

  return (
    <SceneRoot>
      <div style={{ position: "absolute", inset: 0, scale: mix(1, 0.8, aside), translate: `${-420 * aside}px ${50 * aside}px`, transformOrigin: "960px 540px" }}>
        {PILLARS.map((p, i) => {
          const rise = ramp(f2, pillarAt[i], 14, EASE.settle);
          if (rise <= 0) return null;
          const h = PILLAR.bottom - PILLAR.top;
          return (
            <Piece key={p.label} x={p.x} y={mix(PILLAR.bottom + h / 2 + 40, (PILLAR.top + PILLAR.bottom) / 2, rise)} rotate={idle * (i - 1)}>
              <PaperSvg w={PILLAR.w + 80} h={h + 80}>
                <PaperShape d={paperRect(-PILLAR.w / 2 - 20, -h / 2, PILLAR.w + 40, 40, { seed: 1720 + i })} fill={THEME.ink} depth={1.4} shadowOpacity={THEME.shadow} />
                <PaperShape d={paperRect(-PILLAR.w / 2 + 14, -h / 2 + 40, PILLAR.w - 28, h - 80, { seed: 1730 + i })} fill={PAPER_COLORS.kraft.light} depth={1.2} shadowOpacity={THEME.shadow} />
                <PaperShape d={paperRect(-PILLAR.w / 2 - 20, h / 2 - 40, PILLAR.w + 40, 40, { seed: 1740 + i })} fill={THEME.ink} depth={1.4} shadowOpacity={THEME.shadow} />
              </PaperSvg>
              <Words text={p.label} size={48} y={0} depth={0.5} />
            </Piece>
          );
        })}
        {card.on ? (
          <Piece x={CARD.x + card.dx} y={CARD.y + card.dy} rotate={card.rotate + idle + calm} scale={CARD.scale}>
            <BalanceCard frame={frame + 1000} />
            {promise.on ? (
              <Piece x={promise.dx * 0.5} y={70 + promise.dy} rotate={promise.rotate - 3} scale={0.55}>
                <Label text="Promise" fontSize={110} strip={THEME.ink} ink={THEME.amber} depth={1.8 + promise.lift} seed={1750} torn />
              </Piece>
            ) : null}
          </Piece>
        ) : null}
      </div>

      {/* "Not as cash. Not as a pile in a vault." */}
      {!clearSides.gone ? (
        <>
          {note.on ? (
            <Piece x={440 + note.dx} y={400 + note.dy + clearSides.dy} rotate={note.rotate - 4} scale={1.4}>
              <Banknote seed={1760} />
              {crossNote.on ? (
                <Piece x={0} y={crossNote.dy * 0.3} rotate={-20}>
                  <CrossStrip w={300} fill={COLORS.coral} seed={1761} />
                </Piece>
              ) : null}
            </Piece>
          ) : null}
          {vault.on ? (
            <Piece x={1490 + vault.dx} y={400 + vault.dy + clearSides.dy} rotate={vault.rotate}>
              <Vault />
              {crossVault.on ? (
                <Piece x={0} y={crossVault.dy * 0.3} rotate={-22}>
                  <CrossStrip w={380} fill={COLORS.coral} seed={1762} />
                </Piece>
              ) : null}
            </Piece>
          ) : null}
        </>
      ) : null}

      {/* The next question: a paper printing press with banknotes and a question mark */}
      {press.on ? (
        <Piece x={PRESS.x + press.dx} y={PRESS.y + press.dy} rotate={press.rotate}>
          <PaperSvg w={520} h={460}>
            <PaperShape d={paperRoundRect(-200, -130, 400, 260, 26, { seed: 1770 })} fill={THEME.slate} depth={1.4} shadowOpacity={THEME.shadow} />
            {[-1, 1].map((s) => (
              <g key={s} transform={`translate(${s * 90} -40) rotate(${f2 * 6 * s})`}>
                <PaperShape d={paperCircle(0, 0, 50, { seed: 1771 + s })} fill={THEME.ink} depth={1} shadowOpacity={THEME.shadow} />
                <PaperShape d={paperRect(-6, -40, 12, 80, { seed: 1773 })} fill={THEME.slate} depth={0.3} shadowOpacity={THEME.shadow} />
              </g>
            ))}
            <PaperShape d={paperRect(-170, 70, 340, 26, { seed: 1774 })} fill={THEME.ink} depth={0.8} shadowOpacity={THEME.shadow} />
          </PaperSvg>
          {Array.from({ length: 4 }, (_, k) => {
            const out = ramp(f2, cue.printWhy + 20 + k * 12, 18, EASE.out);
            return out > 0 ? (
              <Piece key={k} x={-40 + out * 120 + k * 6} y={170 + out * 40 - k * 14} rotate={-6 + k * 4} scale={0.8}>
                <Banknote seed={1780 + k * 10} />
              </Piece>
            ) : null;
          })}
          {question.on ? (
            <Piece x={question.dx} y={-330 + question.dy} rotate={question.rotate}>
              <PaperText color={THEME.ink} fontSize={200} depth={1.6 + question.lift} shadowOpacity={THEME.shadow}>
                ?
              </PaperText>
            </Piece>
          ) : null}
        </Piece>
      ) : null}
      {next.on ? (
        <Piece x={960 + next.dx} y={150 + next.dy} rotate={next.rotate - 1} scale={nextPulse}>
          <Label text="Next: Why can't countries just print money?" fontSize={52} strip={THEME.amber} depth={1.6 + next.lift} seed={1790} />
        </Piece>
      ) : null}

      {/* A small flat note: education, not financial advice */}
      {frame >= cue.education ? (
        <div
          style={{
            position: "absolute",
            right: 128,
            bottom: 96,
            fontFamily: FONT.family,
            fontSize: 36,
            fontWeight: FONT.weight.body,
            color: THEME.ink,
            opacity: TEXT_OPACITY.secondary * ramp(f2, cue.education, 8),
          }}
        >
          Education, not financial advice
        </div>
      ) : null}
    </SceneRoot>
  );
};
