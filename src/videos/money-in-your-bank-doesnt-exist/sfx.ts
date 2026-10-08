/**
 * Sound-effect cue sheet for video 02. Paper sounds (public/sfx/paper, made by
 * scripts/make-paper-sfx.ts) plus a few from the main kit (public/sfx), placed
 * on the same cue frames the scenes animate on. Sparse by design: key
 * placements only, never every movement. Mixed by `npm run audio -- <slug>`.
 */
import { VIDEO } from "../../brand/tokens";
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
  const { add, cue } = scene("s01-hook");
  add("paper/tap", 12);
  [0, 4, 8, 12].forEach((d, i) => add("paper/flip", cue("balance") + d, 0.8, 1 + i * 0.05));
  add("paper/tap", cue("balance") + 28, 0.7);
  add("paper/slide", cue("whereIs"), 0.8, 1.1);
  add("paper/slide", cue("notInVault"), 1, 0.9);
  add("paper/tap", cue("notInVault") + 14);
  add("paper/tap", cue("nameOnIt") + 8, 0.6, 1.2);
  add("paper/stamp", cue("nameOnIt") + 26, 0.7);
  add("paper/slide", cue("stranger"), 0.9);
  for (let i = 0; i < 6; i++) add("pop", cue("promise") + 2 + i * 4, 0.6, 1 + i * 0.06);
  add("paper/stamp", cue("promise") + 46, 0.6);
  add("whoosh", cue("mostMoney"), 1.2, 0.8);
}

// S02 paper logo: four slices land, the amber one lifts, the name slides in.
{
  const { add } = scene("s02-logo");
  const fps = VIDEO.fps;
  [3, 0, 1, 2].forEach((order, i) => add("paper/tap", (0.15 + order * 0.18) * fps + 9, 1, 1 + i * 0.07));
  add("chime", 1.6 * fps, 1.4);
  add("paper/slide", 1.9 * fps, 0.8, 1.1);
}

// S03 textbook
{
  const { add, cue, anchor } = scene("s03-textbook");
  add("paper/page", anchor, 1);
  add("paper/tap", anchor + 40, 0.8);
  add("paper/tap", cue("deposit") + 50, 0.8);
  add("paper/tap", cue("vault") + 10, 0.7, 1.1);
  add("paper/slide", cue("lends") + 4, 0.7, 1.15);
  add("pop", cue("savingsLoan"));
  add("paper/tap", cue("anotherBank") + 12, 0.8);
  add("paper/slide", cue("anotherBank") + 50, 0.6, 1.2);
  add("paper/tap", cue("anotherBank") + 82, 0.7, 1.1);
  add("paper/tap", cue("multiplier") + 10, 1);
}

// S04 the twist
{
  const { add, cue } = scene("s04-twist");
  add("paper/rip", cue("notHow"), 1.3);
  add("paper/slide", cue("boe2014"), 1);
  add("paper/tap", cue("published") + 8, 0.7);
  add("paper/tap", cue("quote"), 0.4, 1.3);
  add("paper/tap", cue("quote") + 52, 0.4, 1.35);
  add("paper/stamp", cue("actOfLending") + 8, 0.6);
  add("chime", cue("actOfLending") + 10);
  add("paper/slide", cue("plainWords"), 0.8);
  add("paper/tap", cue("plainWords") + 34, 0.8);
  add("paper/plane", cue("newMoney") + 6);
}

// S05 watch it happen
{
  const { add, cue, anchor } = scene("s05-watch");
  add("paper/slide", anchor, 0.8);
  add("paper/slide", cue("carLoan"), 0.8, 1.1);
  add("paper/stamp", cue("approves") + 6, 1.2);
  add("paper/slide", cue("notTake") + 6, 0.5, 1.3);
  add("paper/tap", cue("twoEntries"), 0.7);
  add("paper/tap", cue("twoEntries") + 8, 0.7, 1.1);
  const typeLine = (at: number, chars: number) => {
    for (let k = 0; k < chars; k++) add("paper/key", at + k * 4, 0.9, 0.9 + ((k * 7) % 5) * 0.05);
    add("paper/slide", at + chars * 4 + 6, 0.6, 1.2);
    add("paper/tap", at + chars * 4 + 22, 0.8);
  };
  typeLine(cue("sarahOwes"), 22);
  typeLine(cue("accountShows"), 24);
  add("paper/page", cue("didntExist"), 0.7);
  add("chime", cue("didntExist") + 8, 1.1);
  add("paper/tap", cue("nobodyPrinted") + 6, 0.6);
  add("paper/tap", cue("nobodyPrinted") + 46, 0.6, 1.1);
  add("paper/key", cue("typed"), 2, 0.85);
}

// S06 two layers
{
  const { add, cue } = scene("s06-two-layers");
  add("whoosh", 22, 0.8, 0.9);
  add("paper/slide", cue("toDealer"), 0.8);
  add("pop", cue("doesntVanish"), 1.1, 1.1);
  add("paper/slide", cue("differentBank"), 0.9);
  add("paper/tap", cue("sendReal") + 8, 0.7);
  add("pop", cue("secondKind"), 0.9);
  add("whoosh", cue("reserves") - 10, 1);
  add("paper/slide", cue("reserves") + 30, 0.6);
  add("paper/tap", cue("neverTouch") + 14, 0.9);
  add("paper/slide", cue("twoLayers") + 6, 0.9);
  add("paper/slide", cue("twoLayers") + 14, 0.8, 0.9);
  add("pop", cue("centralCreates"), 0.8);
  add("chime", cue("commercialBanks"), 0.9);
}

// S07 money is destroyed
{
  const { add, cue, duration } = scene("s07-destroyed");
  add("paper/slide", 6, 0.6, 1.1);
  for (let k = 0; k < 4; k++) {
    const slipIn = cue("paysBack") + k * 40 + 28;
    add("paper/slide", slipIn - 28, 0.5, 1.2);
    add("paper/shredder", slipIn - 4, 0.9);
    add("paper/flip", slipIn, 0.8);
  }
  add("pop", cue("destroys"), 0.8);
  add("paper/slide", cue("notFixed"), 0.8);
  add("paper/slide", cue("notFixed") + 14, 0.8, 0.85);
  add("paper/tap", cue("createdEvery") + 8, 0.6);
  // The town: a soft pop for some new loans, a flip for some repayments.
  for (let t = cue("createdEvery") + 20, k = 0; t < duration - 10; t += 42, k++) add(k % 2 ? "paper/flip" : "pop", t, 0.5, 1 + (k % 3) * 0.08);
  [0, 4, 8].forEach((d, i) => add("pop", cue("everyMortgage") + d, 0.7, 1 + i * 0.1));
  [0, 4, 8].forEach((d) => add("paper/flip", cue("everyRepayment") + d + 14, 0.7));
}

// S08 how much is cash
{
  const { add, cue } = scene("s08-cash");
  add("paper/slide", 8, 0.7);
  add("paper/tap", cue("unitedStates"), 0.8);
  for (let k = 0; k < 8; k++) add("tick", cue("broadMoney") + k * 4, 1, 1 + k * 0.04);
  for (let k = 0; k < 6; k++) add("paper/flip", cue("cash") + k * 4, 0.7, 1 + k * 0.03);
  add("paper/slide", cue("cash") + 10, 0.6, 1.2);
  for (let k = 0; k < 5; k++) add("paper/flip", cue("nineInTen") + k * 6, 0.8);
  add("thump", cue("nineInTen") + 16, 0.6);
  add("chime", cue("nineInTen") + 18);
  add("paper/slide", cue("uk"), 0.8);
  add("pop", cue("ninetySeven"), 1);
}

// S09 your balance is an IOU
{
  const { add, cue, anchor } = scene("s09-iou");
  add("paper/tap", anchor + 14, 0.9);
  add("paper/flip", cue("iou"), 1.3, 0.8);
  add("paper/slide", cue("whenDeposit"), 0.7);
  add("paper/slide", cue("books"), 0.8);
  add("paper/tap", cue("books") + 30, 0.8);
  add("paper/rip", cue("owes"), 0.4, 1.4);
  add("paper/slide", cue("keepAside") - 10, 0.6);
  add("paper/page", cue("keepAside") + 22, 0.6, 1.3);
  add("paper/stamp", cue("sinceMarch") + 8, 1.2);
  add("thump", cue("sinceMarch") + 9, 0.5);
  add("pop", cue("zeroPercent"), 0.8);
}

// S10 why not infinite money
{
  const { add, cue, anchor, duration } = scene("s10-infinite");
  for (let t = anchor + 12; t < cue("infinite") - 6; t += 4) add("paper/key", t, 0.7, 0.9 + ((t * 3) % 5) * 0.05);
  for (let k = 0; k < 6; k++) add("paper/tap", cue("infinite") + k * 6 + 10, 0.7, 0.9 + k * 0.05);
  // New money: a tiny pop for every other square out of the slot, fast then slowing.
  let t = cue("infinite") + 40;
  for (let k = 0; t < duration; k++) {
    if (k % 2 === 0) add("pop", t + 4, 0.35, 1.25);
    const slow = Math.min(1, Math.max(0, (t - (cue("ratesUp") + 10)) / 40));
    t += Math.round(6 + (22 - 6) * slow);
  }
  add("paper/slide", cue("threeThings"), 0.7);
  add("pop", cue("makesSense"), 0.7);
  add("paper/tap", cue("borrowers") + 6, 0.8);
  add("paper/tap", cue("capital") + 6, 0.8, 1.05);
  add("paper/tap", cue("rates") + 6, 0.8, 1.1);
  add("chime", cue("lastOne"), 0.9);
  for (let k = 0; k < 5; k++) add("tick", cue("ratesUp") + k * 6, 1.4, 0.8);
  add("paper/slide", cue("ratesUp") + 120, 0.7);
  add("paper/tap", cue("ratesUp") + 136, 0.8);
  add("pop", cue("fightInflation"), 0.6);
}

// S11 when trust breaks (the music thins out here; a soft tension pulse carries it)
{
  const { add, cue, duration } = scene("s11-trust");
  for (let k = 0; k < 6; k++) add("paper/tap", cue("fallApart") + k * 5 + 8, 0.7, 0.85);
  add("thump", cue("fallApart") + 24, 0.7);
  add("paper/page", cue("depression") - 4, 1.1);
  for (let k = 0; k < 4; k++) add("paper/stamp", cue("depression") + 50 + k * 30 + 6, 0.6, 1 + k * 0.04);
  add("paper/page", cue("march9") - 6, 1.1, 0.9);
  for (let t = cue("depression") + 20; t < duration - 20; t += 44) add("paper/pulse", t, 1);
  add("paper/rip", cue("fortyTwo"), 1.3);
  [0, 4, 8].forEach((d) => add("paper/flip", cue("fortyTwo") + 4 + d, 0.7));
  add("paper/tap", cue("quarter") + 6, 0.7);
  add("paper/slide", cue("hundredBillion"), 0.8, 0.9);
  add("paper/tap", cue("hundredBillion") + 26, 0.7);
  add("paper/stamp", cue("shutDown") + 6, 1.3, 0.85);
  add("thump", cue("shutDown") + 7, 0.8);
  add("paper/stamp", cue("shutDown") + 16, 0.6);
  add("paper/slide", cue("onHand"), 0.6);
  for (let k = 0; k < 4; k++) add("paper/rip", cue("bonds") + k * 8, 0.35, 1.3);
}

// S12 deposit insurance
{
  const { add, cue, anchor } = scene("s12-insurance");
  add("paper/tap", anchor + 12, 1);
  add("thump", anchor + 13, 0.5);
  add("paper/slide", cue("twoFifty"), 0.8);
  add("paper/tap", cue("since1933") + 8, 0.7);
  add("paper/slide", cue("atSvb"), 0.9);
  add("pop", cue("ninetyFour"), 0.9);
  add("paper/tap", cue("ninetyFour") + 12, 0.7);
  add("paper/pulse", cue("notInsured"), 0.8);
  add("whoosh", cue("coveredEveryone"), 1);
  add("chime", cue("coveredEveryone") + 14, 1.1);
}

// S13 takeaway
{
  const { add, cue, anchor } = scene("s13-takeaway");
  add("paper/tap", anchor + 14, 0.9);
  add("paper/slide", cue("notCash"), 0.7);
  add("paper/rip", cue("notCash") + 14, 0.8);
  add("paper/slide", cue("notVault"), 0.7, 0.9);
  add("paper/rip", cue("notVault") + 14, 0.8, 1.1);
  add("paper/stamp", cue("promise") + 10, 0.8);
  [cue("rules"), cue("insurance"), cue("trust")].forEach((at, i) => add("paper/tap", at + 10, 1, 1 + i * 0.1));
  add("chime", cue("trust") + 14, 0.9);
  add("paper/slide", cue("ifBanks"), 0.7);
  add("paper/slide", cue("printWhy"), 0.9);
  for (let k = 0; k < 4; k++) add("paper/key", cue("printWhy") + 20 + k * 12, 0.9, 0.8);
  add("pop", cue("printWhy") + 32, 1.1);
  add("chime", cue("nextVideo"), 1);
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
