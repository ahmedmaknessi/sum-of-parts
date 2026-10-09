/**
 * YouTube chapters and SRT subtitles for a video (BUILD spec Phase 6).
 *
 *   npx tsx scripts/export-extras.ts 100-a-month-40-years
 *
 * Chapters: scene start times from timeline.json, first chapter at 0:00.
 * Subtitles: the ORIGINAL script wording (voiceover.txt), timed word by word
 * against the measured voiceover, shifted after the logo exactly like the
 * audio. Numbers are shown as digits ("$262,481", "7%"); small numbers stay
 * words ("seven", "one fifth") unless they carry $ or %.
 * Max 42 characters per line, max 2 lines per subtitle.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { forMatching, timedWords, type WhisperJson } from "./lib/word-timing";
import { splitText, tokenize, type Token } from "./lib/words";

const slug = process.argv[2];
if (!slug) throw new Error("Usage: npx tsx scripts/export-extras.ts <video-slug>");

const root = process.cwd();
const videoDir = path.join(root, "src", "videos", slug);
const outDir = path.join(root, "out");
mkdirSync(outDir, { recursive: true });

type Segment = { fromSec: number; toSec: number; atFrame: number; fromFrame: number; toFrame: number };
type SceneJson = { id: string; startFrame: number; endFrame: number };
const timeline = JSON.parse(readFileSync(path.join(videoDir, "timeline.json"), "utf8")) as {
  fps: number;
  totalFrames: number;
  audioSegments: Segment[];
  scenes: SceneJson[];
};
const { fps } = timeline;

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CHAPTERS } = require(path.join(videoDir, "chapters.ts")) as {
  CHAPTERS: readonly (readonly [sceneId: string, title: string])[];
};

const chapterTime = (frame: number) => {
  const s = Math.floor(frame / fps);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const chapters = CHAPTERS.map(([id, title], i) => {
  const scene = timeline.scenes.find((s) => s.id === id);
  if (!scene) throw new Error(`Scene ${id} missing from timeline.json`);
  return `${chapterTime(i === 0 ? 0 : scene.startFrame)} ${title}`;
});
const chaptersPath = path.join(outDir, `${slug}-chapters.txt`);
writeFileSync(chaptersPath, chapters.join("\n") + "\n");

// ---------------------------------------------------------------------------
// Word timing: script words aligned to measured transcript words
// ---------------------------------------------------------------------------

const audioPath = path.join(root, "public", timeline.audioSegments[0] ? `audio/${slug}/voiceover.mp3` : "");
const transcript = JSON.parse(readFileSync(path.join(videoDir, "transcript.json"), "utf8")) as WhisperJson;
const words = timedWords(transcript, audioPath);
const tTokens = forMatching(tokenize(words.map((w) => w.text)));

const scriptWords = splitText(readFileSync(path.join(videoDir, "voiceover.txt"), "utf8"));
const allScriptTokens = tokenize(scriptWords);
const sTokens = forMatching(allScriptTokens);

/** Greedy alignment with a small resync window (script and transcript are near-identical). */
const align = (a: readonly Token[], b: readonly Token[]): (number | null)[] => {
  const map: (number | null)[] = new Array(a.length).fill(null);
  let j = 0;
  for (let i = 0; i < a.length && j < b.length; i++) {
    if (a[i].text === b[j].text) {
      map[i] = j++;
      continue;
    }
    // Look ahead a few tokens on either side for the next agreement.
    let found = false;
    for (let k = 1; k <= 6 && !found; k++) {
      if (j + k < b.length && a[i].text === b[j + k].text) {
        map[i] = j + k;
        j += k + 1;
        found = true;
      } else if (i + k < a.length && a[i + k].text === b[j].text) {
        // script has extra tokens here; leave them unmatched
        found = true;
        i += k - 1;
      }
    }
  }
  return map;
};
const map = align(sTokens, tTokens);

// Source-time start/end for every script word.
const wordTimes: ({ start: number; end: number } | null)[] = scriptWords.map(() => null);
sTokens.forEach((t, i) => {
  const j = map[i];
  if (j === null) return;
  const tt = tTokens[j];
  for (let w = t.firstWord; w <= t.lastWord; w++) {
    wordTimes[w] = { start: words[tt.firstWord].start, end: words[tt.lastWord].end };
  }
});
// Unmatched script words (e.g. "dollars") take their neighbours' times.
for (let w = 0; w < wordTimes.length; w++) {
  if (wordTimes[w]) continue;
  const prev = wordTimes.slice(0, w).reverse().find(Boolean);
  const next = wordTimes.slice(w + 1).find(Boolean);
  wordTimes[w] = { start: prev?.end ?? next?.start ?? 0, end: next?.start ?? prev?.end ?? 0 };
}
const unmatched = sTokens.filter((_, i) => map[i] === null).length;

// Source time -> time in the final video (same cut as the audio).
const [seg1, seg2] = timeline.audioSegments;
const offset = (seg2.atFrame - seg2.fromFrame) / fps;
const toOutput = (sec: number) => (sec < seg1.toFrame / fps ? sec : sec + offset);

// ---------------------------------------------------------------------------
// Display text: numbers as digits
// ---------------------------------------------------------------------------

const SCALE_ONLY = /^(hundred|thousand|million|billion|trillion)$/i;
const fmt = (n: number) => n.toLocaleString("en-US");
/** Millions and up stay words, as spoken: "$42 billion", "2.5 trillion". */
const BIG = [
  [1e12, "trillion"],
  [1e9, "billion"],
  [1e6, "million"],
] as const;
const big = (n: number) => {
  const step = BIG.find(([size]) => n >= size);
  // Non-breaking space: "$42 billion" never splits across two subtitle lines.
  return step ? `${Math.round((n / step[0]) * 10) / 10} ${step[1]}` : null;
};
/**
 * "twenty fourteen", "nineteen thirty-three", "two thousand nine": a spoken
 * year, written without a comma. ("Two thousand" alone only counts from 2001,
 * so a plain "two thousand" amount keeps its comma.)
 */
const isYear = (n: number, words: readonly string[]) =>
  Number.isInteger(n) &&
  n >= 1900 &&
  n <= 2099 &&
  !words.some((w) => /hundred/i.test(w)) &&
  (!words.some((w) => /thousand/i.test(w)) || (n > 2000 && n < 2100));
const trailing = (word: string) => word.match(/[.,:;?!]+["”)]*$/)?.[0] ?? "";

type Unit = { text: string; start: number; end: number };
const units: Unit[] = [];
const used = new Set<number>();
const tokenAt = new Map<number, number>(); // first word index -> index in allScriptTokens
allScriptTokens.forEach((t, i) => tokenAt.set(t.firstWord, i));

for (let w = 0; w < scriptWords.length; w++) {
  if (used.has(w)) continue;
  const ti = tokenAt.get(w);
  const token = ti !== undefined ? allScriptTokens[ti] : undefined;
  const isNumber = token !== undefined && /^\d+(\.\d+)?$/.test(token.text);
  if (isNumber && token) {
    const n = Number(token.text);
    const spanWords = scriptWords.slice(token.firstWord, token.lastWord + 1);
    const next = allScriptTokens[ti! + 1];
    const unitWord = next && next.firstWord === token.lastWord + 1 ? next.text : null;
    const scaleOnly = spanWords.every((sw) => SCALE_ONLY.test(sw.replace(/[^a-z]/gi, "")));
    let text: string | null = null;
    let lastWord = token.lastWord;
    const asWords = big(n) ?? fmt(n);
    if (!scaleOnly && (unitWord === "dollars" || unitWord === "dollar")) {
      text = `$${asWords}`;
      lastWord = next.lastWord;
    } else if (!scaleOnly && unitWord === "percent") {
      text = `${fmt(n)}%`;
      lastWord = next.lastWord;
    } else if (!scaleOnly && isYear(n, spanWords)) {
      text = String(n);
    } else if (!scaleOnly && n >= 10) {
      text = asWords;
    }
    if (text !== null) {
      for (let k = token.firstWord; k <= lastWord; k++) used.add(k);
      units.push({
        text: text + trailing(scriptWords[lastWord]),
        start: toOutput(wordTimes[token.firstWord]!.start),
        end: toOutput(wordTimes[lastWord]!.end),
      });
      continue;
    }
  }
  used.add(w);
  units.push({ text: scriptWords[w], start: toOutput(wordTimes[w]!.start), end: toOutput(wordTimes[w]!.end) });
}

// Word-level captions for the Shorts (Remotion's Caption format, times in the final video).
const captionsPath = path.join(videoDir, "captions.json");
const captions = units.map((u, i) => ({
  text: (i === 0 ? "" : " ") + u.text,
  startMs: Math.round(u.start * 1000),
  endMs: Math.round(u.end * 1000),
  timestampMs: Math.round(((u.start + u.end) / 2) * 1000),
  confidence: null,
}));
writeFileSync(captionsPath, JSON.stringify(captions, null, 1) + "\n");

// ---------------------------------------------------------------------------
// Subtitles: max 2 lines x 42 characters
// ---------------------------------------------------------------------------

const MAX_LINE = 42;
const MAX_DURATION = 7;
const MIN_DURATION = 1;
const GAP_BREAK = 0.8;

/** Splits text into at most two lines of MAX_LINE, as balanced as possible. Null if impossible. */
const toLines = (text: string): string[] | null => {
  if (text.length <= MAX_LINE) return [text];
  const ws = text.split(" ");
  let best: string[] | null = null;
  let bestScore = Infinity;
  for (let k = 1; k < ws.length; k++) {
    const a = ws.slice(0, k).join(" ");
    const b = ws.slice(k).join(" ");
    if (a.length > MAX_LINE || b.length > MAX_LINE) continue;
    const score = Math.abs(a.length - b.length) - (/[,.;:?!]$/.test(a) ? 12 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
};

const textOf = (us: readonly Unit[]) => us.map((u) => u.text).join(" ");
const durationOf = (us: readonly Unit[]) => us[us.length - 1].end - us[0].start;
const fits = (us: readonly Unit[]) => toLines(textOf(us)) !== null && durationOf(us) <= MAX_DURATION;
const MIN_WORDS = 3;

/**
 * Splits a sentence until every piece fits: at the clause break (, ; :) nearest
 * the middle if there is one, otherwise at the most balanced word break.
 * No piece is left with fewer than MIN_WORDS words (no orphans like "month.").
 */
const splitToFit = (us: readonly Unit[]): Unit[][] => {
  if (fits(us) || us.length < 2 * MIN_WORDS) return [[...us]];
  const total = textOf(us).length;
  let best = -1;
  let bestScore = Infinity;
  for (let k = MIN_WORDS; k <= us.length - MIN_WORDS; k++) {
    const balance = Math.abs(textOf(us.slice(0, k)).length - total / 2);
    const clause = /[,;:]["”)]*$/.test(us[k - 1].text) ? total * 0.35 : 0;
    // A real pause in the recording is the most natural place to break.
    const pause = us[k].start - us[k - 1].end > 0.5 ? total * 0.5 : 0;
    const score = balance - clause - pause;
    if (score < bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return [...splitToFit(us.slice(0, best)), ...splitToFit(us.slice(best))];
};

// 1. Sentences, each split only as much as needed.
const sentences: Unit[][] = [];
let sentence: Unit[] = [];
for (const u of units) {
  sentence.push(u);
  if (/[.?!]["”)]*$/.test(u.text)) {
    sentences.push(sentence);
    sentence = [];
  }
}
if (sentence.length > 0) sentences.push(sentence);
const pieces = sentences.flatMap(splitToFit);

// 2. Merge a short piece with what follows ("Not bad." + "But also, not more.") when it still fits.
const merged: Unit[][] = [];
for (const p of pieces) {
  const prev = merged[merged.length - 1];
  const short = (us: readonly Unit[]) => textOf(us).length < 28;
  if (
    prev &&
    short(prev) &&
    p[0].start - prev[prev.length - 1].end <= GAP_BREAK &&
    fits([...prev, ...p])
  ) {
    merged[merged.length - 1] = [...prev, ...p];
  } else {
    merged.push([...p]);
  }
}

type Cue = { start: number; end: number; lines: string[] };
const cues: Cue[] = merged.map((us) => ({
  start: us[0].start,
  end: us[us.length - 1].end,
  lines: toLines(textOf(us)) ?? [textOf(us)],
}));

// Timing polish: minimum duration, small tail, never overlapping the next subtitle.
cues.forEach((c, i) => {
  const next = cues[i + 1];
  const limit = next ? next.start - 0.05 : Infinity;
  c.end = Math.min(Math.max(c.end + 0.2, c.start + MIN_DURATION), limit);
});

const srtTime = (sec: number) => {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};
const srt = cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.lines.join("\n")}\n`).join("\n");
const srtPath = path.join(outDir, `${slug}.srt`);
writeFileSync(srtPath, srt);

console.log(`Captions: ${path.relative(root, captionsPath)} (${captions.length} words)`);
console.log(`Chapters: ${path.relative(root, chaptersPath)}`);
console.log(chapters.join("\n"));
console.log(`\nSubtitles: ${path.relative(root, srtPath)} (${cues.length} cues, ${unmatched} unmatched script tokens)`);
console.log(`Longest line: ${Math.max(...cues.flatMap((c) => c.lines.map((l) => l.length)))} chars`);
