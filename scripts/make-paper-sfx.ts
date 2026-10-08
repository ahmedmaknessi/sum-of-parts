/**
 * Generates the paper sound kit into public/sfx/paper/ (48 kHz, 16-bit mono WAV).
 *
 *   npx tsx scripts/make-paper-sfx.ts
 *
 * Soft, papery sounds for the papercut videos, all synthesized (no samples):
 *   slide     a sheet sliding across the board
 *   tap       a card landing
 *   rip       paper tearing
 *   page      a page turning
 *   flip      a flip digit / card flipping over
 *   stamp     a rubber stamp landing
 *   key       one typewriter key
 *   shredder  a short paper-shredder run
 *   plane     a paper plane flying off
 *   pulse     a low, soft heartbeat-like pulse (tension)
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SAMPLE_RATE, adsr, declick, envelope, mix, noise, normalize, sine, silence, svf, writeWav, type Signal } from "./lib/synth";

const outDir = path.join(process.cwd(), "public", "sfx", "paper");
mkdirSync(outDir, { recursive: true });

/** Deterministic pseudo-random in [0, 1). */
const rand = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** Many tiny noise grains scattered over `seconds` (crackle, tearing fibres). */
const grains = (seconds: number, count: number, seed: number, grainSec = 0.006, density?: (t: number) => number): Signal => {
  const out = silence(seconds);
  const r = rand(seed);
  const src = noise(seconds, seed + 1);
  const len = Math.round(grainSec * SAMPLE_RATE);
  for (let g = 0; g < count; g++) {
    let t = r();
    if (density) {
      // Rejection sampling: more grains where density is high.
      let tries = 0;
      while (r() > density(t) && tries++ < 20) t = r();
    }
    const start = Math.floor(t * (out.length - len));
    const amp = 0.4 + r() * 0.6;
    for (let i = 0; i < len; i++) out[start + i] += src[start + i] * amp * Math.sin((Math.PI * i) / len);
  }
  return out;
};

const sounds: Record<string, Signal> = {
  slide: envelope(
    mix([svf(noise(0.42, 3), () => 3200, 0.9, "band"), 1], [svf(noise(0.42, 4), () => 900, 0.7, "band"), 0.35]),
    (t) => Math.sin(Math.PI * Math.min(t / 0.42, 1)) ** 1.5 * (0.85 + 0.15 * Math.sin(t * 90)),
  ),

  tap: mix(
    [envelope(svf(noise(0.14, 5), () => 1400, 0.8, "low"), adsr(0.001, 0.018)), 1],
    [envelope(sine(0.14, (t) => 170 + 80 * Math.exp(-t / 0.01)), adsr(0.002, 0.03)), 0.6],
  ),

  rip: svf(
    grains(0.62, 900, 7, 0.004, (t) => 0.25 + 0.75 * t),
    (t) => 2200 + 2500 * (t / 0.62),
    0.8,
    "band",
  ),

  page: envelope(
    svf(noise(0.55, 9), (t) => 1200 + 2600 * Math.sin(Math.PI * Math.min(t / 0.55, 1)), 1.1, "band"),
    (t) => Math.sin(Math.PI * Math.min(t / 0.55, 1)) ** 1.3 * (0.7 + 0.3 * Math.abs(Math.sin(t * 60 * (1 - t)))),
  ),

  flip: mix(
    [envelope(svf(noise(0.16, 11), () => 4000, 0.7, "high"), adsr(0.0008, 0.008)), 1],
    [
      envelope(svf(noise(0.16, 12), () => 2600, 0.8, "band"), (t) => (t < 0.07 ? 0 : adsr(0.001, 0.012)(t - 0.07))),
      0.8,
    ],
  ),

  stamp: mix(
    [envelope(sine(0.4, (t) => 70 + 70 * Math.exp(-t / 0.03)), adsr(0.003, 0.09)), 1],
    [envelope(svf(noise(0.4, 13), () => 700, 0.7, "low"), adsr(0.001, 0.025)), 0.9],
    [envelope(svf(noise(0.4, 14), () => 3000, 0.8, "band"), adsr(0.0005, 0.006)), 0.35],
  ),

  key: mix(
    [envelope(svf(noise(0.12, 15), () => 5000, 0.8, "high"), adsr(0.0004, 0.004)), 0.8],
    [envelope(sine(0.12, () => 720), adsr(0.001, 0.018)), 0.5],
    [envelope(sine(0.12, () => 210), adsr(0.001, 0.025)), 0.4],
  ),

  shredder: envelope(
    mix(
      // Motor hum: a few harmonics of 95 Hz.
      [mix([sine(1.2, () => 95), 1], [sine(1.2, () => 190), 0.5], [sine(1.2, () => 285), 0.3]), 0.35],
      // Paper being cut: crackly grains through a band-pass.
      [svf(grains(1.2, 1400, 17, 0.005), () => 2400, 0.8, "band"), 1],
    ),
    (t) => Math.min(1, t / 0.06) * Math.min(1, (1.2 - t) / 0.15),
  ),

  plane: envelope(
    svf(noise(0.8, 19), (t) => 800 + 3000 * (t / 0.8), 1.5, "band"),
    (t) => Math.sin(Math.PI * Math.min(t / 0.8, 1)) ** 1.2,
  ),

  pulse: mix(
    [envelope(sine(0.7, () => 55), adsr(0.02, 0.16)), 1],
    [envelope(sine(0.7, () => 55), (t) => (t < 0.22 ? 0 : adsr(0.02, 0.14)(t - 0.22))), 0.6],
    [envelope(svf(noise(0.7, 21), () => 300, 0.7, "low"), adsr(0.01, 0.06)), 0.25],
  ),
};

for (const [name, signal] of Object.entries(sounds)) {
  writeWav(path.join(outDir, `${name}.wav`), [normalize(declick(signal), -3)]);
  console.log(`public/sfx/paper/${name}.wav  ${(signal.length / SAMPLE_RATE).toFixed(2)}s`);
}
