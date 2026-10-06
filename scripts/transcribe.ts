/**
 * Transcribes a video's voiceover with whisper.cpp (word-level timestamps).
 *
 *   npx tsx scripts/transcribe.ts 100-a-month-40-years
 *
 * Reads  public/audio/<slug>/voiceover.mp3 (never modified)
 * Writes src/videos/<slug>/transcript.json (raw whisper.cpp output)
 *
 * whisper.cpp and its model are installed once into ./whisper.cpp (git-ignored).
 */
import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
} from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const WHISPER_PATH = path.join(process.cwd(), "whisper.cpp");
const WHISPER_VERSION = "1.5.5";
const MODEL = "medium.en";

const slug = process.argv[2];
if (!slug) {
  throw new Error("Usage: npx tsx scripts/transcribe.ts <video-slug>");
}

const inputMp3 = path.join(process.cwd(), "public", "audio", slug, "voiceover.mp3");
const outputJson = path.join(process.cwd(), "src", "videos", slug, "transcript.json");
const tempDir = path.join(WHISPER_PATH, "tmp");
const wavPath = path.join(tempDir, `${slug}-16k.wav`);

const main = async () => {
  await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
  await downloadWhisperModel({ model: MODEL, folder: WHISPER_PATH });

  // whisper.cpp needs 16 kHz mono WAV. Converted copy only, the mp3 is untouched.
  mkdirSync(tempDir, { recursive: true });
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", inputMp3, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wavPath],
    { stdio: "inherit" },
  );

  const result = await transcribe({
    inputPath: wavPath,
    whisperPath: WHISPER_PATH,
    whisperCppVersion: WHISPER_VERSION,
    model: MODEL,
    tokenLevelTimestamps: true,
    splitOnWord: true,
    language: "en",
    printOutput: false,
    onProgress: (p) => process.stdout.write(`\rTranscribing: ${Math.round(p * 100)}%   `),
  });

  writeFileSync(outputJson, JSON.stringify(result, null, 2));
  console.log(`\nWrote ${path.relative(process.cwd(), outputJson)} (${result.transcription.length} segments)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
