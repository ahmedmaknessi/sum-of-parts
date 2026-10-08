/**
 * Generates the channel's sound kit into public/sfx/ (48 kHz, 16-bit mono WAV).
 *
 *   npx tsx scripts/make-sfx.ts
 *
 * Minimal, clean sounds for a data-explainer channel: nothing cartoonish.
 *   tick    tiny high click (counters, small steps)
 *   pop     soft rounded blip (labels and numbers appearing)
 *   tap     soft woody knock (blocks, bars and cards landing)
 *   thump   low, warm impact (big numbers landing)
 *   whoosh  airy sweep (scene transitions, things moving)
 *   swish   short, light sweep (small moves, strike-throughs)
 *   chime   gentle bell (key insight moments)
 *   riser   rising air before a reveal
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { adsr, declick, envelope, mix, noise, normalize, sine, svf, writeWav, type Signal } from "./lib/synth";

const outDir = path.join(process.cwd(), "public", "sfx");
mkdirSync(outDir, { recursive: true });

const sounds: Record<string, Signal> = {
  tick: mix(
    [envelope(sine(0.05, () => 2400), adsr(0.0008, 0.007)), 0.8],
    [envelope(sine(0.05, () => 4800), adsr(0.0005, 0.004)), 0.25],
    [envelope(svf(noise(0.05, 7), () => 5000, 1.2, "high"), adsr(0.0003, 0.003)), 0.2],
  ),

  pop: mix(
    // Pitch falls from 1100 to 620 Hz: a soft, rounded blip.
    [envelope(sine(0.2, (t) => 620 + 480 * Math.exp(-t / 0.018)), adsr(0.003, 0.045)), 1],
    [envelope(sine(0.2, (t) => 1240 + 960 * Math.exp(-t / 0.018)), adsr(0.002, 0.02)), 0.15],
  ),

  tap: mix(
    [envelope(sine(0.25, (t) => 360 + 60 * Math.exp(-t / 0.01)), adsr(0.002, 0.05)), 1],
    [envelope(sine(0.25, () => 900), adsr(0.001, 0.02)), 0.25],
    [envelope(svf(noise(0.25, 11), () => 1800, 0.8, "band"), adsr(0.001, 0.012)), 0.5],
  ),

  thump: mix(
    // Low sine that drops from 95 to 45 Hz, plus a soft attack transient.
    [envelope(sine(0.7, (t) => 45 + 50 * Math.exp(-t / 0.07)), adsr(0.004, 0.2)), 1],
    [envelope(sine(0.7, (t) => 90 + 100 * Math.exp(-t / 0.05)), adsr(0.003, 0.08)), 0.35],
    [envelope(svf(noise(0.7, 13), () => 500, 0.7, "low"), adsr(0.002, 0.03)), 0.6],
  ),

  // Noise through a band-pass that sweeps up then settles: air moving past.
  whoosh: envelope(
    svf(noise(0.7, 17), (t) => 350 + 2200 * Math.sin(Math.PI * Math.min(t / 0.7, 1)) ** 2, 1.4, "band"),
    (t) => Math.sin(Math.PI * Math.min(t / 0.7, 1)) ** 1.6,
  ),

  swish: envelope(
    svf(noise(0.22, 19), (t) => 1800 + 5000 * (t / 0.22), 1.6, "band"),
    (t) => Math.sin(Math.PI * Math.min(t / 0.22, 1)) ** 1.2,
  ),

  // Soft glass bell on E6: harmonic partials with different decays.
  chime: mix(
    [envelope(sine(2.2, () => 1318.5), adsr(0.004, 0.7)), 1],
    [envelope(sine(2.2, () => 2637), adsr(0.003, 0.35)), 0.3],
    [envelope(sine(2.2, () => 3955.5), adsr(0.002, 0.15)), 0.12],
    [envelope(sine(2.2, () => 659.25), adsr(0.006, 0.9)), 0.35],
  ),

  // Rising air plus a faint rising tone, ending at its loudest (the reveal lands right after).
  riser: mix(
    [
      envelope(
        svf(noise(1.6, 23), (t) => 300 + 3200 * (t / 1.6) ** 2, 1.5, "band"),
        (t) => (t / 1.6) ** 2.2,
      ),
      1,
    ],
    [envelope(sine(1.6, (t) => 220 * 2 ** ((t / 1.6) * 1.5)), (t) => (t / 1.6) ** 3), 0.18],
  ),
};

for (const [name, signal] of Object.entries(sounds)) {
  writeWav(path.join(outDir, `${name}.wav`), [normalize(declick(signal), -3)]);
  console.log(`public/sfx/${name}.wav  ${(signal.length / 48000).toFixed(2)}s`);
}
