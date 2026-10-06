/**
 * Builds a video's timeline.json from its whisper transcript.
 *
 *   npx tsx scripts/build-timeline.ts 100-a-month-40-years
 *
 * Reads  src/videos/<slug>/timeline-spec.ts   scene anchors + cue phrases
 *        src/videos/<slug>/voiceover.txt      exact script wording
 *        src/videos/<slug>/transcript.json    whisper.cpp output (scripts/transcribe.ts)
 *        public/audio/<slug>/voiceover.mp3    for its duration
 * Writes src/videos/<slug>/timeline.json      the single source of truth for timing
 *
 * Every phrase is first located in voiceover.txt (so partial numbers like
 * "Back to our two hundred" widen to the whole spoken number), then the same
 * normalized tokens are located in the transcript. Nothing is guessed: if a
 * phrase can't be found, the script lists it and exits without writing.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  closestMatch,
  findTokens,
  splitText,
  tokenize,

  type Token,
} from "./lib/words";
import { forMatching, timedWords, type StartSource, type WhisperJson } from "./lib/word-timing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CueSpec = string | { readonly phrase: string; readonly at: "start" | "end" };
type SceneSpec = { id: string; anchor: string; cues: Record<string, CueSpec> };
type TimelineSpec = {
  fps: number;
  sceneLeadFrames: number;
  logo: {
    id: string;
    afterPhrase: string;
    breathingRoomSec: number;
    durationSec: number;
    resumeLeadSec: number;
  };
  endCard: { id: string; afterPhrase: string; gapSec: number; durationSec: number };
  scenes: SceneSpec[];
};

type Match = { tokenIndex: number; tokenCount: number };

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const slug = process.argv[2];
if (!slug) {
  throw new Error("Usage: npx tsx scripts/build-timeline.ts <video-slug>");
}
const videoDir = path.join(process.cwd(), "src", "videos", slug);
const audioRel = `audio/${slug}/voiceover.mp3`;
const audioPath = path.join(process.cwd(), "public", audioRel);


/** Plain word pieces for locating a phrase in the script by its written words. */
const plain = (word: string) =>
  word
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const specModule = (await import(
    pathToFileURL(path.join(videoDir, "timeline-spec.ts")).href
  )) as { TIMELINE_SPEC: TimelineSpec };
  const spec = specModule.TIMELINE_SPEC;
  const { fps } = spec;

  const scriptWords = splitText(readFileSync(path.join(videoDir, "voiceover.txt"), "utf8"));
  const scriptTokens = forMatching(tokenize(scriptWords));
  const scriptPlain = scriptWords.flatMap((w, i) => plain(w).map((p) => ({ p, word: i })));

  const transcript = JSON.parse(
    readFileSync(path.join(videoDir, "transcript.json"), "utf8"),
  ) as WhisperJson;
  const words = timedWords(transcript, audioPath);
  const tTokens = forMatching(tokenize(words.map((w) => w.text)));

  const audioDuration = Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audioPath,
    ]).toString().trim(),
  );

  const missing: string[] = [];

  /** Script token index range of the phrase, searching from script word `fromWord`. */
  const locateInScript = (phrase: string, fromWord: number, toWord: number) => {
    const target = plain(phrase.replace(/\s+/g, " "));
    for (let i = 0; i < scriptPlain.length; i++) {
      if (scriptPlain[i].word < fromWord) continue;
      if (scriptPlain[i].word >= toWord) break;
      if (target.every((t, j) => scriptPlain[i + j]?.p === t)) {
        const w0 = scriptPlain[i].word;
        const w1 = scriptPlain[i + target.length - 1].word;
        const t0 = scriptTokens.findIndex((t) => t.lastWord >= w0);
        let t1 = t0;
        while (t1 + 1 < scriptTokens.length && scriptTokens[t1 + 1].firstWord <= w1) t1++;
        return { w0, t0, t1 };
      }
    }
    return null;
  };

  /** Number of times `pattern` occurs in script tokens [from, before). */
  const countOccurrences = (tokens: Token[], pattern: string[], from: number, before: number) => {
    let n = 0;
    let i = findTokens(tokens, pattern, from, before + pattern.length - 1);
    while (i !== -1 && i < before) {
      n++;
      i = findTokens(tokens, pattern, i + 1, before + pattern.length - 1);
    }
    return n;
  };

  /** k-th occurrence of pattern in transcript tokens [from, to). */
  const findNth = (pattern: string[], from: number, to: number, k: number) => {
    let i = findTokens(tTokens, pattern, from, to);
    for (let n = 0; n < k && i !== -1; n++) {
      i = findTokens(tTokens, pattern, i + 1, to);
    }
    return i;
  };

  const describeMiss = (label: string, pattern: string[], from: number, to: number) => {
    const near = closestMatch(tTokens, pattern, from, to);
    const heard = tTokens
      .slice(near.index, near.index + pattern.length + 2)
      .map((t) => t.text)
      .join(" ");
    missing.push(
      `${label}\n      looking for: "${pattern.join(" ")}"\n      closest heard: "${heard}" (${near.score}/${pattern.length} tokens)`,
    );
  };

  // --- Anchors ------------------------------------------------------------
  type Anchor = { scriptWord: number; scriptToken: number; tToken: number };
  const anchors: (Anchor | null)[] = [];
  let scriptFrom = 0;
  let tFrom = 0;
  for (const scene of spec.scenes) {
    const s = locateInScript(scene.anchor, scriptFrom, Infinity);
    if (!s) {
      missing.push(`${scene.id} anchor "${scene.anchor}" not found in voiceover.txt`);
      anchors.push(null);
      continue;
    }
    const pattern = scriptTokens.slice(s.t0, s.t1 + 1).map((t) => t.text);
    const t = findTokens(tTokens, pattern, tFrom);
    if (t === -1) {
      describeMiss(`${scene.id} anchor "${scene.anchor}"`, pattern, tFrom, tTokens.length);
      anchors.push(null);
      continue;
    }
    anchors.push({ scriptWord: s.w0, scriptToken: s.t0, tToken: t });
    scriptFrom = s.w0 + 1;
    tFrom = t + 1;
  }

  // --- Phrase lookup inside one scene -----------------------------------------
  const sceneRange = (i: number) => {
    const a = anchors[i]!;
    const next = anchors.slice(i + 1).find((x) => x !== null);
    return {
      scriptWordTo: next ? next.scriptWord : Infinity,
      tTo: next ? next.tToken : tTokens.length,
      a,
    };
  };

  const findInScene = (sceneIndex: number, label: string, phrase: string): Match | null => {
    const { a, scriptWordTo, tTo } = sceneRange(sceneIndex);
    const s = locateInScript(phrase, a.scriptWord, scriptWordTo);
    if (!s) {
      missing.push(`${label} "${phrase}" not found in voiceover.txt within the scene`);
      return null;
    }
    const pattern = scriptTokens.slice(s.t0, s.t1 + 1).map((t) => t.text);
    const k = countOccurrences(scriptTokens, pattern, a.scriptToken, s.t0);
    const t = findNth(pattern, a.tToken, tTo, k);
    if (t === -1) {
      describeMiss(`${label} "${phrase}"`, pattern, a.tToken, Math.min(tTo + 5, tTokens.length));
      return null;
    }
    return { tokenIndex: t, tokenCount: pattern.length };
  };

  const startSec = (m: Match) => words[tTokens[m.tokenIndex].firstWord].start;
  const endSec = (m: Match) => words[tTokens[m.tokenIndex + m.tokenCount - 1].lastWord].end;
  const heardText = (m: Match) =>
    words
      .slice(tTokens[m.tokenIndex].firstWord, tTokens[m.tokenIndex + m.tokenCount - 1].lastWord + 1)
      .map((w) => w.text)
      .join(" ");

  // --- Cues -----------------------------------------------------------------
  type FoundCue = { name: string; phrase: string; at: "start" | "end"; sourceSec: number; heard: string; source: StartSource };
  const sceneCues: FoundCue[][] = spec.scenes.map(() => []);
  let logoMatch: Match | null = null;
  let endMatch: Match | null = null;

  for (let i = 0; i < spec.scenes.length; i++) {
    const scene = spec.scenes[i];
    if (!anchors[i]) continue;
    for (const [name, cue] of Object.entries(scene.cues)) {
      const phrase = typeof cue === "string" ? cue : cue.phrase;
      const at = typeof cue === "string" ? "start" : cue.at;
      const m = findInScene(i, `${scene.id} cue ${name}`, phrase);
      if (m) {
        sceneCues[i].push({
          name,
          phrase,
          at,
          sourceSec: at === "end" ? endSec(m) : startSec(m),
          heard: heardText(m),
          source:
            at === "start"
              ? words[tTokens[m.tokenIndex].firstWord].startSource
              : words[tTokens[m.tokenIndex + m.tokenCount - 1].lastWord].measuredEnd
                ? "pause"
                : "whisper",
        });
      }
    }
    if (i === 0 && !logoMatch) {
      logoMatch = findInScene(i, `${spec.logo.id} afterPhrase`, spec.logo.afterPhrase);
    }
    if (i === spec.scenes.length - 1) {
      endMatch = findInScene(i, `${spec.endCard.id} afterPhrase`, spec.endCard.afterPhrase);
    }
  }

  if (missing.length > 0 || logoMatch === null || endMatch === null || anchors.some((a) => !a)) {
    console.error(`\nCould not find ${missing.length} phrase(s). Nothing was written.\n`);
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
  }

  // --- Audio layout: [scene 1] + pause + [logo] + [rest of voiceover] ----------
  const lm: Match = logoMatch;
  const scene1LastWordEnd = endSec(lm);
  const nextWord = words[tTokens[lm.tokenIndex + lm.tokenCount - 1].lastWord + 1];
  // Audio cut points sit on exact frame boundaries, so <Audio> trims in whole
  // frames and every cue uses the very same offset.
  const segment1ToFrame = Math.floor(Math.min(scene1LastWordEnd + spec.logo.breathingRoomSec, nextWord.start - 0.05) * fps);
  const segment1To = segment1ToFrame / fps;

  const logoStartFrame = Math.round((scene1LastWordEnd + spec.logo.breathingRoomSec) * fps);
  const logoEndFrame = logoStartFrame + Math.round(spec.logo.durationSec * fps);

  const resumeAnchorSec = words[tTokens[anchors[1]!.tToken].firstWord].start;
  const segment2FromFrame = Math.max(Math.floor((resumeAnchorSec - spec.logo.resumeLeadSec) * fps), segment1ToFrame);
  const segment2From = segment2FromFrame / fps;
  /** THE offset: everything after the logo plays this much later than in the mp3. */
  const segment2OffsetSec = logoEndFrame / fps - segment2From;

  const toOutputSec = (sourceSec: number) => {
    if (sourceSec < segment1To) return sourceSec;
    if (sourceSec >= segment2From) return sourceSec + segment2OffsetSec;
    throw new Error(`Time ${sourceSec}s falls inside the cut between the two audio segments`);
  };
  const toFrame = (sourceSec: number) => Math.round(toOutputSec(sourceSec) * fps);

  // --- Scenes -----------------------------------------------------------------
  const endCardStartFrame = Math.round((toOutputSec(endSec(endMatch)) + spec.endCard.gapSec) * fps);
  const endCardEndFrame = endCardStartFrame + Math.round(spec.endCard.durationSec * fps);

  type SceneOut = {
    id: string;
    startFrame: number;
    endFrame: number;
    anchorFrame: number;
    cues: Record<string, number>;
  };
  const scenes: SceneOut[] = [];
  const cueRows: { scene: string; name: string; phrase: string; at: string; heard: string; sec: number; frame: number; source: StartSource }[] = [];

  spec.scenes.forEach((scene, i) => {
    const anchorSec = words[tTokens[anchors[i]!.tToken].firstWord].start;
    const anchorFrame = toFrame(anchorSec);
    let startFrame = Math.max(0, anchorFrame - spec.sceneLeadFrames);
    if (i === 0) startFrame = 0;
    if (i === 1) startFrame = logoEndFrame; // scene after the logo starts as the logo ends
    const cues: Record<string, number> = {};
    for (const c of sceneCues[i]) {
      const frame = toFrame(c.sourceSec);
      cues[c.name] = frame;
      cueRows.push({ scene: scene.id, name: c.name, phrase: c.phrase, at: c.at, heard: c.heard, sec: frame / fps, frame, source: c.source });
    }
    scenes.push({ id: scene.id, startFrame, endFrame: 0, anchorFrame, cues });
    if (i === 0) {
      scenes.push({ id: spec.logo.id, startFrame: logoStartFrame, endFrame: logoEndFrame, anchorFrame: logoStartFrame, cues: {} });
    }
  });
  scenes.push({ id: spec.endCard.id, startFrame: endCardStartFrame, endFrame: endCardEndFrame, anchorFrame: endCardStartFrame, cues: {} });

  for (let i = 0; i < scenes.length - 1; i++) {
    if (scenes[i].id === spec.logo.id) continue;
    scenes[i].endFrame = scenes[i + 1].startFrame;
  }

  // Sanity: scenes are contiguous and increasing, cues sit inside their scene.
  const problems: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    if (s.endFrame <= s.startFrame) problems.push(`${s.id}: ends before it starts`);
    if (i > 0 && s.startFrame !== scenes[i - 1].endFrame) problems.push(`${s.id}: not contiguous with ${scenes[i - 1].id}`);
    for (const [name, f] of Object.entries(s.cues)) {
      if (f < s.startFrame || f > s.endFrame) problems.push(`${s.id} cue ${name} at frame ${f} is outside the scene`);
    }
  }
  if (problems.length > 0) {
    console.error("\nTimeline problems, nothing was written:\n" + problems.map((p) => `  - ${p}`).join("\n"));
    process.exit(1);
  }

  const timeline = {
    fps,
    totalFrames: endCardEndFrame,
    audioSegments: [
      { file: audioRel, fromSec: 0, toSec: round3(segment1To), atFrame: 0, fromFrame: 0, toFrame: segment1ToFrame },
      {
        file: audioRel,
        fromSec: round3(segment2From),
        toSec: round3(audioDuration),
        atFrame: logoEndFrame,
        fromFrame: segment2FromFrame,
        toFrame: Math.ceil(audioDuration * fps),
      },
    ],
    segment2OffsetSec: round3(segment2OffsetSec),
    scenes,
  };
  writeFileSync(path.join(videoDir, "timeline.json"), JSON.stringify(timeline, null, 2) + "\n");

  // --- Report -----------------------------------------------------------------
  const fmt = (frame: number) => {
    const s = frame / fps;
    return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`;
  };
  console.log(`\nWrote src/videos/${slug}/timeline.json`);
  console.log(`Total: ${endCardEndFrame} frames (${fmt(endCardEndFrame)}) at ${fps}fps`);
  console.log(
    `Audio: [0.000s to ${segment1To.toFixed(3)}s] at frame 0, then [${segment2From.toFixed(3)}s to ${audioDuration.toFixed(3)}s] at frame ${logoEndFrame} (offset +${segment2OffsetSec.toFixed(3)}s)\n`,
  );
  console.log("SCENES");
  console.log("  scene                    start      anchor     end        length");
  for (const s of scenes) {
    console.log(
      `  ${s.id.padEnd(24)} ${fmt(s.startFrame).padEnd(10)} ${fmt(s.anchorFrame).padEnd(10)} ${fmt(s.endFrame).padEnd(10)} ${((s.endFrame - s.startFrame) / fps).toFixed(1)}s`,
    );
  }
  console.log(
    "\nCUES (time in the final video)\n  source: pause = measured onset after a pause, dip = after a short dip, valley = energy valley between words, whisper = estimate only",
  );
  let lastScene = "";
  for (const r of cueRows) {
    if (r.scene !== lastScene) {
      console.log(`  ${r.scene}`);
      lastScene = r.scene;
    }
    const at = r.at === "end" ? " (END)" : "";
    const how = r.source;
    console.log(`    ${fmt(r.frame).padEnd(9)} f${String(r.frame).padEnd(6)} ${how.padEnd(8)} ${r.name.padEnd(18)} heard: "${r.heard}"${at}`);
  }
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
