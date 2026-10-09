import type React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, EASE, PAPER_COLORS } from "../../../brand/tokens";
import { enter, FlipNumber, Label, leave } from "../../../components/paper/kit";
import { PaperPhoto } from "../../../components/paper/PaperPhoto";
import { Piece } from "../../../components/paper/Piece";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos } from "../../../lib/paper-motion";
import { LABELS } from "../data";
import { Clock, Loaf, PriceTag, PressOutput, PrintingPress } from "../parts/v3";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s01-hook");

const PHOTO = { x: 960, y: 400, w: 1100, h: Math.round((1100 * 875) / 1764) } as const;
const SMALL = { x: 560, y: 360, scale: 0.6 } as const;
const CLOCK = { x: 1180, y: 400 } as const;
const LOAF = { x: 1560, y: 460 } as const;
const PRESS = { x: 640, y: 560 } as const;
const PILE = { x: 1400, y: 890, step: 16 } as const;

export const S01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    hundredTrillion: T.cue("hundredTrillion"),
    issued: T.cue("issued"),
    january: T.cue("january"),
    cameOut: T.cue("cameOut"),
    fewMonths: T.cue("fewMonths"),
    doubling: T.cue("doubling"),
    canPrint: T.cue("canPrint"),
    whyNot: T.cue("whyNot"),
    everyoneRich: T.cue("everyoneRich"),
  };

  // The real note slides in and lands; on "A few months earlier" it steps aside, small.
  const note = enter(frame, T.anchor, { from: [0, -900], dur: 16, seed: 1, wobbleDeg: 3 });
  const aside = ramp(f2, cue.fewMonths, 18, EASE.inOut);
  const clear = leave(frame, cue.canPrint, [0, 1100], 16);
  const idle = idleJitter(frame, 11);

  const country = enter(frame, cue.issued, { from: [-20, 30], dur: 12, seed: 2, wobbleDeg: 5 });
  const date = enter(frame, cue.january, { from: [-20, 30], dur: 12, seed: 3, wobbleDeg: 5 });
  // The price tag swings on its string, then settles.
  const tag = enter(frame, cue.cameOut, { from: [60, -40], dur: 14, seed: 4, wobbleDeg: 9 });
  const swing = frame >= cue.cameOut ? 8 * Math.cos((f2 - cue.cameOut) * 0.25) * Math.exp(-(f2 - cue.cameOut) / 24) : 0;

  // Clock + loaf: each turn of the hand doubles the price on the tag.
  const clock = enter(frame, cue.doubling, { from: [0, -800], dur: 14, seed: 5 });
  const loaf = enter(frame, cue.doubling + 6, { from: [600, 0], dur: 14, seed: 6 });
  const turn1 = ramp(f2, cue.doubling + 16, 26, EASE.inOut);
  const turn2 = ramp(f2, cue.doubling + 50, 26, EASE.inOut);
  const priceIndex = turn2 >= 1 ? 2 : turn1 >= 1 ? 1 : 0;
  const flipAt = [cue.doubling + 42, cue.doubling + 76] as const;
  const flipSquash = (at: number) => (f2 >= at && f2 < at + 4 ? 0.2 : 1);
  const doublingLabel = enter(frame, cue.doubling + 20, { from: [0, 400], dur: 12, seed: 7 });

  // The press: notes pop out from "why doesn't every country" and stack into a wobbling pile.
  const press = enter(frame, cue.canPrint + 4, { from: [-900, 0], dur: 16, seed: 8 });
  const times = Array.from({ length: Math.floor((T.duration - cue.whyNot - 20) / 5) }, (_, k) => cue.whyNot + k * 5);
  const pileWobble = frame >= cue.everyoneRich ? 3 * Math.sin((f2 - cue.everyoneRich) * 0.22) * ramp(f2, cue.everyoneRich, 10) : 0;

  const noteX = mix(PHOTO.x, SMALL.x, aside);
  const noteY = mix(PHOTO.y, SMALL.y, aside);
  const noteScale = mix(1, SMALL.scale, aside);

  return (
    <SceneRoot>
      {!clear.gone && note.on ? (
        <Piece x={noteX + note.dx} y={noteY + note.dy + clear.dy} rotate={note.rotate - 1.5 + idle} scale={noteScale}>
          <PaperPhoto src="images/why-cant-countries-print-money/zimbabwe-100-trillion.jpg" w={PHOTO.w} h={PHOTO.h} id="v3-note" depth={1.6 + note.lift} seed={11} />
          {frame >= cue.hundredTrillion ? (
            <Piece x={0} y={PHOTO.h / 2 + 110} rotate={1}>
              <FlipNumber text={LABELS.noteDigits} frame={frame} flipAt={cue.hundredTrillion} size={88} tile={PAPER_COLORS.kraft.light} seed={12} />
            </Piece>
          ) : null}
          {country.on ? (
            <Piece x={-PHOTO.w / 2 + 130 + country.dx} y={-PHOTO.h / 2 + 40 + country.dy} rotate={-6 + country.rotate}>
              <Label text="Zimbabwe" fontSize={44} strip={THEME.card} depth={1.6 + country.lift} seed={13} />
            </Piece>
          ) : null}
          {date.on ? (
            <Piece x={-PHOTO.w / 2 + 390 + date.dx} y={-PHOTO.h / 2 + 40 + date.dy} rotate={4 + date.rotate}>
              <Label text={LABELS.noteIssued} fontSize={44} strip={PAPER_COLORS.kraft.light} depth={1.6 + date.lift} seed={14} />
            </Piece>
          ) : null}
          {tag.on ? (
            <Piece x={PHOTO.w / 2 - 100 + tag.dx} y={PHOTO.h / 2 - 10 + tag.dy} rotate={tag.rotate + swing - 6} origin="0px -60px">
              <PriceTag text={LABELS.noteAbout} fill={THEME.amber} size={52} seed={15} />
            </Piece>
          ) : null}
        </Piece>
      ) : null}

      {!clear.gone && clock.on ? (
        <Piece x={CLOCK.x + clock.dx} y={CLOCK.y + clock.dy + clear.dy} rotate={clock.rotate}>
          <Clock angle={(turn1 + turn2) * 360} r={120} />
        </Piece>
      ) : null}
      {!clear.gone && loaf.on ? (
        <Piece x={LOAF.x + loaf.dx} y={LOAF.y + loaf.dy + clear.dy} rotate={loaf.rotate + idle}>
          <Loaf w={200} seed={16} />
          <Piece x={0} y={-140} rotate={-4} scaleY={flipSquash(flipAt[0]) * flipSquash(flipAt[1])}>
            <PriceTag text={LABELS.doublingTags[priceIndex]} fill={priceIndex === 0 ? PAPER_COLORS.kraft.light : THEME.amber} size={56} seed={17} />
          </Piece>
        </Piece>
      ) : null}
      {!clear.gone && doublingLabel.on ? (
        <Piece x={1370 + doublingLabel.dx} y={720 + doublingLabel.dy + clear.dy} rotate={doublingLabel.rotate + 1}>
          <Label text={LABELS.doubling} fontSize={44} strip={COLORS.primary} depth={1.2 + doublingLabel.lift} seed={18} />
        </Piece>
      ) : null}

      {press.on ? (
        <Piece x={PRESS.x + press.dx} y={PRESS.y + press.dy} rotate={press.rotate}>
          <PrintingPress spin={f2 >= cue.whyNot ? (f2 - cue.whyNot) * 9 : 0} w={620} />
        </Piece>
      ) : null}
      <Piece x={PILE.x} y={PILE.y} rotate={pileWobble} origin="0px 0px">
        <PressOutput
          frame={frame}
          from={[PRESS.x - PILE.x + 260, PRESS.y - PILE.y + 150]}
          times={times}
          to={(k) => [((k * 37) % 9) - 4, -k * PILE.step]}
          w={220}
          travel={14}
        />
      </Piece>
    </SceneRoot>
  );
};
