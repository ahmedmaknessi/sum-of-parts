import type React from "react";
import { FACTS, LABELS } from "../data";
import { S01Hook } from "../scenes/S01Hook";
import { S03Island } from "../scenes/S03Island";
import { S04Wealth } from "../scenes/S04Wealth";
import { S05Zimbabwe } from "../scenes/S05Zimbabwe";
import { S06Us } from "../scenes/S06Us";
import { S07Reasons } from "../scenes/S07Reasons";
import { S08Brake } from "../scenes/S08Brake";
import { S09Who } from "../scenes/S09Who";
import { S10Takeaway } from "../scenes/S10Takeaway";
import type { SceneId } from "../timeline";
import { ShortFrame } from "./ShortFrame";

type ShortDef = {
  readonly id: string;
  /** Three scenes of the full video, played back to back (90 to 120 s). */
  readonly scenes: readonly { readonly id: SceneId; readonly Component: React.FC }[];
  readonly title: string;
  readonly subtitle: string;
};

const s01 = { id: "s01-hook", Component: S01Hook } as const;
const s03 = { id: "s03-island", Component: S03Island } as const;
const s04 = { id: "s04-wealth", Component: S04Wealth } as const;
const s05 = { id: "s05-zimbabwe", Component: S05Zimbabwe } as const;
const s06 = { id: "s06-us", Component: S06Us } as const;
const s07 = { id: "s07-reasons", Component: S07Reasons } as const;
const s08 = { id: "s08-brake", Component: S08Brake } as const;
const s09 = { id: "s09-who", Component: S09Who } as const;
const s10 = { id: "s10-takeaway", Component: S10Takeaway } as const;

/** The Shorts cut from video 03, with their own voice, music and sound. */
export const SHORTS: readonly ShortDef[] = [
  {
    id: "V3Short01Bread",
    scenes: [s03, s04, s10],
    title: "Why not just\nprint more money?",
    subtitle: "A tiny island explains it",
  },
  {
    id: "V3Short02Note",
    scenes: [s01, s05, s09],
    title: `The ${LABELS.noteShort.toLowerCase()}\nnote`,
    subtitle: `Zimbabwe, ${FACTS.note.issued.year}`,
  },
  {
    id: "V3Short03Reasons",
    scenes: [s06, s07, s10],
    title: "The US printed too.\nWhy no hyperinflation?",
    subtitle: "Four big reasons",
  },
  {
    id: "V3Short04Zimbabwe",
    scenes: [s05, s06, s08],
    title: "Zimbabwe vs the US:\nhow fast is too fast?",
    subtitle: `Why central banks aim for ${LABELS.target}`,
  },
];

export const ShortComposition: React.FC<{ readonly short: string }> = ({ short }) => {
  const def = SHORTS.find((s) => s.id === short);
  if (!def) throw new Error(`Unknown short ${short}`);
  return <ShortFrame scenes={def.scenes} title={def.title} subtitle={def.subtitle} />;
};
