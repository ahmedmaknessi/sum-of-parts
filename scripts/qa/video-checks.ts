/**
 * QA on the rendered video file (BUILD spec Phase 5, checks 5 and 6, plus the mix).
 *
 *   npx tsx scripts/qa/video-checks.ts 100-a-month-40-years out/100-a-month-40-years.mp4
 *
 * - Empty frames: decodes every frame; no run of pure background (navy + grid)
 *   longer than 0.5s.
 * - Duration: the file matches timeline.json (audio timeline + end card).
 * - Audio: the voiceover ends before the end card; integrated loudness and
 *   true peak of the final mix.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
const file = process.argv[3];
if (!slug || !file) throw new Error("Usage: npx tsx scripts/qa/video-checks.ts <video-slug> <video.mp4>");

const timeline = JSON.parse(
  readFileSync(path.join(process.cwd(), "src", "videos", slug, "timeline.json"), "utf8"),
) as {
  fps: number;
  totalFrames: number;
  audioSegments: { atFrame: number; fromFrame: number; toFrame: number }[];
  scenes: { id: string; startFrame: number }[];
};
const mix = JSON.parse(readFileSync(path.join(process.cwd(), "src", "videos", slug, "audio-mix.json"), "utf8")) as {
  targetLufs: number;
  ceilingDbtp: number;
};
const { fps, totalFrames } = timeline;

/** Decoding size: big enough that 36px text survives the downscale. */
const W = 480;
const H = 270;
const NAVY = [0x10, 0x16, 0x2b];
const CONTENT_THRESHOLD = 30;
const MIN_CONTENT_PIXELS = 12;
const MAX_EMPTY_FRAMES = Math.round(0.5 * fps);

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`  FAIL ${msg}`);
};
const ok = (msg: string) => console.log(`  ok   ${msg}`);
const fmt = (frame: number) => `${Math.floor(frame / fps / 60)}:${((frame / fps) % 60).toFixed(2).padStart(5, "0")}`;

const probe = (args: string[]) => spawnSync("ffprobe", ["-v", "error", ...args, file], { encoding: "utf8" }).stdout.trim();

// ---------------------------------------------------------------------------
// Duration and streams
// ---------------------------------------------------------------------------
console.log("\nDuration and streams");
const duration = Number(probe(["-show_entries", "format=duration", "-of", "csv=p=0"]));
const expected = totalFrames / fps;
const video = probe(["-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,pix_fmt,r_frame_rate", "-of", "csv=p=0"]);
const audio = probe(["-select_streams", "a:0", "-show_entries", "stream=codec_name,bit_rate,sample_rate", "-of", "csv=p=0"]);
console.log(`  video: ${video} | audio: ${audio}`);
if (Math.abs(duration - expected) <= 1 / fps + 0.05) ok(`duration ${duration.toFixed(3)}s = timeline ${expected.toFixed(3)}s (${totalFrames} frames)`);
else fail(`duration ${duration.toFixed(3)}s, timeline says ${expected.toFixed(3)}s`);

const endCard = timeline.scenes[timeline.scenes.length - 1];
const voiceEnd = timeline.audioSegments.reduce((m, s) => Math.max(m, s.atFrame + s.toFrame - s.fromFrame), 0);
if (voiceEnd <= endCard.startFrame) ok(`voiceover ends at ${fmt(voiceEnd)}, before the end card at ${fmt(endCard.startFrame)}`);
else fail(`voiceover runs into the end card (${fmt(voiceEnd)} > ${fmt(endCard.startFrame)})`);

// ---------------------------------------------------------------------------
// Loudness of the final mix
// ---------------------------------------------------------------------------
console.log("\nLoudness of the final mix");
const ln = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"], {
  encoding: "utf8",
}).stderr;
const loud = JSON.parse(ln.slice(ln.lastIndexOf("{"), ln.lastIndexOf("}") + 1)) as Record<string, string>;
const lufs = Number(loud.input_i);
const tp = Number(loud.input_tp);
if (Math.abs(lufs - mix.targetLufs) <= 1) ok(`integrated ${lufs} LUFS (target ${mix.targetLufs})`);
else fail(`integrated ${lufs} LUFS, target ${mix.targetLufs}`);
if (tp <= mix.ceilingDbtp + 0.5) ok(`true peak ${tp} dBTP (ceiling ${mix.ceilingDbtp})`);
else fail(`true peak ${tp} dBTP over the ${mix.ceilingDbtp} ceiling`);

// ---------------------------------------------------------------------------
// Empty frames (every frame)
// ---------------------------------------------------------------------------
console.log(`\nEmpty frames (pure background longer than ${MAX_EMPTY_FRAMES} frames = 0.5s)`);
const frameBytes = W * H * 3;
const decode = spawn("ffmpeg", ["-v", "error", "-i", file, "-vf", `scale=${W}:${H}:flags=area`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
let buffer = Buffer.alloc(0);
let frame = 0;
let runStart = -1;
const runs: [number, number][] = [];
const closeRun = (end: number) => {
  if (runStart >= 0 && end - runStart > MAX_EMPTY_FRAMES) runs.push([runStart, end]);
  runStart = -1;
};
decode.stdout.on("data", (chunk: Buffer) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (buffer.length >= frameBytes) {
    const px = buffer.subarray(0, frameBytes);
    let content = 0;
    for (let i = 0; i < frameBytes && content < MIN_CONTENT_PIXELS; i += 3) {
      const d = Math.max(Math.abs(px[i] - NAVY[0]), Math.abs(px[i + 1] - NAVY[1]), Math.abs(px[i + 2] - NAVY[2]));
      if (d > CONTENT_THRESHOLD) content++;
    }
    if (content < MIN_CONTENT_PIXELS) {
      if (runStart < 0) runStart = frame;
    } else {
      closeRun(frame);
    }
    frame++;
    buffer = buffer.subarray(frameBytes);
  }
});
decode.on("close", () => {
  closeRun(frame);
  if (frame !== totalFrames) fail(`decoded ${frame} frames, expected ${totalFrames}`);
  else ok(`decoded all ${frame} frames`);
  if (runs.length === 0) ok("no run of empty background longer than 0.5s");
  for (const [a, b] of runs) fail(`empty background ${fmt(a)} to ${fmt(b)} (${((b - a) / fps).toFixed(2)}s)`);
  console.log(failures === 0 ? "\nVIDEO QA: all checks passed" : `\nVIDEO QA: ${failures} problem(s)`);
  process.exit(failures === 0 ? 0 : 1);
});
