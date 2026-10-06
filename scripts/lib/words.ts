/**
 * Word normalization shared by the timeline builder and the subtitle export.
 *
 * Whisper and the script write the same speech differently ("$100" vs
 * "one hundred dollars", "7%" vs "seven percent"). Both sides are turned into
 * the same token stream: lowercase, no punctuation, number words collapsed into
 * digits, "$N" expanded to "N dollars", "%" expanded to "percent".
 */

export type SourceWord = {
  readonly text: string;
  /** Seconds. */
  readonly start: number;
  readonly end: number;
};

export type Token = {
  readonly text: string;
  /** Index of the first and last source word this token came from. */
  readonly firstWord: number;
  readonly lastWord: number;
};

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = {
  thousand: 1_000, million: 1_000_000, billion: 1_000_000_000,
};

type RawToken = { text: string; word: number };

/** Marks the end of a sentence or clause; numbers never continue across it. */
const BREAK = "\u0000";

/** Splits one source word into raw lowercase pieces. */
const splitWord = (text: string, word: number): RawToken[] => {
  let t = text.toLowerCase();
  t = t.replace(/[’']/g, ""); // let's -> lets
  t = t.replace(/(\d),(?=\d{3}\b)/g, "$1"); // 262,481 -> 262481
  const isDollar = /\$\s*\d/.test(t);
  // Fractions Whisper writes as digits: 3/4 is spoken "three quarters"
  t = t.replace(/\b(\d)\/(\d)\b/g, (_, n: string, d: string) => {
    const name: Record<string, string> = { "2": "half", "3": "third", "4": "quarter", "5": "fifth" };
    return name[d] ? ` ${n} ${name[d]}${n === "1" ? "" : "s"} ` : `${n} ${d}`;
  });
  t = t.replace(/%/g, " percent ");
  t = t.replace(/[^a-z0-9.]+/g, " "); // hyphens, $, &, punctuation
  t = t.replace(/(?<!\d)\.|\.(?!\d)/g, " "); // keep decimal points only
  // "fifty-two thousand. Thirty years" is two numbers, not 52030. Commas don't
  // break: "two hundred and sixty-two thousand, four hundred and eighty-one".
  const endsClause = /[.:;?!]["\u201d)]*$/.test(text);
  const pieces = t.split(/\s+/).filter(Boolean);
  const out: RawToken[] = [];
  for (const p of pieces) {
    out.push({ text: p, word });
    // "$262481" is spoken "262481 dollars"
    if (isDollar && /^\d/.test(p) && !out.some((o) => o.text === "dollars")) {
      out.push({ text: "dollars", word });
    }
  }
  if (endsClause) out.push({ text: BREAK, word });
  return out;
};

const kind = (t: string) =>
  /^\d+(\.\d+)?$/.test(t)
    ? "digits"
    : t in SMALL
      ? "small"
      : t in TENS
        ? "tens"
        : t === "hundred"
          ? "hundred"
          : t in SCALES
            ? "scale"
            : "word";

/** Collapses runs of number words ("two hundred and sixty two thousand") into digits. */
const collapseNumbers = (raw: RawToken[]): Token[] => {
  const tokens: Token[] = [];
  let total = 0;
  let current = 0;
  let first = -1;
  let last = -1;
  let lastKind: string | null = null;

  const flush = () => {
    if (lastKind !== null) {
      tokens.push({ text: String(total + current), firstWord: first, lastWord: last });
    }
    total = 0;
    current = 0;
    lastKind = null;
  };

  for (let i = 0; i < raw.length; i++) {
    const { text, word } = raw[i];
    if (text === BREAK) {
      flush();
      continue;
    }
    const k = kind(text);
    const start = () => {
      flush();
      first = word;
    };

    if (k === "digits") {
      if (lastKind !== null) flush();
      first = word;
      current = Number(text);
    } else if (k === "small" || k === "tens") {
      const v = k === "small" ? SMALL[text] : TENS[text];
      const continues =
        lastKind === "hundred" ||
        lastKind === "scale" ||
        lastKind === "and" ||
        (lastKind === "tens" && k === "small" && v < 10);
      if (!continues) start();
      current += v;
    } else if (k === "hundred") {
      if (lastKind === null) first = word;
      current = (current || 1) * 100;
    } else if (k === "scale") {
      if (lastKind === null) first = word;
      total += (current || 1) * SCALES[text];
      current = 0;
    } else if (
      text === "and" &&
      (lastKind === "hundred" || lastKind === "scale") &&
      i + 1 < raw.length &&
      ["small", "tens"].includes(kind(raw[i + 1].text))
    ) {
      last = word;
      lastKind = "and";
      continue;
    } else {
      flush();
      tokens.push({ text, firstWord: word, lastWord: word });
      continue;
    }
    last = word;
    lastKind = k;
  }
  flush();
  return tokens;
};

/** Normalizes a list of words into comparable tokens, keeping word indices. */
export const tokenize = (words: readonly string[]): Token[] =>
  collapseNumbers(words.flatMap((w, i) => splitWord(w, i)));

/** Finds `pattern` in `tokens` starting at `from` (before `to`). Returns the token index or -1. */
export const findTokens = (
  tokens: readonly Token[],
  pattern: readonly string[],
  from = 0,
  to = tokens.length,
): number => {
  for (let i = from; i + pattern.length <= to; i++) {
    if (pattern.every((p, j) => tokens[i + j].text === p)) {
      return i;
    }
  }
  return -1;
};

/** Best partial match, for reporting when an exact match fails. */
export const closestMatch = (
  tokens: readonly Token[],
  pattern: readonly string[],
  from: number,
  to: number,
): { index: number; score: number } => {
  let best = { index: from, score: -1 };
  for (let i = from; i + pattern.length <= to; i++) {
    const score = pattern.filter((p, j) => tokens[i + j].text === p).length;
    if (score > best.score) best = { index: i, score };
  }
  return best;
};

/** Splits plain text into words the same way for the script side. */
export const splitText = (text: string): string[] =>
  text.split(/\s+/).filter(Boolean);
