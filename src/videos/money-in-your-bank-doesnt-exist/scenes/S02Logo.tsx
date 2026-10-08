import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { TYPE } from "../../../brand/tokens";
import { LOGO_PROPORTIONS } from "../../../components/LogoMark";
import { At, PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { PaperText } from "../../../components/paper/PaperText";
import { paperPolygon } from "../../../components/paper/paperPath";
import { mix } from "../../../lib/motion";
import { placed } from "../../../lib/paper-motion";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";

/**
 * Paper logo intro (3s, no voice). On the cream board the three plain slices
 * are navy paper (the inverse logo) and the fourth is amber: they slide in
 * from four sides, land, the amber slice lifts and pulls outward, then the
 * name slides in underneath.
 */
const R = 150;
const CENTRE = { x: 960, y: 450 } as const;
const GAP = LOGO_PROPORTIONS.gap * R;
const PULL = LOGO_PROPORTIONS.pull * R;

/** Quarter slices, clockwise from the top right (the amber one). Angles in degrees. */
const SLICES = [
  { from: -90, dir: [1, -1], enter: [0, -700], amber: true },
  { from: 0, dir: [1, 1], enter: [800, 0], amber: false },
  { from: 90, dir: [-1, 1], enter: [0, 700], amber: false },
  { from: 180, dir: [-1, -1], enter: [-800, 0], amber: false },
] as const;

const wedge = (fromDeg: number, seed: number) => {
  const pts: [number, number][] = [[0, 0]];
  for (let k = 0; k <= 8; k++) {
    const a = ((fromDeg + (k / 8) * 90) * Math.PI) / 180;
    pts.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  return paperPolygon(pts, { seed });
};
const WEDGES = SLICES.map((s, i) => wedge(s.from, 10 + i));

export const S02Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Slices land one after another (amber last), then it lifts, then the name.
  const order = [3, 0, 1, 2];
  const lift = placed(frame, Math.round(1.5 * fps), Math.round(0.5 * fps), { seed: 20, wobbleDeg: 2 });
  const name = placed(frame, Math.round(1.85 * fps), Math.round(0.55 * fps), { seed: 21, wobbleDeg: 1.5 });

  return (
    <SceneRoot>
      {SLICES.map((s, i) => {
        const p = placed(frame, Math.round((0.15 + order[i] * 0.18) * fps), Math.round(0.45 * fps), { seed: 30 + i });
        const pull = s.amber ? PULL * Math.min(lift.t, 1) : 0;
        const dx = s.dir[0] * (GAP + pull / Math.SQRT2);
        const dy = s.dir[1] * (GAP + pull / Math.SQRT2);
        return (
          <Piece
            key={i}
            x={CENTRE.x + dx + s.enter[0] * (1 - Math.min(p.t, 1))}
            y={CENTRE.y + dy + s.enter[1] * (1 - Math.min(p.t, 1))}
            rotate={p.rotate}
          >
            <PaperSvg w={2 * R + 40} h={2 * R + 40}>
              <PaperShape
                d={WEDGES[i]}
                fill={s.amber ? THEME.amber : THEME.ink}
                depth={1.2 + p.lift * 1.5 + (s.amber ? lift.t * 1.2 : 0)}
                shadowOpacity={THEME.shadow}
              />
            </PaperSvg>
          </Piece>
        );
      })}
      {name.t > 0 ? (
        <Piece x={CENTRE.x} y={mix(CENTRE.y + R + 300, CENTRE.y + R + 110, Math.min(name.t, 1.05))} rotate={name.rotate}>
          <At x={0} y={0}>
            <PaperText color={THEME.ink} fontSize={TYPE.h2} depth={1 + name.lift} shadowOpacity={THEME.shadow}>
              Sum of Parts
            </PaperText>
          </At>
        </Piece>
      ) : null}
    </SceneRoot>
  );
};
