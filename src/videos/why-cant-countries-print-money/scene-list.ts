/**
 * Video 03: every scene in order, with its Studio name. Video03.tsx plays
 * them; Root.tsx registers each one alone (Video03-Scenes folder).
 */
import type React from "react";
import { S02Logo } from "../money-in-your-bank-doesnt-exist/scenes/S02Logo";
import { S14EndCard } from "../money-in-your-bank-doesnt-exist/scenes/S14EndCard";
import { S01Hook } from "./scenes/S01Hook";
import { S03Island } from "./scenes/S03Island";
import { S04Wealth } from "./scenes/S04Wealth";
import { S05Zimbabwe } from "./scenes/S05Zimbabwe";
import { S06Us } from "./scenes/S06Us";
import { S07Reasons } from "./scenes/S07Reasons";
import { S08Brake } from "./scenes/S08Brake";
import { S09Who } from "./scenes/S09Who";
import { S10Takeaway } from "./scenes/S10Takeaway";
import type { SceneId } from "./timeline";

export const SCENES: readonly { readonly id: SceneId; readonly name: string; readonly Component: React.FC }[] = [
  { id: "s01-hook", name: "V3-S01-Hook", Component: S01Hook },
  { id: "s02-logo", name: "V3-S02-Logo", Component: S02Logo },
  { id: "s03-island", name: "V3-S03-Island", Component: S03Island },
  { id: "s04-wealth", name: "V3-S04-Wealth", Component: S04Wealth },
  { id: "s05-zimbabwe", name: "V3-S05-Zimbabwe", Component: S05Zimbabwe },
  { id: "s06-us", name: "V3-S06-Us", Component: S06Us },
  { id: "s07-reasons", name: "V3-S07-Reasons", Component: S07Reasons },
  { id: "s08-brake", name: "V3-S08-Brake", Component: S08Brake },
  { id: "s09-who", name: "V3-S09-Who", Component: S09Who },
  { id: "s10-takeaway", name: "V3-S10-Takeaway", Component: S10Takeaway },
  { id: "end-card", name: "V3-S11-EndCard", Component: S14EndCard },
];
