import type React from "react";
import { LABELS } from "../data";
import { S01Hook } from "../scenes/S01Hook";
import { S03Textbook } from "../scenes/S03Textbook";
import { S04Twist } from "../scenes/S04Twist";
import { S05Watch } from "../scenes/S05Watch";
import { S07Destroyed } from "../scenes/S07Destroyed";
import { S08Cash } from "../scenes/S08Cash";
import { S09Iou } from "../scenes/S09Iou";
import { S11Trust } from "../scenes/S11Trust";
import { S12Insurance } from "../scenes/S12Insurance";
import type { SceneId } from "../timeline";
import { ShortFrame } from "./ShortFrame";

type ShortDef = {
  readonly id: string;
  /** Two or three scenes of the full video, played back to back. */
  readonly scenes: readonly { readonly id: SceneId; readonly Component: React.FC }[];
  readonly title: string;
  readonly subtitle: string;
};

/** The Shorts cut from video 02: two or three scenes each, with their own voice, music and sound. */
export const SHORTS: readonly ShortDef[] = [
  {
    id: "V2Short01Hook",
    scenes: [
      { id: "s01-hook", Component: S01Hook },
      { id: "s03-textbook", Component: S03Textbook },
      { id: "s04-twist", Component: S04Twist },
    ],
    title: "Where is your\nmoney, really?",
    subtitle: "Hint: not in a vault",
  },
  {
    id: "V2Short02Typed",
    scenes: [
      { id: "s05-watch", Component: S05Watch },
      { id: "s07-destroyed", Component: S07Destroyed },
    ],
    title: "Banks create money\nby typing",
    subtitle: "...and repaying destroys it",
  },
  {
    id: "V2Short03NeverPrinted",
    scenes: [
      { id: "s08-cash", Component: S08Cash },
      { id: "s09-iou", Component: S09Iou },
    ],
    title: `${LABELS.nineInTen} dollars were\nnever printed`,
    subtitle: `US money ${LABELS.m2}, cash ${LABELS.cash}`,
  },
  {
    id: "V2Short04BankRun",
    scenes: [
      { id: "s11-trust", Component: S11Trust },
      { id: "s12-insurance", Component: S12Insurance },
    ],
    title: `The ${LABELS.svbWithdrawn}\nbank run`,
    subtitle: "Silicon Valley Bank, March 2023",
  },
];

export const ShortComposition: React.FC<{ readonly short: string }> = ({ short }) => {
  const def = SHORTS.find((s) => s.id === short);
  if (!def) throw new Error(`Unknown short ${short}`);
  return <ShortFrame scenes={def.scenes} title={def.title} subtitle={def.subtitle} />;
};
