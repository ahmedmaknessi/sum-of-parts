/**
 * Builds a video's music bed and sound-effects track, aligned to its timeline,
 * so the composition plays three files: voice, music, sfx.
 *
 *   npx tsx scripts/build-audio.ts <video-slug>      (npm run audio -- <slug>)
 *
 * Reads  src/videos/<slug>/sfx.ts      SFX_EVENTS (sound = path under public/sfx/)
 *        src/videos/<slug>/music.ts    MUSIC + MUSIC_SECTIONS (optional)
 *        src/videos/<slug>/timeline.json, audio-mix.json (voice, for ducking and peaks)
 * Writes public/audio/<slug>/sfx-track.wav   (mono)
 *        public/audio/<slug>/music-bed.wav   (stereo, if the video has music)
 *
 * The music loops with a crossfade, switches arrangement per section (full /
 * thin stems / sparse stem) with crossfades, ducks under the voice, and fades
 * out at the end. Music and sfx are pulled down together wherever voice +
 * music + sfx would pass the sample-peak ceiling.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readWavMono, SAMPLE_RATE, silence, writeWav, type Signal } from "./lib/synth";

const slug = process.argv[2];
if (!slug) throw new Error("Usage: npx tsx scripts/build-audio.ts <video-slug>");
const videoDir = path.join(process.cwd(), "src", "videos", slug);

type Timeline = {
  fps: number;
  totalFrames: number;
  audioSegments: { fromFrame: number; toFrame: number; atFrame: number }[];
};
type MusicMode = "full" | "thin" | "sparse" | "open";
type MusicConfig = {
  files: { full: string; thin: string[]; sparse: string[] };
  targetLufs: number;
  duckDb: number;
  modeDb: Record<MusicMode, number>;
  crossfadeSec: number;
  fadeOutSec: number;
};

const db = (x: number) => 20 * Math.log10(Math.max(x, 1e-9));
const fromDb = (d: number) => 10 ** (d / 20);

/** Decodes any audio file to Float32 channels at SAMPLE_RATE. */
const decode = (file: string, channels: 1 | 2): Float32Array[] => {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-ac", String(channels), "-ar", String(SAMPLE_RATE), "-f", "f32le", "-"], {
    maxBuffer: 2 ** 31,
  });
  if (r.status !== 0) throw new Error(`ffmpeg could not decode ${file}`);
  const all = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength / 4);
  const n = all.length / channels;
  return Array.from({ length: channels }, (_, c) => {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = all[i * channels + c];
    return out;
  });
};

/** Integrated loudness (LUFS) of stereo channels, via ffmpeg's ebur128. */
const lufs = (ch: Float32Array[]): number => {
  const n = ch[0].length;
  const inter = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    inter[i * 2] = ch[0][i];
    inter[i * 2 + 1] = ch[1][i];
  }
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-f", "f32le", "-ar", String(SAMPLE_RATE), "-ac", "2", "-i", "-", "-af", "ebur128", "-f", "null", "-"], {
    input: Buffer.from(inter.buffer),
    maxBuffer: 1 << 28,
  });
  const m = String(r.stderr).match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/);
  if (!m) throw new Error("could not measure loudness");
  return Number(m[1]);
};

const main = async () => {
  const timeline = JSON.parse(readFileSync(path.join(videoDir, "timeline.json"), "utf8")) as Timeline;
  const mix = JSON.parse(readFileSync(path.join(videoDir, "audio-mix.json"), "utf8")) as { file: string; voiceVolume: number };
  const total = Math.round((timeline.totalFrames / timeline.fps) * SAMPLE_RATE);
  const spf = SAMPLE_RATE / timeline.fps;

  // --- Voice, aligned exactly as the composition plays it ---------------------
  const [voiceSrc] = decode(path.join("public", mix.file), 1);
  const voice = new Float32Array(total);
  for (const seg of timeline.audioSegments) {
    const from = Math.round(seg.fromFrame * spf);
    const to = Math.round(seg.toFrame * spf);
    const at = Math.round(seg.atFrame * spf);
    for (let i = 0; i < to - from && at + i < total; i++) voice[at + i] = (voiceSrc[from + i] ?? 0) * mix.voiceVolume;
  }

  // --- Sound effects --------------------------------------------------------------
  const { SFX_EVENTS } = (await import(pathToFileURL(path.join(videoDir, "sfx.ts")).href)) as {
    SFX_EVENTS: readonly { sound: string; frame: number; volume: number; rate?: number }[];
  };
  const cache = new Map<string, Signal>();
  const sfx = silence(total / SAMPLE_RATE);
  for (const e of SFX_EVENTS) {
    if (!cache.has(e.sound)) cache.set(e.sound, readWavMono(path.join("public", "sfx", `${e.sound}.wav`)));
    const src = cache.get(e.sound)!;
    const rate = e.rate ?? 1;
    const start = Math.round(e.frame * spf);
    const len = Math.floor((src.length - 1) / rate);
    for (let i = 0; i < len && start + i < total; i++) {
      if (start + i < 0) continue;
      const p = i * rate;
      const k = Math.floor(p);
      sfx[start + i] += (src[k] + (src[k + 1] - src[k]) * (p - k)) * e.volume;
    }
  }

  // --- Music ----------------------------------------------------------------------
  let music: Float32Array[] | null = null;
  const musicPath = path.join(videoDir, "music.ts");
  if (existsSync(musicPath)) {
    const mod = (await import(pathToFileURL(musicPath).href)) as {
      MUSIC: MusicConfig;
      MUSIC_SECTIONS: readonly (readonly [number, MusicMode])[];
    };
    const cfg = mod.MUSIC;
    const sumOf = (files: string[]) => {
      const parts = files.map((f) => decode(path.join("public", f), 2));
      const n = Math.min(...parts.map((p) => p[0].length));
      return [0, 1].map((c) => {
        const out = new Float32Array(n);
        for (const p of parts) for (let i = 0; i < n; i++) out[i] += p[c][i];
        return out;
      });
    };
    const sources: Record<"full" | "thin" | "sparse", Float32Array[]> = {
      full: decode(path.join("public", cfg.files.full), 2),
      thin: sumOf(cfg.files.thin),
      sparse: sumOf(cfg.files.sparse),
    };
    // Each arrangement at its own loudness relative to the full mix.
    const fullLufs = lufs(sources.full);
    const level = {
      full: 1,
      thin: fromDb(fullLufs - lufs(sources.thin)),
      sparse: fromDb(fullLufs - lufs(sources.sparse)),
    };
    // Loop with a crossfade: period L' = L - X; the first X seconds blend in the tail.
    const X = Math.round(cfg.crossfadeSec * SAMPLE_RATE);
    const sample = (src: Float32Array[], c: number, t: number) => {
      const L = Math.min(sources.full[0].length, sources.thin[0].length, sources.sparse[0].length) - X;
      const q = t % L;
      const x = src[c];
      if (q < X) {
        const g = q / X;
        return x[q] * Math.sqrt(g) + x[L + q] * Math.sqrt(1 - g);
      }
      return x[q];
    };
    // Section weights with crossfades at every switch.
    const sections = mod.MUSIC_SECTIONS.map(([f, m]) => [Math.round(f * spf), m] as const);
    const modeAt = (t: number): { mode: MusicMode; w: number; prev: MusicMode } => {
      let k = 0;
      while (k + 1 < sections.length && sections[k + 1][0] <= t) k++;
      const [start, mode] = sections[k];
      const prev = k > 0 ? sections[k - 1][1] : mode;
      const w = Math.min(1, (t - start) / X);
      return { mode, w, prev };
    };
    const srcOf = (m: MusicMode) => (m === "open" ? "full" : m) as "full" | "thin" | "sparse";
    const gainOf = (m: MusicMode) => level[srcOf(m)] * fromDb(cfg.modeDb[m]);

    const bed = [new Float32Array(total), new Float32Array(total)];
    for (let t = 0; t < total; t++) {
      const { mode, w, prev } = modeAt(t);
      for (let c = 0; c < 2; c++) {
        const a = sample(sources[srcOf(mode)], c, t) * gainOf(mode);
        const b = w < 1 ? sample(sources[srcOf(prev)], c, t) * gainOf(prev) : 0;
        bed[c][t] = a * Math.sqrt(w) + b * Math.sqrt(1 - w);
      }
    }
    // Level the bed to its target loudness (before ducking).
    const g = fromDb(cfg.targetLufs - lufs(bed));
    // Duck under the voice: 30 ms RMS, fast attack, slow release; not in "open" sections.
    const win = Math.round(0.03 * SAMPLE_RATE);
    let acc = 0;
    let duck = 1;
    const attack = 1 / (0.08 * SAMPLE_RATE);
    const release = 1 / (0.5 * SAMPLE_RATE);
    const duckGain = fromDb(-cfg.duckDb);
    const fadeIn = Math.round(0.3 * SAMPLE_RATE);
    const fadeOut = Math.round(cfg.fadeOutSec * SAMPLE_RATE);
    for (let t = 0; t < total; t++) {
      acc += voice[t] * voice[t] - (t >= win ? voice[t - win] * voice[t - win] : 0);
      const speaking = db(Math.sqrt(Math.max(acc, 0) / win)) > -42 && modeAt(t).mode !== "open";
      const target = speaking ? duckGain : 1;
      duck += (target - duck) * (target < duck ? attack * 6 : release * 2);
      const edge = Math.min(1, t / fadeIn, (total - t) / fadeOut);
      for (let c = 0; c < 2; c++) bed[c][t] *= g * duck * edge;
    }
    music = bed;
    console.log(`music: full ${fullLufs.toFixed(1)} LUFS source, bed levelled to ${cfg.targetLufs} LUFS, ducked ${cfg.duckDb} dB under the voice`);
  }

  // --- Peak safety on voice + music + sfx ---------------------------------------------
  const CEILING = fromDb(-2.5);
  const HOLD = Math.round(0.005 * SAMPLE_RATE);
  const RELEASE = 0.08 * SAMPLE_RATE;
  const allowed = new Float32Array(total).fill(1);
  for (let t = 0; t < total; t++) {
    for (let c = 0; c < (music ? 2 : 1); c++) {
      const bed = (music ? music[c][t] : 0) + sfx[t];
      const v = voice[t];
      if (bed === 0 || Math.abs(v + bed) <= CEILING) continue;
      allowed[t] = Math.min(allowed[t], Math.max(0, Math.min(1, (Math.sign(bed) * CEILING - v) / bed)));
    }
  }
  let gl = 1;
  let ducked = 0;
  let peak = 0;
  for (let t = 0; t < total; t++) {
    let target = 1;
    for (let k = Math.max(0, t - HOLD); k <= Math.min(total - 1, t + HOLD); k++) target = Math.min(target, allowed[k]);
    gl = target < gl ? target : gl + (target - gl) / RELEASE;
    if (gl < 0.99) ducked++;
    sfx[t] *= gl;
    if (music) {
      music[0][t] *= gl;
      music[1][t] *= gl;
    }
    for (let c = 0; c < (music ? 2 : 1); c++) peak = Math.max(peak, Math.abs(voice[t] + (music ? music[c][t] : 0) + sfx[t]));
  }

  const outDir = path.join("public", "audio", slug);
  writeWav(path.join(outDir, "sfx-track.wav"), [sfx]);
  if (music) writeWav(path.join(outDir, "music-bed.wav"), music);
  console.log(`sfx: ${SFX_EVENTS.length} events`);
  console.log(`voice + music + sfx sample peak ${db(peak).toFixed(1)} dBFS; pulled down ${((ducked / SAMPLE_RATE) * 1000).toFixed(0)} ms in total`);
  console.log(`wrote ${outDir}/sfx-track.wav${music ? " and music-bed.wav" : ""}`);
};

void main();
