/**
 * Measured word timing, shared by the timeline builder and the subtitle export.
 *
 * whisper.cpp's word times are estimates: its DTW token times drift by up to a
 * second around pauses, and punctuation tokens ("$", "?", ".") often sit
 * inside silence. Each word is snapped to the audio itself where possible:
 * the end of a measured pause, a short dip between words, or the energy valley
 * in connected speech.
 */
import { execFileSync, spawnSync } from "node:child_process";
import type { SourceWord, Token } from "./words";

export type WhisperToken = {
  text: string;
  offsets: { from: number; to: number };
  t_dtw: number;
  p: number;
};
export type WhisperJson = { transcription: { tokens: WhisperToken[] }[] };

/**
 * Word timing.
 * whisper.cpp's DTW token times drift by up to a second around pauses, and
 * punctuation tokens ("$", "?", ".") often sit inside silence. So a word spans
 * the segment offsets of its alphanumeric tokens only, and is then snapped to
 * the audio itself: a measured pause that ends where the word begins gives its
 * start, a measured pause that begins where it ends gives its end.
 */
export type TimedWord = SourceWord & { startSource: StartSource; measuredEnd: boolean };
export type StartSource = "pause" | "dip" | "valley" | "whisper";
export type Pause = { start: number; end: number };

/** Clear pauses: sentence and clause breaks. */
export const PAUSE = { db: -40, minSec: 0.15 };
/** Short dips between words in connected speech. */
export const DIP = { db: -35, minSec: 0.05 };
/** A pause may move a word start this much later than whisper's estimate (never past the next word). */
const PAUSE_SNAP_LATE = 0.4;
/** A dip must sit this close to whisper's estimate. */
const DIP_SNAP_EARLY = 0.2;
const DIP_SNAP_LATE = 0.15;
/** A measured pause may move a word end this much later than whisper's estimate. */
const END_SNAP_LATE = 0.15;
/** Connected speech: search this far around whisper's estimate for the energy valley between words. */
const VALLEY_SEARCH = 0.15;
/** The word starts where energy has risen this much out of the valley. */
const VALLEY_RISE_DB = 6;

const isAlnum = (s: string) => /[a-z0-9]/i.test(s);
const SENTENCE_END = /[.?!:;]["”)]*$/;
const CLAUSE_END = /[.?!:;,]["”)]*$/;

/** Measured silences in the audio (ffmpeg silencedetect). */
export const readPauses = (file: string, { db, minSec }: { db: number; minSec: number }): Pause[] => {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-af", `silencedetect=noise=${db}dB:d=${minSec}`, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const starts = [...result.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...result.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return starts.map((start, i) => ({ start, end: ends[i] ?? Infinity }));
};

/** Short-time energy in dB, one value per 10 ms. */
export const readEnergy = (file: string): Float32Array => {
  const pcm = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", file, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
    { maxBuffer: 256 * 1024 * 1024 },
  );
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2);
  const hop = 160; // 10 ms at 16 kHz
  const win = 320;
  const out = new Float32Array(Math.max(0, Math.floor((samples.length - win) / hop) + 1));
  for (let f = 0; f < out.length; f++) {
    let sum = 0;
    for (let k = f * hop; k < f * hop + win; k++) sum += samples[k] * samples[k];
    out[f] = 10 * Math.log10(sum / win / (32768 * 32768) + 1e-12);
  }
  return out;
};

/** Onset after the quietest point in [lo, hi]: where energy has risen VALLEY_RISE_DB above it. */
const valleyOnset = (energy: Float32Array, lo: number, hi: number): number => {
  const a = Math.max(0, Math.round(lo * 100));
  const b = Math.min(energy.length - 1, Math.round(hi * 100));
  let min = a;
  for (let k = a; k <= b; k++) if (energy[k] < energy[min]) min = k;
  let k = min;
  while (k < b && energy[k] < energy[min] + VALLEY_RISE_DB) k++;
  return k / 100;
};

const lastBefore = (items: readonly Pause[], lo: number, hi: number) => {
  const inWindow = items.filter((p) => p.end > lo && p.end <= hi);
  return inWindow.length > 0 ? inWindow[inWindow.length - 1].end : undefined;
};

export const loadWords = (
  json: WhisperJson,
  pauses: readonly Pause[],
  dips: readonly Pause[],
  energy: Float32Array,
): TimedWord[] => {
  type Building = { text: string; start: number | null; end: number | null; lastFrom: number; fallbackEnd: number };
  const built: Building[] = [];
  // A token without a leading space continues the previous word, even across
  // segments: --split-on-word can put "3", "/", "4" in separate segments.
  for (const segment of json.transcription) {
    for (const token of segment.tokens) {
      if (token.text.startsWith("[_")) continue; // special tokens
      const from = token.offsets.from / 1000;
      const to = token.offsets.to / 1000;
      const alnum = isAlnum(token.text);
      if (token.text.startsWith(" ") || built.length === 0) {
        built.push({ text: token.text.trim(), start: alnum ? from : null, end: alnum ? to : null, lastFrom: from, fallbackEnd: to });
      } else {
        const w = built[built.length - 1];
        w.text += token.text;
        w.fallbackEnd = Math.max(w.fallbackEnd, to);
        if (alnum) {
          w.start ??= from;
          w.end = Math.max(w.end ?? to, to);
          w.lastFrom = from;
        }
      }
    }
  }
  const spoken = built.filter((w) => w.text.length > 0);

  const words: TimedWord[] = [];
  let prevSpeechEnd = 0;
  let prevStart = 0;
  spoken.forEach((w, i) => {
    const start = w.start ?? w.fallbackEnd;
    const end = w.end ?? w.fallbackEnd;
    const next = spoken.slice(i + 1).find((x) => x.start !== null);
    const nextStart = next?.start ?? Infinity;

    // 1. Speech can't happen inside a measured silence. If whisper put the word
    //    there, decide which side it belongs to: after the silence if it follows
    //    a clause break ("own." -> "So,"), or sits nearer the silence's end and
    //    doesn't end a sentence; otherwise before it ("all of money." -> pause).
    const prevText = i > 0 ? spoken[i - 1].text : "";
    const inside = pauses.find((p) => start >= p.start - 0.1 && start < p.end);
    const belongsAfter =
      inside !== undefined &&
      (CLAUSE_END.test(prevText) || (start - inside.start > inside.end - start && !SENTENCE_END.test(w.text)));
    const before = inside !== undefined && !belongsAfter ? inside : undefined;

    // 2. A clear pause that ends between the previous word and (shortly after) this one.
    const pauseOnset = belongsAfter
      ? inside.end
      : before
        ? undefined
        : lastBefore(pauses, prevSpeechEnd - 0.1, Math.min(start + PAUSE_SNAP_LATE, nextStart));
    // 3. A short dip right around whisper's estimate.
    const dipOnset =
      pauseOnset === undefined && !before
        ? lastBefore(dips, Math.max(prevSpeechEnd - 0.1, start - DIP_SNAP_EARLY), Math.min(start + DIP_SNAP_LATE, nextStart))
        : undefined;
    // 4. Connected speech: the energy valley between this word and the previous one.
    const valley =
      pauseOnset === undefined && dipOnset === undefined && !before
        ? valleyOnset(
            energy,
            Math.max(prevStart + 0.05, start - VALLEY_SEARCH),
            Math.min(nextStart - 0.03, start + VALLEY_SEARCH),
          )
        : undefined;
    // A word misplaced into a silence it precedes can only have started before that silence.
    const estimate = before ? Math.min(start, before.start - 0.05) : start;
    const measuredStart = Math.max(pauseOnset ?? dipOnset ?? valley ?? estimate, prevStart);

    // End: if whisper's end falls inside a silence, speech ended where it began.
    // Otherwise the first pause starting after the word's last spoken token begins
    // (not a pause inside "262 thousand, 481"), no later than just after whisper's end.
    const lastFrom = Math.max(measuredStart, w.lastFrom);
    const endInside = pauses.find((p) => end > p.start && end <= p.end + 0.05 && p.start > measuredStart);
    const offset =
      endInside?.start ?? pauses.find((p) => p.start > lastFrom && p.start <= end + END_SNAP_LATE)?.start;

    words.push({
      text: w.text,
      start: measuredStart,
      end: offset ?? end,
      startSource:
        pauseOnset !== undefined
          ? "pause"
          : dipOnset !== undefined
            ? "dip"
            : valley !== undefined
              ? "valley"
              : "whisper",
      measuredEnd: offset !== undefined,
    });
    if (w.end !== null) prevSpeechEnd = offset ?? end;
    prevStart = measuredStart;
  });
  return words;
};

/**
 * Whisper writes "$5,000" where the script says "five thousand" (no "dollars"),
 * and the reverse, so the word "dollars" is ignored on both sides when matching.
 * Numbers are collapsed before this, and tokens keep their word indices (timing).
 */
export const forMatching = (tokens: Token[]): Token[] => tokens.filter((t) => t.text !== "dollars" && t.text !== "dollar");

/** Every word of a transcript, timed against the audio file it came from. */
export const timedWords = (json: WhisperJson, audioFile: string): TimedWord[] =>
  loadWords(json, readPauses(audioFile, PAUSE), readPauses(audioFile, DIP), readEnergy(audioFile));
