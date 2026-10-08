import type React from "react";
import { LABELS } from "../data";
import { S01Hook } from "../scenes/S01Hook";
import { S08Decades } from "../scenes/S08Decades";
import { S09TippingPoint } from "../scenes/S09TippingPoint";
import type { SceneId } from "../timeline";
import { ShortFrame } from "./ShortFrame";

type ShortDef = {
  readonly id: string;
  readonly scene: SceneId;
  readonly title: string;
  readonly subtitle: string;
  readonly Scene: React.FC;
};

/** The Shorts cut from Video 01: one scene each, replayed with its own voice and sound. */
export const SHORTS: readonly ShortDef[] = [
  {
    id: "Short01Hook",
    scene: "s01-hook",
    title: `What ${LABELS.deposit} a month\nbecomes in ${LABELS.years} years`,
    subtitle: `Invested at ${LABELS.investRate} a year`,
    Scene: S01Hook,
  },
  {
    id: "Short02YearEleven",
    scene: "s09-tipping-point",
    title: "The year your money\nout-earns you",
    subtitle: `${LABELS.deposit} a month at ${LABELS.investRate} a year`,
    Scene: S09TippingPoint,
  },
  {
    id: "Short03LastDecade",
    scene: "s08-decades",
    title: `Why the last ${LABELS.lastDecadeYears} years\nmatter most`,
    subtitle: `${LABELS.deposit} a month at ${LABELS.investRate}, for ${LABELS.years} years`,
    Scene: S08Decades,
  },
];

export const ShortComposition: React.FC<{ readonly short: string }> = ({ short }) => {
  const def = SHORTS.find((s) => s.id === short);
  if (!def) throw new Error(`Unknown short ${short}`);
  const { Scene } = def;
  return (
    <ShortFrame scene={def.scene} title={def.title} subtitle={def.subtitle}>
      <Scene />
    </ShortFrame>
  );
};
