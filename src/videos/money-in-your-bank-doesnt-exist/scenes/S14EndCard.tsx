import type React from "react";
import { useCurrentFrame } from "remotion";
import { END_CARD_LAYOUT } from "../../../components/EndCard";
import { LOGO_PROPORTIONS } from "../../../components/LogoMark";
import { PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { paperPolygon, paperRoundRect } from "../../../components/paper/paperPath";
import { idleJitter } from "../../../lib/paper-motion";
import { enter, Label, Words } from "../parts/kit";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";

/**
 * Paper end card (20s): the paper logo and a "Subscribe" tab, and two navy
 * paper frames over END_CARD_LAYOUT's slots, where the YouTube end screen
 * elements go (video 01 on the left, a playlist on the right).
 */
const R = END_CARD_LAYOUT.subscribe.size / 2;
const GAP = LOGO_PROPORTIONS.gap * R;
const PULL = LOGO_PROPORTIONS.pull * R;
const SLICES = [
  { from: -90, dir: [1, -1], amber: true },
  { from: 0, dir: [1, 1], amber: false },
  { from: 90, dir: [-1, 1], amber: false },
  { from: 180, dir: [-1, -1], amber: false },
] as const;
const wedge = (fromDeg: number, seed: number) => {
  const pts: [number, number][] = [[0, 0]];
  for (let k = 0; k <= 8; k++) {
    const a = ((fromDeg + (k / 8) * 90) * Math.PI) / 180;
    pts.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  return paperPolygon(pts, { seed });
};
const WEDGES = SLICES.map((s, i) => wedge(s.from, 1800 + i));
const SLOT_LABELS = ["Watch next", "More from Sum of Parts"] as const;
/** The channel line, as on every end card. */
const TAGLINE = "One money question, answered with data.";
const TAGLINE_W = TAGLINE.length * 40 * 0.62;
const BORDER = 18;

export const S14EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { subscribe, slots } = END_CARD_LAYOUT;
  const logo = enter(frame, 4, { from: [-500, 0], dur: 16, seed: 1 });
  const tab = enter(frame, 14, { from: [0, -300], dur: 14, seed: 2, wobbleDeg: 3 });
  const lx = subscribe.x + R;
  const ly = subscribe.y + R;

  return (
    <SceneRoot>
      {logo.on
        ? SLICES.map((s, i) => {
            const pull = s.amber ? PULL : 0;
            return (
              <Piece
                key={i}
                x={lx + logo.dx + s.dir[0] * (GAP + pull / Math.SQRT2)}
                y={ly + logo.dy + s.dir[1] * (GAP + pull / Math.SQRT2)}
                rotate={logo.rotate + idleJitter(frame, 1810 + i)}
              >
                <PaperSvg w={2 * R + 30} h={2 * R + 30}>
                  <PaperShape d={WEDGES[i]} fill={s.amber ? THEME.amber : THEME.ink} depth={s.amber ? 2 : 1.2} shadowOpacity={THEME.shadow} />
                </PaperSvg>
              </Piece>
            );
          })
        : null}
      {tab.on ? (
        <>
          <Piece x={subscribe.x + 2 * R + 60 + 195 + tab.dx} y={ly - 36 + tab.dy} rotate={tab.rotate - 2}>
            <Label text="Subscribe" fontSize={64} strip={THEME.amber} depth={1.6 + tab.lift} seed={1820} />
          </Piece>
          <Piece x={subscribe.x + 2 * R + 60 + TAGLINE_W / 2 + tab.dx} y={ly + 64 + tab.dy}>
            <Words text={TAGLINE} size={40} weight={500} depth={0} color={THEME.ink} />
          </Piece>
        </>
      ) : null}

      {slots.map((slot, i) => {
        const e = enter(frame, 24 + i * 8, { from: [0, 700], dur: 16, seed: 1830 + i });
        if (!e.on) return null;
        return (
          <div key={i}>
            <Piece x={slot.x + slot.width / 2 + e.dx} y={slot.y + slot.height / 2 + e.dy} rotate={e.rotate * 0.4 + idleJitter(frame, 1840 + i, 0.2)}>
              <PaperSvg w={slot.width + 60} h={slot.height + 60}>
                <PaperShape
                  d={paperRoundRect(-slot.width / 2, -slot.height / 2, slot.width, slot.height, 18, { seed: 1850 + i })}
                  fill={THEME.ink}
                  depth={1.6 + e.lift}
                  shadowOpacity={THEME.shadow}
                />
                <PaperShape
                  d={paperRoundRect(-slot.width / 2 + BORDER, -slot.height / 2 + BORDER, slot.width - 2 * BORDER, slot.height - 2 * BORDER, 10, { seed: 1860 + i })}
                  fill={THEME.board}
                  depth={0}
                />
              </PaperSvg>
            </Piece>
            <Piece x={slot.x + slot.width / 2 + e.dx} y={slot.y - 46 + e.dy}>
              <Words text={SLOT_LABELS[i]} size={44} depth={0.4} color={THEME.ink} />
            </Piece>
          </div>
        );
      })}
    </SceneRoot>
  );
};
