/**
 * Sound-effect cue sheet for video 03. Paper sounds (public/sfx/paper, made by
 * scripts/make-paper-sfx.ts) plus a few from the main kit (public/sfx), placed
 * on the same cue frames the scenes animate on. Sparse by design: key
 * placements only, never every movement. Mixed by `npm run audio -- <slug>`.
 */
import { getScene, sceneTiming, TIMELINE, type SceneId } from "./timeline";

/** Sound files, relative to public/sfx/ (without .wav). */
export type SfxSound =
  | "paper/slide"
  | "paper/tap"
  | "paper/rip"
  | "paper/page"
  | "paper/flip"
  | "paper/stamp"
  | "paper/key"
  | "paper/shredder"
  | "paper/plane"
  | "paper/pulse"
  | "pop"
  | "chime"
  | "thump"
  | "whoosh"
  | "tick";

export type SfxEvent = { readonly sound: SfxSound; readonly frame: number; readonly volume: number; readonly rate?: number };

/** Default level per sound (each file peaks at -3 dBFS). */
const LEVEL: Record<SfxSound, number> = {
  "paper/slide": 0.3,
  "paper/tap": 0.32,
  "paper/rip": 0.3,
  "paper/page": 0.3,
  "paper/flip": 0.22,
  "paper/stamp": 0.4,
  "paper/key": 0.16,
  "paper/shredder": 0.2,
  "paper/plane": 0.26,
  "paper/pulse": 0.4,
  pop: 0.18,
  chime: 0.12,
  thump: 0.36,
  whoosh: 0.14,
  tick: 0.08,
};

const events: SfxEvent[] = [];

const scene = (id: SceneId) => {
  const start = getScene(id).startFrame;
  const T = sceneTiming(id);
  const add = (sound: SfxSound, frame: number, gain = 1, rate = 1) =>
    events.push({ sound, frame: Math.round(start + frame), volume: LEVEL[sound] * gain, rate });
  return { add, cue: T.cue, anchor: T.anchor, duration: T.duration };
};

// A paper slide under every sheet wipe (the sheet covers the cut at the scene start).
for (const s of TIMELINE.scenes.slice(1)) {
  events.push({ sound: "paper/slide", frame: s.startFrame - 10, volume: LEVEL["paper/slide"] * 1.1, rate: 0.85 });
}


// S01 hook
{
  const { add, cue, anchor } = scene("s01-hook");
  add("paper/slide", anchor, 0.9);
  add("paper/tap", anchor + 14);
  for (let i = 0; i < 6; i++) add("paper/flip", cue("hundredTrillion") + i * 6, 0.7, 1 + i * 0.04);
  add("paper/tap", cue("issued") + 10, 0.7, 1.2);
  add("paper/tap", cue("january") + 10, 0.7, 1.1);
  add("paper/slide", cue("cameOut"), 0.6, 1.2);
  add("paper/tap", cue("cameOut") + 12);
  add("paper/slide", cue("fewMonths"), 0.6);
  add("paper/tap", cue("doubling") + 12);
  add("tick", cue("doubling") + 16, 1.2);
  add("paper/flip", cue("doubling") + 42, 1);
  add("tick", cue("doubling") + 50, 1.2);
  add("paper/flip", cue("doubling") + 76, 1, 1.1);
  add("whoosh", cue("canPrint"), 1, 0.9);
  add("paper/slide", cue("canPrint") + 4, 1);
  for (let k = 0; k < 8; k++) add("paper/key", cue("whyNot") + k * 15, 0.8, 0.8 + (k % 3) * 0.05);
  add("paper/tap", cue("everyoneRich"), 0.9, 0.8);
}

// S03 island
{
  const { add, cue, anchor } = scene("s03-island");
  add("paper/slide", anchor, 0.8);
  add("paper/tap", anchor + 16, 0.6);
  add("whoosh", cue("tiny"), 0.8, 1.3);
  add("paper/slide", cue("imagine"), 1, 0.8);
  for (let k = 0; k < 10; k++) add("paper/tap", cue("loaves") + 16 + k * 4, 0.45, 1 + k * 0.03);
  for (let k = 0; k < 10; k++) add("paper/flip", cue("tenDollars") + 12 + k * 3, 0.4, 1 + k * 0.03);
  add("paper/stamp", cue("oneDollar") + 4, 0.5);
  add("paper/slide", cue("decides") + 20, 0.8);
  for (let k = 0; k < 10; k++) add("pop", cue("prints") + 8 + k * 6, 0.5, 1 + k * 0.04);
  add("paper/tap", cue("twiceMoney") + 10);
  add("paper/tap", cue("onlyTen") + 10, 1, 0.9);
  for (let k = 0; k < 10; k++) add("paper/flip", cue("towardTwo") + 6 + k * 4, 0.45, 1.1);
  add("paper/stamp", cue("nobodyRicher") + 14, 0.7);
  add("paper/rip", cue("halfAsMuch") + 34, 0.8);
  add("paper/stamp", cue("simplest") + 10, 0.8);
  add("paper/slide", cue("chasing"), 0.9, 1.2);
}

// S04 wealth
{
  const { add, cue, anchor } = scene("s04-wealth");
  add("paper/tap", anchor + 10);
  add("thump", cue("breadIs") + 10, 0.8);
  [0, 12, 24].forEach((d, i) => add("paper/tap", cue("houses") + d + 10, 0.8, 1 + i * 0.08));
  add("paper/flip", cue("claim"), 1);
  for (let k = 0; k < 9; k++) add("paper/tap", cue("printingClaims") + 6 + k * 3, 0.35, 1.2 + k * 0.02);
  add("paper/rip", cue("moreBread") + 8, 0.5, 1.3);
}

// S05 Zimbabwe
{
  const { add, cue, anchor } = scene("s05-zimbabwe");
  add("paper/slide", anchor, 1);
  add("paper/tap", cue("payBills") + 12);
  for (let k = 0; k < 8; k++) add("paper/key", cue("payBills") + 20 + k * 14, 0.6, 0.9);
  add("paper/slide", cue("moreFewer"), 0.8);
  add("paper/tap", cue("peak") + 10, 0.8);
  add("thump", cue("seventyNine") + 8, 1);
  for (let i = 0; i < 8; i++) add("paper/flip", cue("seventyNine") + 6 + i * 4, 0.5, 1 + i * 0.03);
  add("paper/slide", cue("thinkAbout") + 8, 0.8);
  add("chime", cue("paidMorning"), 0.7);
  add("whoosh", cue("evening"), 0.8, 0.7);
  add("paper/rip", cue("saving") + 14, 0.8);
  add("paper/slide", cue("spend"), 0.9, 1.2);
  add("paper/tap", cue("faster") + 10, 0.8);
  add("paper/slide", cue("april") - 10, 0.9);
  add("paper/stamp", cue("april") + 16, 1);
  for (let k = 0; k < 4; k++) add("paper/flip", cue("switched") + 6 + k * 5, 0.8, 1 + k * 0.05);
}

// S06 US
{
  const { add, cue, anchor } = scene("s06-us");
  add("paper/slide", anchor, 1);
  add("paper/tap", cue("feb2020") + 12);
  add("paper/flip", cue("twoYears"), 0.8);
  for (let k = 0; k < 7; k++) add("paper/flip", cue("twentyTwo") + k * 4, 0.45, 1 + k * 0.04);
  add("paper/stamp", cue("forty") + 10, 0.8);
  add("paper/slide", cue("whyNot") + 10, 0.9);
  add("paper/slide", cue("inflationCame") + 6, 0.8);
  add("tick", cue("june2022") + 10, 1);
  add("paper/tap", cue("june2022") + 26);
  add("paper/tap", cue("biggestJump") + 10, 0.7);
  add("thump", cue("hurt"), 0.6);
  add("whoosh", cue("notHyper") + 10, 1, 1.2);
}

// S07 reasons
{
  const { add, cue, anchor } = scene("s07-reasons");
  for (let i = 0; i < 4; i++) add("paper/tap", anchor + i * 5 + 10, 0.7, 1 + i * 0.05);
  for (const c of ["timing", "wholeWorld", "ownCurrency", "trust"]) {
    add("paper/flip", cue(c), 1.2);
    add("paper/slide", cue(c) + 10, 0.7);
  }
  add("paper/stamp", cue("satStill") + 10, 0.6);
  for (let k = 0; k < 6; k++) add("paper/tap", cue("heldByBanks") + k * 4 + 8, 0.4, 1 + k * 0.05);
  add("paper/stamp", cue("fiftySeven") + 10, 0.7);
  add("whoosh", cue("spreads"), 0.8);
  add("paper/tap", cue("manyCountries") + 12);
  add("paper/stamp", cue("debtsBigger") + 10, 0.6);
  add("paper/stamp", cue("independentFed") + 10, 0.7);
  add("thump", cue("raisedRates") + 10, 0.8);
  add("chime", cue("believed"), 0.8);
}

// S08 brake
{
  const { add, cue, anchor } = scene("s08-brake");
  add("paper/slide", anchor, 1);
  add("paper/tap", anchor + 16, 0.7);
  for (let k = 0; k < 8; k++) add("pop", cue("createdByBanks") + k * 7, 0.4, 1 + k * 0.03);
  add("tick", cue("higherRates"), 1.2);
  add("thump", cue("brake") + 4, 1);
  add("paper/slide", cue("littleInflation"), 0.9);
  add("paper/tap", cue("twoPercent") + 10);
  add("paper/rip", cue("faster") + 18, 1);
  add("paper/stamp", cue("faster") + 12, 0.7);
}

// S09 who
{
  const { add, cue, anchor } = scene("s09-who");
  add("paper/tap", anchor + 10);
  add("paper/slide", cue("notPresident"), 0.9);
  add("paper/tap", cue("notPresident") + 34, 0.8);
  add("paper/tap", cue("independent") + 12, 0.9);
  add("paper/stamp", cue("onPurpose") + 10, 0.7);
  [0, 14, 28].forEach((d, i) => add("paper/tap", cue("election") + d + 8, 0.8, 1 + i * 0.08));
  add("thump", cue("oneVote") + 4, 0.7);
  add("paper/rip", cue("breaks") + 10, 1.2);
  for (let k = 0; k < 10; k++) add("paper/key", cue("breaks") + 30 + k * 6, 0.7, 0.9 + k * 0.02);
  add("whoosh", cue("stories"), 1.3, 0.8);
}

// S10 takeaway
{
  const { add, cue, anchor } = scene("s10-takeaway");
  add("paper/tap", anchor + 10);
  add("paper/slide", cue("worth"), 0.8);
  for (let k = 0; k < 5; k++) add("paper/tap", cue("buysLess") + 10 + k * 8, 0.5, 1 + k * 0.08);
  add("paper/slide", cue("printMoney"), 0.9);
  add("paper/key", cue("printMoney") + 16, 1);
  add("thump", cue("printBread") + 16, 0.8);
  add("pop", cue("printBread") + 30, 1);
  add("paper/slide", cue("newSeries"), 1);
  add("paper/stamp", cue("newSeries") + 14, 0.8);
  add("paper/slide", cue("sportsbooks") + 4, 0.9);
  add("chime", cue("youDo"), 0.9);
}

// End card
{
  const { add } = scene("end-card");
  add("paper/tap", 14, 0.9);
  add("paper/slide", 14, 0.7, 1.1);
  add("paper/tap", 34, 0.8, 0.9);
  add("paper/tap", 42, 0.8, 0.95);
  add("chime", 50, 1);
}

export const SFX_EVENTS: readonly SfxEvent[] = events.sort((a, b) => a.frame - b.frame);
