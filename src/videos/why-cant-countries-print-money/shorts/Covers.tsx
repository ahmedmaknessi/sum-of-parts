import type React from "react";
import { COLORS, PAPER_COLORS, SHORT } from "../../../brand/tokens";
import { Label, Words } from "../../../components/paper/kit";
import { Piece } from "../../../components/paper/Piece";
import { PaperText } from "../../../components/paper/PaperText";
import { Cover } from "../../money-in-your-bank-doesnt-exist/shorts/Covers";
import { LABELS } from "../data";
import { Loaf, MapOutline, PaperNote, PrintingPress, Thermometer } from "../parts/v3";
import { THEME } from "../theme";

/**
 * Instagram Reel covers (1080x1920) for the video 03 Shorts, same layout as
 * video 02's: everything that matters inside the middle 1080x1440 band.
 */
const CX = SHORT.width / 2;
const OBJ_Y = (SHORT.height - 1440) / 2 + 930;

export const V3Cover01: React.FC = () => (
  <Cover lines={["Why not just", "print more?"]} highlight={1} backdrop="sky">
    <Piece x={CX - 150} y={OBJ_Y + 40} scale={1.3}>
      <PrintingPress spin={20} w={420} />
    </Piece>
    <Piece x={CX + 210} y={OBJ_Y - 170} rotate={8}>
      <Loaf w={280} seed={3610} />
    </Piece>
    <Piece x={CX + 250} y={OBJ_Y - 360}>
      <PaperText color={THEME.ink} fontSize={150} depth={2} shadowOpacity={THEME.shadow}>
        ?
      </PaperText>
    </Piece>
  </Cover>
);

export const V3Cover02: React.FC = () => (
  <Cover lines={[LABELS.noteShort, "was worth", LABELS.noteUsd]} highlight={2} backdrop="leaf">
    <Piece x={CX} y={OBJ_Y + 60} rotate={-6}>
      <PaperNote w={720} value="" fill={COLORS.primary} seed={3620} depth={2.2} />
      <Words text={LABELS.noteDigits} size={50} depth={0.3} />
    </Piece>
  </Cover>
);

export const V3Cover03: React.FC = () => (
  <Cover lines={["The US printed", "too. So why no", "hyperinflation?"]} highlight={2} backdrop="rose">
    <Piece x={CX - 140} y={OBJ_Y + 40} rotate={-3}>
      <MapOutline country="usa" size={520} fill={PAPER_COLORS.sky.base} seed={3630} />
    </Piece>
    <Piece x={CX + 250} y={OBJ_Y + 20} scale={0.75}>
      <Thermometer level={0.82} />
    </Piece>
    <Piece x={CX + 120} y={OBJ_Y - 220} rotate={4}>
      <Label text={LABELS.cpi} fontSize={84} strip={COLORS.coral} ink={COLORS.primary} depth={2} seed={3631} />
    </Piece>
  </Cover>
);

export const V3Cover04: React.FC = () => (
  <Cover lines={["How fast is", "too fast?"]} highlight={1} backdrop="kraft">
    <Piece x={CX - 230} y={OBJ_Y + 40} rotate={-4}>
      <MapOutline country="zimbabwe" size={300} fill={PAPER_COLORS.leaf.base} seed={3640} />
    </Piece>
    <Piece x={CX + 190} y={OBJ_Y + 40} rotate={3}>
      <MapOutline country="usa" size={400} fill={PAPER_COLORS.sky.base} seed={3641} />
    </Piece>
    <Piece x={CX} y={OBJ_Y - 230} rotate={-3}>
      <Label text={`Target: ${LABELS.target}`} fontSize={72} strip={THEME.amber} depth={2} seed={3642} />
    </Piece>
  </Cover>
);
