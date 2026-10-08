/**
 * Tiny offline synthesizer for the channel's sound kit. Everything is
 * generated from math (no samples, no downloads), so the sounds are owned,
 * deterministic and tuned to the brand: soft, clean, never cartoonish.
 */
import { readFileSync, writeFileSync } from "node:fs";

export const SAMPLE_RATE = 48000;

export type Signal = Float32Array;

export const silence = (seconds: number): Signal => new Float32Array(Math.round(seconds * SAMPLE_RATE));

/** Deterministic white noise. */
export const noise = (seconds: number, seed = 1): Signal => {
  const out = silence(seconds);
  let s = seed >>> 0;
  for (let i = 0; i < out.length; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out[i] = (s / 4294967296) * 2 - 1;
  }
  return out;
};

/** Sine with a frequency that can change over time (Hz as a function of seconds). */
export const sine = (seconds: number, freq: (t: number) => number, phase = 0): Signal => {
  const out = silence(seconds);
  let p = phase;
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.sin(p);
    p += (2 * Math.PI * freq(i / SAMPLE_RATE)) / SAMPLE_RATE;
  }
  return out;
};

/** Multiplies a signal by an envelope (gain as a function of seconds). */
export const envelope = (signal: Signal, gain: (t: number) => number): Signal =>
  signal.map((v, i) => v * gain(i / SAMPLE_RATE));

/** Attack then exponential decay. */
export const adsr = (attack: number, decay: number) => (t: number) =>
  t < attack ? t / attack : Math.exp(-(t - attack) / decay);

/**
 * State-variable filter (Chamberlin) with a cutoff that can move over time.
 * mode: "low" | "band" | "high".
 */
export const svf = (signal: Signal, cutoff: (t: number) => number, q = 0.7, mode: "low" | "band" | "high" = "band"): Signal => {
  const out = new Float32Array(signal.length);
  let low = 0;
  let band = 0;
  const damp = 1 / q;
  for (let i = 0; i < signal.length; i++) {
    const f = 2 * Math.sin((Math.PI * Math.min(cutoff(i / SAMPLE_RATE), SAMPLE_RATE / 6)) / SAMPLE_RATE);
    low += f * band;
    const high = signal[i] - low - damp * band;
    band += f * high;
    out[i] = mode === "low" ? low : mode === "band" ? band : high;
  }
  return out;
};

/** Sums signals (aligned at 0) with gains. */
export const mix = (...parts: [Signal, number][]): Signal => {
  const length = Math.max(...parts.map(([s]) => s.length));
  const out = new Float32Array(length);
  for (const [s, g] of parts) for (let i = 0; i < s.length; i++) out[i] += s[i] * g;
  return out;
};

/** Short fades at both ends, so nothing clicks. */
export const declick = (signal: Signal, seconds = 0.004): Signal => {
  const n = Math.round(seconds * SAMPLE_RATE);
  const out = signal.slice();
  for (let i = 0; i < n && i < out.length; i++) {
    out[i] *= i / n;
    out[out.length - 1 - i] *= i / n;
  }
  return out;
};

/** Scales so the peak sits at `peakDb` dBFS. */
export const normalize = (signal: Signal, peakDb = -3): Signal => {
  let peak = 0;
  for (const v of signal) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0 ? 10 ** (peakDb / 20) / peak : 1;
  return signal.map((v) => v * gain);
};

// ---------------------------------------------------------------------------
// WAV (16-bit PCM, mono or stereo)
// ---------------------------------------------------------------------------

export const writeWav = (path: string, channels: Signal[], sampleRate = SAMPLE_RATE) => {
  const frames = channels[0].length;
  const blockAlign = channels.length * 2;
  const buf = Buffer.alloc(44 + frames * blockAlign);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + frames * blockAlign, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels.length, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * blockAlign, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(frames * blockAlign, 40);
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels.length; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      buf.writeInt16LE(Math.round(v * 32767), 44 + i * blockAlign + c * 2);
    }
  }
  writeFileSync(path, buf);
};

/** Reads a 16-bit PCM mono WAV written by writeWav. */
export const readWavMono = (path: string): Signal => {
  const buf = readFileSync(path);
  const channels = buf.readUInt16LE(22);
  let offset = 12;
  while (buf.toString("ascii", offset, offset + 4) !== "data") offset += 8 + buf.readUInt32LE(offset + 4);
  const bytes = buf.readUInt32LE(offset + 4);
  const start = offset + 8;
  const frames = bytes / (2 * channels);
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) out[i] = buf.readInt16LE(start + i * 2 * channels) / 32768;
  return out;
};
