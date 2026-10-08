/**
 * Mixes Video 01's sound-effect cue sheet (src/videos/100-a-month-40-years/sfx.ts)
 * into one track the length of the video, so Video01 plays a single <Audio>
 * instead of hundreds of tiny ones. Reads the voice mix (`npm run mix`) to keep
 * voice + sfx under the peak ceiling.
 *
 *   npx tsx scripts/build-sfx-track.ts
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { SAMPLE_RATE, readWavMono, silence, writeWav, type Signal } from "./lib/synth";
import MIX from "../src/videos/100-a-month-40-years/audio-mix.json";
import { SFX_EVENTS, SFX_SOUNDS, SFX_TRACK_FILE, SFX_TRACK_VOLUME } from "../src/videos/100-a-month-40-years/sfx";
import { TIMELINE } from "../src/videos/100-a-month-40-years/timeline";

const sounds = Object.fromEntries(
  SFX_SOUNDS.map((name) => [name, readWavMono(path.join("public", "sfx", `${name}.wav`))]),
) as Record<(typeof SFX_SOUNDS)[number], Signal>;

const track = silence(TIMELINE.totalFrames / TIMELINE.fps);
const samplesPerFrame = SAMPLE_RATE / TIMELINE.fps;

for (const e of SFX_EVENTS) {
  const src = sounds[e.sound];
  const rate = e.rate ?? 1;
  const start = Math.round(e.frame * samplesPerFrame);
  const length = Math.floor((src.length - 1) / rate);
  for (let i = 0; i < length && start + i < track.length; i++) {
    if (start + i < 0) continue;
    // Linear-interpolated resampling: rate > 1 plays faster and higher.
    const pos = i * rate;
    const k = Math.floor(pos);
    const t = pos - k;
    track[start + i] += (src[k] * (1 - t) + src[k + 1] * t) * e.volume;
  }
}

// ---------------------------------------------------------------------------
// Peak safety: line the voice up exactly as Video01 plays it, then pull the
// sfx down only where voice + sfx would pass the ceiling (a loud syllable
// under a thump). Everywhere else the sfx keep their full level.
// ---------------------------------------------------------------------------

const decoded = spawnSync(
  "ffmpeg",
  ["-v", "error", "-i", path.join("public", MIX.file), "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "f32le", "-"],
  { maxBuffer: 1 << 30 },
);
if (decoded.status !== 0) throw new Error(`ffmpeg could not decode ${MIX.file}; run \`npm run mix\` first`);
const voiceSrc = new Float32Array(decoded.stdout.buffer, decoded.stdout.byteOffset, decoded.stdout.byteLength / 4);

const voice = silence(TIMELINE.totalFrames / TIMELINE.fps);
for (const seg of TIMELINE.audioSegments) {
  const from = Math.round(seg.fromFrame * samplesPerFrame);
  const to = Math.round(seg.toFrame * samplesPerFrame);
  const at = Math.round(seg.atFrame * samplesPerFrame);
  for (let i = 0; i < to - from && at + i < voice.length; i++) voice[at + i] = (voiceSrc[from + i] ?? 0) * MIX.voiceVolume;
}

/** Sample-peak ceiling for voice + sfx; leaves room for inter-sample peaks and AAC. */
const CEILING = 10 ** (-2.5 / 20);
/** Hold each reduction this long either side, then release smoothly (no pumping clicks). */
const HOLD = Math.round(0.005 * SAMPLE_RATE);
const RELEASE = 0.06 * SAMPLE_RATE;

const allowed = new Float32Array(track.length).fill(1);
for (let i = 0; i < track.length; i++) {
  const s = track[i] * SFX_TRACK_VOLUME;
  const v = voice[i];
  if (s === 0 || Math.abs(v + s) <= CEILING) continue;
  // Largest gain g with |v + g*s| <= ceiling (0 if the voice alone is already at it).
  allowed[i] = Math.max(0, Math.min(1, (Math.sign(s) * CEILING - v) / s));
}
const gain = new Float32Array(track.length);
let g = 1;
let ducked = 0;
for (let i = 0; i < track.length; i++) {
  let target = 1;
  for (let k = Math.max(0, i - HOLD); k <= Math.min(track.length - 1, i + HOLD); k++) target = Math.min(target, allowed[k]);
  g = target < g ? target : g + (target - g) / RELEASE;
  gain[i] = g;
  if (g < 0.99) ducked++;
}
for (let i = 0; i < track.length; i++) track[i] *= gain[i];

let peak = 0;
let sumPeak = 0;
for (let i = 0; i < track.length; i++) {
  peak = Math.max(peak, Math.abs(track[i]));
  sumPeak = Math.max(sumPeak, Math.abs(voice[i] + track[i] * SFX_TRACK_VOLUME));
}
if (peak >= 1) throw new Error(`sfx track clips (peak ${peak.toFixed(2)}); lower the levels in sfx.ts`);

const out = path.join("public", SFX_TRACK_FILE);
writeWav(out, [track]);

const db = (x: number) => (20 * Math.log10(x)).toFixed(1);
const counts = SFX_EVENTS.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.sound]: (acc[e.sound] ?? 0) + 1 }), {});
console.log(`${out}: ${SFX_EVENTS.length} events, peak ${db(peak)} dBFS`);
console.log(Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", "));
console.log(
  `voice + sfx sample peak ${db(sumPeak)} dBFS (ceiling ${db(CEILING)}); ducked ${((ducked / SAMPLE_RATE) * 1000).toFixed(0)} ms in total`,
);
