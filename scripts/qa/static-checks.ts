/**
 * Static QA for a video's scene code (BUILD spec Phase 5, checks 2, 3, 4).
 *
 *   npx tsx scripts/qa/static-checks.ts 100-a-month-40-years
 *
 * 1. Hardcoded numbers: digits inside on-screen text (JSX text or string
 *    literals) in scenes/ and parts/. Every displayed number must come from data.ts.
 * 2. Text size: every literal fontSize >= 36 in the video and shared components.
 * 3. Colors: no hex or rgb() color outside src/brand/tokens.ts.
 * 4. Cue timing: for each cue in timeline.json, the earliest event a scene ties
 *    to it (cue + offset in code) must be within 3 frames of the spoken word.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug) throw new Error("Usage: npx tsx scripts/qa/static-checks.ts <video-slug>");

const root = process.cwd();
const videoDir = path.join(root, "src", "videos", slug);
const list = (dir: string) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .filter((f) => !f.endsWith(".test.ts"))
    .map((f) => path.join(dir, f));
const sceneFiles = list(path.join(videoDir, "scenes"));
const partFiles = list(path.join(videoDir, "parts"));
const componentFiles = list(path.join(root, "src", "components"));
const rel = (f: string) => path.relative(root, f).replace(/\\/g, "/");
const lineOf = (src: string, index: number) => src.slice(0, index).split("\n").length;

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`  FAIL ${msg}`);
};

// ---------------------------------------------------------------------------
// 1. Hardcoded numbers in on-screen text
// ---------------------------------------------------------------------------
console.log("\n1. Hardcoded numbers in on-screen text (scenes/, parts/)");
let numberHits = 0;
/** Source with comments blanked out (same length, so line numbers stay right). */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (c) => c.replace(/[^\n]/g, " "));

for (const file of [...sceneFiles, ...partFiles]) {
  const src = stripComments(readFileSync(file, "utf8"));
  // JSX text between > and < that contains a digit (skipping code like "a > 0 && b < c").
  for (const m of src.matchAll(/>([^<>{}\n]*\d[^<>{}\n]*)</g)) {
    if (/&&|\|\||[=()]/.test(m[1])) continue;
    numberHits++;
    fail(`${rel(file)}:${lineOf(src, m.index ?? 0)} JSX text "${m[1].trim()}"`);
  }
  // String literals with $, % or a thousands-style number, outside of CSS/SVG values.
  for (const m of src.matchAll(/(["'`])((?:(?!\1).)*?(?:\$\d|\d%|\d,\d{3})(?:(?!\1).)*?)\1/g)) {
    const text = m[2];
    if (/^[\d\s.%-]+$/.test(text) || /px|deg|em\b|scale|translate|path|url|#/.test(text)) continue;
    numberHits++;
    fail(`${rel(file)}:${lineOf(src, m.index ?? 0)} string "${text}"`);
  }
}
if (numberHits === 0) console.log("  ok   no digits in on-screen text: every number comes from data.ts / timeline");

// ---------------------------------------------------------------------------
// 2. Text size
// ---------------------------------------------------------------------------
console.log("\n2. Text size (literal fontSize values, video + shared components)");
let small = 0;
for (const file of [...sceneFiles, ...partFiles, ...componentFiles]) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/fontSize[=:]\s*\{?\s*(\d+(?:\.\d+)?)/g)) {
    if (Number(m[1]) < 36) {
      small++;
      fail(`${rel(file)}:${lineOf(src, m.index ?? 0)} fontSize ${m[1]}`);
    }
  }
}
const tokens = readFileSync(path.join(root, "src", "brand", "tokens.ts"), "utf8");
const typeBlock = tokens.slice(tokens.indexOf("export const TYPE"), tokens.indexOf("} as const", tokens.indexOf("export const TYPE")));
for (const m of typeBlock.matchAll(/(\w+):\s*(\d+)/g)) {
  if (Number(m[2]) < 36) {
    small++;
    fail(`tokens.ts TYPE.${m[1]} = ${m[2]}`);
  }
}
if (small === 0) console.log("  ok   no literal font size under 36px (TYPE scale minimum is 36)");

// ---------------------------------------------------------------------------
// 3. Colors
// ---------------------------------------------------------------------------
console.log("\n3. Colors outside the brand tokens");
let colorHits = 0;
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.match(/\.tsx?$/) ? [path.join(dir, e.name)] : [],
  );
for (const file of walk(path.join(root, "src"))) {
  if (file.endsWith(path.join("brand", "tokens.ts"))) continue;
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g)) {
    // Allow "#" in SVG url(#id) references and template ids.
    const around = src.slice(Math.max(0, (m.index ?? 0) - 5), (m.index ?? 0) + 1);
    if (around.includes("url(")) continue;
    colorHits++;
    fail(`${rel(file)}:${lineOf(src, m.index ?? 0)} ${m[0]}`);
  }
}
if (colorHits === 0) console.log("  ok   every color comes from src/brand/tokens.ts");

// ---------------------------------------------------------------------------
// 4. Cue timing
// ---------------------------------------------------------------------------
console.log("\n4. Cue timing: earliest event per cue vs the spoken word (tolerance 3 frames)");
type SceneJson = { id: string; startFrame: number; cues: Record<string, number> };
const timeline = JSON.parse(readFileSync(path.join(videoDir, "timeline.json"), "utf8")) as { scenes: SceneJson[] };
const rows: { scene: string; cue: string; expected: number; actual: number | null; diff: number | null }[] = [];

for (const file of sceneFiles) {
  const src = readFileSync(file, "utf8");
  const sceneId = src.match(/sceneTiming\("([^"]+)"\)/)?.[1];
  if (!sceneId) continue;
  const scene = timeline.scenes.find((s) => s.id === sceneId);
  if (!scene) continue;

  // alias -> cue names (single, or array like bars: [T.cue("bar1"), ...])
  const aliases = new Map<string, string[]>();
  for (const m of src.matchAll(/(\w+):\s*T\.cue\("(\w+)"\)/g)) aliases.set(m[1], [m[2]]);
  for (const m of src.matchAll(/(\w+):\s*\[((?:\s*T\.cue\("\w+"\),?)+)\s*\]/g)) {
    aliases.set(m[1], [...m[2].matchAll(/T\.cue\("(\w+)"\)/g)].map((x) => x[1]));
  }

  // Earliest offset used with each alias: cue.alias, cue.alias + N, cue.alias - N, cue.alias[i]
  const minOffset = new Map<string, number>();
  for (const m of src.matchAll(/cue\.(\w+)(\[[^\]]+\])?(\s*([+-])\s*(\d+))?/g)) {
    // "frame - cue.x - 20" subtracts from the frame: it is not an event before the cue.
    const subtracted = src.slice(0, m.index).trimEnd().endsWith("-");
    const offset = m[3] && !subtracted ? (m[4] === "-" ? -1 : 1) * Number(m[5]) : 0;
    const prev = minOffset.get(m[1]);
    minOffset.set(m[1], prev === undefined ? offset : Math.min(prev, offset));
  }

  for (const [cueName, frame] of Object.entries(scene.cues)) {
    const alias = [...aliases.entries()].find(([, names]) => names.includes(cueName))?.[0];
    const offset = alias !== undefined ? minOffset.get(alias) : undefined;
    const actual = offset === undefined ? null : frame + offset;
    rows.push({ scene: sceneId, cue: cueName, expected: frame, actual, diff: actual === null ? null : actual - frame });
  }
}

console.log("  scene                    cue                 expected  actual  diff");
for (const r of rows) {
  const ok = r.diff !== null && Math.abs(r.diff) <= 3;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${r.scene.padEnd(22)} ${r.cue.padEnd(19)} ${String(r.expected).padStart(8)}  ${String(r.actual ?? "unused").padStart(6)}  ${r.diff === null ? "  -" : (r.diff >= 0 ? "+" : "") + r.diff}`,
  );
}
console.log(`  ${rows.length} cues checked`);

console.log(failures === 0 ? "\nSTATIC QA: all checks passed" : `\nSTATIC QA: ${failures} problem(s)`);
process.exit(failures === 0 ? 0 : 1);
