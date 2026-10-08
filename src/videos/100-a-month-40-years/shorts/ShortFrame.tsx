import type { Caption } from "@remotion/captions";
import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE, FONT, SAFE_AREA, SHORT, TEXT_OPACITY, TYPE, VIDEO } from "../../../brand/tokens";
import { Background } from "../../../components";
import { ramp } from "../../../lib/motion";
import CAPTIONS_JSON from "../captions.json";
import { InVideo01 } from "../SceneRoot";
import { SceneAudio } from "../SceneAudio";
import { getScene, TRANSITION_FRAMES, type SceneId } from "../timeline";

const CAPTIONS: readonly Caption[] = CAPTIONS_JSON;

/**
 * The 16:9 scene is scaled so its safe area (everything the scene draws) fits
 * the Short's width inside its side margins; only the scene's own empty
 * margins fall outside.
 */
const SCENE_SCALE = (SHORT.width - 2 * SHORT.safe.x) / (VIDEO.width - 2 * SAFE_AREA.x);
const SCENE_CENTER_Y = 900;
const TITLE_TOP = SHORT.safe.top + 40;
const CAPTIONS_TOP = SCENE_CENTER_Y + (VIDEO.height * SCENE_SCALE) / 2 + 40;

/** Caption pages: short phrases, broken at punctuation, pauses or this many characters. */
const PAGE_CHARS = 24;
const PAGE_PAUSE_MS = 500;
/** A page stays up this long after its last word if nothing follows right away. */
const PAGE_LINGER_MS = 600;

type Page = { readonly words: readonly Caption[]; readonly startMs: number; readonly endMs: number };

const toPages = (words: readonly Caption[]): Page[] => {
  const groups: Caption[][] = [];
  for (const w of words) {
    const page = groups[groups.length - 1];
    const prev = page?.[page.length - 1];
    const text = page?.map((p) => p.text).join("").trim() ?? "";
    const breakHere =
      !page ||
      /[.?!,;:]["”)]*$/.test(prev!.text) ||
      (text + w.text).length > PAGE_CHARS ||
      w.startMs - prev!.endMs > PAGE_PAUSE_MS;
    if (breakHere) groups.push([w]);
    else page.push(w);
  }
  return groups.map((g, i) => {
    const next = groups[i + 1];
    const last = g[g.length - 1];
    return {
      words: g,
      startMs: g[0].startMs,
      endMs: Math.min(next ? next[0].startMs : Infinity, last.endMs + PAGE_LINGER_MS),
    };
  });
};

/** Word-by-word captions: spoken words in full cream, the rest of the phrase waiting faintly. */
const ShortCaptions: React.FC<{ readonly from: number; readonly to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fromMs = (from / fps) * 1000;
  const toMs = (to / fps) * 1000;
  const pages = toPages(CAPTIONS.filter((c) => c.startMs >= fromMs && c.startMs < toMs));
  const nowMs = ((from + frame) / fps) * 1000;
  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.endMs);
  if (!page) return null;
  const pageFrame = frame - Math.round((page.startMs / 1000) * fps - from);
  return (
    <div
      style={{
        position: "absolute",
        left: SHORT.safe.x,
        right: SHORT.safe.x,
        top: CAPTIONS_TOP,
        textAlign: "center",
        fontSize: 64,
        fontWeight: FONT.weight.heading,
        lineHeight: 1.15,
        opacity: ramp(pageFrame, 0, 3, EASE.out),
      }}
    >
      {page.words.map((w, i) => (
        <span key={i} style={{ opacity: nowMs >= w.startMs ? 1 : TEXT_OPACITY.tertiary }}>
          {w.text}
        </span>
      ))}
    </div>
  );
};

type ShortFrameProps = {
  /** The scene of Video 01 this Short replays, start to end. */
  readonly scene: SceneId;
  /** Use "\n" for line breaks: titles are hand-broken so no line ends on a hyphen or an orphan. */
  readonly title: string;
  readonly subtitle: string;
  readonly children: React.ReactNode;
};

/** Length of a Short: its scene, start to end. */
export const shortDuration = (scene: SceneId) => getScene(scene).endFrame - getScene(scene).startFrame;

/**
 * A vertical Short made from one scene of Video 01: a fixed title on top, the
 * scene (transparent, over one shared background) in the middle, captions
 * below, and the same voice and sound effects as the full video.
 */
export const ShortFrame: React.FC<ShortFrameProps> = ({ scene, title, subtitle, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { startFrame, endFrame } = getScene(scene);
  // The scene fades in and out (the title stays), so the Short loops cleanly.
  const sceneOpacity =
    ramp(frame, 0, TRANSITION_FRAMES, EASE.inOut) *
    (1 - ramp(frame, durationInFrames - TRANSITION_FRAMES, TRANSITION_FRAMES, EASE.inOut));

  return (
    <Background>
      <InVideo01.Provider value>
        <SceneAudio from={startFrame} to={endFrame} />

        <div
          style={{
            position: "absolute",
            left: SHORT.safe.x,
            right: SHORT.safe.x,
            top: TITLE_TOP,
            textAlign: "center",
            color: COLORS.primary,
          }}
        >
          <div style={{ fontSize: TYPE.h2, fontWeight: FONT.weight.heading, lineHeight: 1.1, whiteSpace: "pre-line" }}>
            {title}
          </div>
          <div style={{ fontSize: 48, marginTop: 20, opacity: TEXT_OPACITY.secondary }}>{subtitle}</div>
        </div>

        <div
          style={{
            position: "absolute",
            left: (SHORT.width - VIDEO.width) / 2,
            top: SCENE_CENTER_Y - VIDEO.height / 2,
            width: VIDEO.width,
            height: VIDEO.height,
            scale: SCENE_SCALE,
            opacity: sceneOpacity,
          }}
        >
          {children}
        </div>

        <ShortCaptions from={startFrame} to={endFrame} />
      </InVideo01.Provider>
    </Background>
  );
};
