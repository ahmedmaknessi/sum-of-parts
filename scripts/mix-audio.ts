/**
 * Voiceover loudness for a video (BUILD spec Phase 4).
 *
 *   npx tsx scripts/mix-audio.ts 100-a-month-40-years
 *
 * Measures the voiceover with ffmpeg loudnorm and works out the gain that
 * brings it to TARGET_LUFS. That gain is applied in Remotion (<Audio volume>).
 * The source mp3 is never modified. If the gain would push peaks past
 * CEILING_DBTP, a peak-limited copy (voiceover-mix.wav) is written first and
 * used instead: the limiter only touches the few peaks that would clip.
 *
 * Writes src/videos/<slug>/audio-mix.json, read by the video composition.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

const TARGET_LUFS = -16;
/** True-peak ceiling after the gain. */
const CEILING_DBTP = -1.5;
/** Extra margin for the limiter, which works on sample peaks rather than true peaks. */
const LIMITER_MARGIN_DB = 0.5;

const slug = process.argv[2];
if (!slug) {
  throw new Error("Usage: npx tsx scripts/mix-audio.ts <video-slug>");
}
const publicDir = path.join(process.cwd(), "public");
const sourceRel = `audio/${slug}/voiceover.mp3`;
const mixRel = `audio/${slug}/voiceover-mix.wav`;

type Loudness = { i: number; tp: number; lra: number };

const ffmpeg = (args: string[]) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`ffmpeg failed: ${r.stderr}`);
  }
  return r.stderr;
};

/**
 * Integrated loudness (LUFS), true peak (dBTP), loudness range, optionally after a gain.
 * Measured in stereo, as delivered: the video plays the mono voiceover on both
 * channels, which reads 3 dB louder than the mono file on its own.
 */
const measure = (file: string, gainDb = 0): Loudness => {
  const filters = ["pan=stereo|c0=c0|c1=c0", gainDb !== 0 ? `volume=${gainDb.toFixed(3)}dB` : null, "loudnorm=print_format=json"]
    .filter(Boolean)
    .join(",");
  const out = ffmpeg(["-i", file, "-af", filters, "-f", "null", "-"]);
  const json = JSON.parse(out.slice(out.lastIndexOf("{"), out.lastIndexOf("}") + 1)) as Record<string, string>;
  return { i: Number(json.input_i), tp: Number(json.input_tp), lra: Number(json.input_lra) };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const main = () => {
  const source = path.join(publicDir, sourceRel);
  const original = measure(source);
  let gainDb = TARGET_LUFS - original.i;
  let file = sourceRel;
  let limiter: { ceilingDb: number } | null = null;

  if (original.tp + gainDb > CEILING_DBTP) {
    // Limit the copy so that, after the gain, peaks land under the ceiling. Limiting
    // shaves a little loudness, which raises the gain, so repeat until both settle.
    file = mixRel;
    for (let pass = 0; pass < 4; pass++) {
      const ceilingDb = CEILING_DBTP - LIMITER_MARGIN_DB - gainDb;
      ffmpeg([
        "-y",
        "-i",
        source,
        "-af",
        `alimiter=limit=${(10 ** (ceilingDb / 20)).toFixed(4)}:attack=1:release=60:level=disabled`,
        "-c:a",
        "pcm_s24le",
        path.join(publicDir, mixRel),
      ]);
      limiter = { ceilingDb: round2(ceilingDb) };
      const nextGain = TARGET_LUFS - measure(path.join(publicDir, mixRel)).i;
      const settled = Math.abs(nextGain - gainDb) < 0.02;
      gainDb = nextGain;
      if (settled) break;
    }
  }

  const result = measure(path.join(publicDir, file), gainDb);
  const mix = {
    source: sourceRel,
    file,
    targetLufs: TARGET_LUFS,
    ceilingDbtp: CEILING_DBTP,
    original: { lufs: original.i, truePeakDbtp: original.tp, lra: original.lra },
    limiter,
    voiceGainDb: round2(gainDb),
    /** Linear factor for <Audio volume>. */
    voiceVolume: Math.round(10 ** (gainDb / 20) * 10000) / 10000,
    expected: { lufs: result.i, truePeakDbtp: result.tp },
  };
  const outPath = path.join(process.cwd(), "src", "videos", slug, "audio-mix.json");
  writeFileSync(outPath, JSON.stringify(mix, null, 2) + "\n");

  console.log(`Original:  ${original.i} LUFS, ${original.tp} dBTP`);
  if (limiter) console.log(`Limiter:   peaks capped at ${limiter.ceilingDb} dBFS in ${mixRel} (source untouched)`);
  console.log(`Gain:      ${mix.voiceGainDb >= 0 ? "+" : ""}${mix.voiceGainDb} dB (volume ${mix.voiceVolume})`);
  console.log(`Expected:  ${result.i} LUFS, ${result.tp} dBTP`);
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
};

main();
