/**
 * Rendered-frame QA for a video (BUILD spec Phase 5, checks 3 and 4).
 *
 *   npx tsx scripts/qa/frame-checks.ts 100-a-month-40-years [CompositionId]
 *
 * Renders, in one pass: every scene start, every cue frame, and the frames
 * 1 before / 3 after each cue. Then checks on the actual pixels:
 * - safe margin: no content pixel within 96px of any edge;
 * - cue response: the picture visibly changes between cue-1 and cue+3
 *   (the event lands within 3 frames, 0.1s, of the spoken word).
 * Stills are kept in out/qa/<slug>/ for review.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
const composition = process.argv[3] ?? "Video01";
if (!slug) throw new Error("Usage: npx tsx scripts/qa/frame-checks.ts <video-slug> [CompositionId]");

const W = 1920;
const H = 1080;
const MARGIN = 96;
/** A pixel is content when a channel differs this much from the navy background (grid lines differ ~10). */
const CONTENT_THRESHOLD = 40;
/** A pixel counts as changed between two frames above this difference. */
const CHANGE_THRESHOLD = 16;
const MIN_CHANGED_PIXELS = 150;
const NAVY = [0x10, 0x16, 0x2b];

type SceneJson = { id: string; startFrame: number; cues: Record<string, number> };
const timeline = JSON.parse(
  readFileSync(path.join(process.cwd(), "src", "videos", slug, "timeline.json"), "utf8"),
) as { totalFrames: number; scenes: SceneJson[] };

const outDir = path.join(process.cwd(), "out", "qa", slug);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const cues = timeline.scenes.flatMap((s) => Object.entries(s.cues).map(([name, frame]) => ({ scene: s.id, name, frame })));
const frames = new Set<number>();
for (const s of timeline.scenes) frames.add(s.startFrame);
for (const c of cues) [c.frame - 1, c.frame, c.frame + 3].forEach((f) => frames.add(f));
const list = [...frames].filter((f) => f >= 0 && f < timeline.totalFrames).sort((a, b) => a - b);

// Rendered without audio: sparse image sequences can't mix it (and pixels are all we check).
const propsFile = path.join(outDir, "props.json");
writeFileSync(propsFile, JSON.stringify({ muted: true }));

console.log(`Rendering ${list.length} frames of ${composition}...`);
// Relative paths: the shell would split an absolute path containing spaces ("Sum of Parts").
const render = spawnSync(
  "npx",
  [
    "remotion",
    "render",
    composition,
    path.relative(process.cwd(), outDir),
    `--frames=${list.join(",")}`,
    "--image-format=png",
    `--props=${path.relative(process.cwd(), propsFile)}`,
    "--log=error",
  ],
  { stdio: "inherit", shell: true },
);
if (render.status !== 0) throw new Error("Render failed");

const digits = String(timeline.totalFrames - 1).length;
const fileFor = (f: number) => path.join(outDir, `element-${String(f).padStart(digits, "0")}.png`);
const pixels = new Map<number, Buffer>();
const rgb = (f: number) => {
  let px = pixels.get(f);
  if (!px) {
    px = execFileSync("ffmpeg", ["-v", "error", "-i", fileFor(f), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], {
      maxBuffer: 64 * 1024 * 1024,
    });
    pixels.set(f, px);
  }
  return px;
};

// Safe margin
let marginFails = 0;
console.log(`\nSafe margin (${MARGIN}px) on ${list.length} frames`);
for (const f of list) {
  const px = rgb(f);
  let hits = 0;
  let example = "";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x >= MARGIN && x < W - MARGIN && y >= MARGIN && y < H - MARGIN) continue;
      const i = (y * W + x) * 3;
      const d = Math.max(Math.abs(px[i] - NAVY[0]), Math.abs(px[i + 1] - NAVY[1]), Math.abs(px[i + 2] - NAVY[2]));
      if (d > CONTENT_THRESHOLD) {
        if (hits === 0) example = `(${x}, ${y})`;
        hits++;
      }
    }
  }
  if (hits > 0) {
    marginFails++;
    console.log(`  FAIL frame ${f}: ${hits} content pixels in the margin, first at ${example}`);
  }
}
if (marginFails === 0) console.log("  ok   no content inside the margin on any frame");

// Cue response
console.log("\nCue response: visible change between cue-1 and cue+3");
let cueFails = 0;
for (const c of cues) {
  const a = rgb(c.frame - 1);
  const b = rgb(c.frame + 3);
  let changed = 0;
  for (let i = 0; i < a.length; i += 3) {
    const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
    if (d > CHANGE_THRESHOLD) changed++;
  }
  const ok = changed >= MIN_CHANGED_PIXELS;
  if (!ok) cueFails++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${c.scene.padEnd(24)} ${c.name.padEnd(19)} f${String(c.frame).padEnd(6)} ${changed} px changed`);
}

console.log(
  marginFails + cueFails === 0
    ? `\nFRAME QA: all checks passed (stills in ${path.relative(process.cwd(), outDir)})`
    : `\nFRAME QA: ${marginFails} margin, ${cueFails} cue problem(s)`,
);
process.exit(marginFails + cueFails === 0 ? 0 : 1);
