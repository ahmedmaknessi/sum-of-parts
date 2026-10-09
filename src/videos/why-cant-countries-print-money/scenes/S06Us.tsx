import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { enter, Label, leave, SourceLine, Words } from "../../../components/paper/kit";
import { Piece } from "../../../components/paper/Piece";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { FACTS, LABELS, SOURCES } from "../data";
import { MapOutline, MoneyStack, Thermometer } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s06-us");

const MAP = { x: 520, y: 500, size: 700 } as const;
const STACK = { x: 1340, y: 900, layerH: 26, w: 340 } as const;
/** One paper layer per trillion dollars of M2. */
const LAYERS_BEFORE = Math.round(FACTS.m2.feb2020 / 1e12);
const LAYERS_AFTER = Math.round(FACTS.m2.mar2022 / 1e12);
/** Thermometer level per percent of inflation (9.1% sits near the top). */
const THERM_PER_PCT = 0.09;

export const S06Us: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    feb2020: T.cue("feb2020"),
    twoYears: T.cue("twoYears"),
    twentyTwo: T.cue("twentyTwo"),
    forty: T.cue("forty"),
    whyNot: T.cue("whyNot"),
    inflationCame: T.cue("inflationCame"),
    june2022: T.cue("june2022"),
    biggestJump: T.cue("biggestJump"),
    hurt: T.cue("hurt"),
    notHyper: T.cue("notHyper"),
  };
  const idle = idleJitter(frame, 61);

  const map = enter(frame, T.anchor, { from: [-1000, 0], dur: 16, seed: 1 });
  // "why didn't America become Zimbabwe": the two maps side by side for a moment.
  const pair = ramp(f2, cue.whyNot, 16, EASE.inOut);
  const mapOut = leave(frame, cue.inflationCame, [-1200, 0], 16);
  const zim = enter(frame, cue.whyNot + 10, { from: [1000, 0], dur: 16, seed: 2 });

  const stack = enter(frame, cue.feb2020, { from: [0, 800], dur: 14, seed: 3 });
  const stackOut = leave(frame, cue.whyNot, [0, 1100], 16);
  const layers = mix(LAYERS_BEFORE, LAYERS_AFTER, ramp(f2, cue.twentyTwo, 30, EASE.inOut));
  const after = f2 >= cue.twentyTwo + 8;
  const dateTag = enter(frame, cue.feb2020 + 6, { from: [0, -400], dur: 12, seed: 4, wobbleDeg: 5 });
  const dateFlip = ramp(f2, cue.twoYears, 8, EASE.inOut);
  const ribbon = enter(frame, cue.forty, { from: [600, 0], dur: 12, seed: 5, wobbleDeg: 4 });
  const stackTop = STACK.y - layers * STACK.layerH;

  // Thermometer: 9.1% (June 2022), then Zimbabwe's peak shoots off the top.
  const therm = enter(frame, cue.inflationCame + 6, { from: [0, 900], dur: 14, seed: 6 });
  const rise = ramp(f2, cue.june2022, 30, EASE.inOut);
  const shake = f2 >= cue.hurt && f2 < cue.hurt + 16 ? Math.sin(f2 * 1.6) * 3 : 0;
  const cpi = enter(frame, cue.june2022 + 16, { from: [0, -500], dur: 12, seed: 7, wobbleDeg: 3 });
  const note = enter(frame, cue.biggestJump, { from: [0, 400], dur: 12, seed: 8 });
  const hyper = enter(frame, cue.notHyper, { from: [700, 0], dur: 12, seed: 9 });
  const hyperRise = ramp(f2, cue.notHyper + 10, 40, EASE.inOut);

  return (
    <SceneRoot>
      {map.on && !mapOut.gone ? (
        <Piece x={mix(MAP.x, 600, pair) + map.dx + mapOut.dx} y={MAP.y + map.dy} rotate={map.rotate + idle} scale={mix(1, 0.75, pair)}>
          <MapOutline country="usa" size={MAP.size} fill={PAPER_COLORS.sky.base} seed={6001} />
          <Piece x={0} y={MAP.size * 0.36} rotate={-2}>
            <Label text="United States" fontSize={48} strip={COLORS.primary} seed={6002} />
          </Piece>
        </Piece>
      ) : null}
      {zim.on && !mapOut.gone ? (
        <Piece x={1400 + zim.dx + mapOut.dx} y={500 + zim.dy} rotate={zim.rotate}>
          <MapOutline country="zimbabwe" size={400} fill={PAPER_COLORS.leaf.base} seed={5001} />
          <Piece x={0} y={250} rotate={2}>
            <Label text="Zimbabwe" fontSize={48} strip={COLORS.primary} seed={6003} />
          </Piece>
        </Piece>
      ) : null}

      {stack.on && !stackOut.gone ? (
        <Piece x={STACK.x + stack.dx} y={stack.dy + stackOut.dy}>
          <Piece x={0} y={STACK.y} rotate={stack.rotate}>
            <MoneyStack layers={layers} w={STACK.w} layerH={STACK.layerH} />
          </Piece>
          <Piece x={-STACK.w / 2 - 150} y={stackTop + 10} rotate={-2}>
            <Label text={after ? LABELS.m2After : LABELS.m2Before} fontSize={56} strip={COLORS.primary} seed={6010} />
          </Piece>
          {dateTag.on ? (
            <Piece x={-STACK.w / 2 - 150 + dateTag.dx} y={stackTop + 100 + dateTag.dy} rotate={3 + dateTag.rotate} scaleY={Math.max(0.05, Math.abs(Math.cos(Math.PI * dateFlip)))}>
              <Label text={dateFlip >= 0.5 ? LABELS.m2AfterWhen : LABELS.m2BeforeWhen} fontSize={40} strip={PAPER_COLORS.kraft.light} seed={6011} />
            </Piece>
          ) : null}
          {ribbon.on ? (
            <Piece x={STACK.w / 2 + 145 + ribbon.dx} y={STACK.y - ((LAYERS_BEFORE + LAYERS_AFTER) / 2) * STACK.layerH + ribbon.dy} rotate={-4 + ribbon.rotate}>
              <Label text={LABELS.m2Growth} fontSize={60} strip={THEME.amber} depth={1.8 + ribbon.lift} seed={6012} torn />
            </Piece>
          ) : null}
        </Piece>
      ) : null}
      <SourceLine text={SOURCES.h6} frame={frame} at={cue.forty + 8} until={cue.whyNot} />

      {therm.on ? (
        <Piece x={720 + therm.dx + shake} y={540 + therm.dy} rotate={therm.rotate}>
          <Thermometer level={mix(0.12, 9.1 * THERM_PER_PCT, rise)} />
        </Piece>
      ) : null}
      {cpi.on ? (
        <Piece x={1260 + cpi.dx} y={420 + cpi.dy} rotate={cpi.rotate}>
          <Words text={LABELS.cpi} size={170} color={COLORS.coral} depth={1.6 + cpi.lift} />
        </Piece>
      ) : null}
      {note.on ? (
        <Piece x={1260 + note.dx} y={600 + note.dy} rotate={note.rotate + 1}>
          <Label text={LABELS.cpiNote} fontSize={44} strip={PAPER_COLORS.kraft.light} seed={6020} />
        </Piece>
      ) : null}
      {hyper.on ? (
        <Piece x={1660 + hyper.dx} y={560 + hyper.dy} rotate={hyper.rotate}>
          <Piece x={0} y={-hyperRise * 620}>
            <Thermometer level={1} fill={PAPER_COLORS.leaf.dark} />
          </Piece>
          <Piece x={-60} y={330} rotate={-3}>
            <Label text={LABELS.peak} fontSize={40} strip={PAPER_COLORS.leaf.light} seed={6030} />
          </Piece>
        </Piece>
      ) : null}
      <SourceLine text={SOURCES.bls} frame={frame} at={cue.june2022 + 16} until={cue.notHyper} />
    </SceneRoot>
  );
};
