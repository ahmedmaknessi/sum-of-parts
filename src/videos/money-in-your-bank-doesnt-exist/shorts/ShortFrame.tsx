import type { Caption } from "@remotion/captions";
import type React from "react";
import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, FONT, SAFE_AREA, SHORT, TEXT_OPACITY, TYPE, VIDEO } from "../../../brand/tokens";
import { PaperBackground } from "../../../components/paper/PaperBackground";
import { At } from "../../../components/paper/Piece";
import { PaperText } from "../../../components/paper/PaperText";
import { ramp } from "../../../lib/motion";
import CAPTIONS_JSON from "../captions.json";
import { InVideo02 } from "../SceneRoot";
import { SceneAudio } from "../SceneAudio";
import { THEME } from "../theme";
import { SheetWipe, SHEET_FRAMES } from "../Video02";
import { getScene, TRANSITION_FRAMES, type SceneId } from "../timeline";

export const CAPTIONS: readonly Caption[] = CAPTIONS_JSON;

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

export type Page = { readonly words: readonly Caption[]; readonly startMs: number; readonly endMs: number };

export const toPages = (words: readonly Caption[], pageChars: number = PAGE_CHARS): Page[] => {
  const groups: Caption[][] = [];
  for (const w of words) {
    const page = groups[groups.length - 1];
    const prev = page?.[page.length - 1];
    const text = page?.map((p) => p.text).join("").trim() ?? "";
    const breakHere =
      !page ||
      /[.?!,;:]["”)]*$/.test(prev!.text) ||
      (text + w.text).length > pageChars ||
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
  /** The scenes of video 02 this Short replays, each start to end, joined by a paper wipe. */
  readonly scenes: readonly { readonly id: SceneId; readonly Component: React.FC }[];
  /** Use "\n" for line breaks: titles are hand-broken so no line ends on a hyphen or an orphan. */
  readonly title: string;
  readonly subtitle: string;
};

const sceneLength = (id: SceneId) => getScene(id).endFrame - getScene(id).startFrame;

/** Length of a Short: its scenes, start to end, back to back. */
export const shortDuration = (ids: readonly SceneId[]) => ids.reduce((sum, id) => sum + sceneLength(id), 0);

/**
 * A vertical Short made from scenes of video 02: a fixed paper title on top,
 * the scenes (transparent, over the cream paper board) in the middle, joined
 * by the paper sheet wipe, captions below, and each scene's own voice, music
 * and sound effects.
 */
export const ShortFrame: React.FC<ShortFrameProps> = ({ scenes, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const lines = title.split("\n");
  /** Where each scene starts inside the Short. */
  const offsets = scenes.map((_, i) => scenes.slice(0, i).reduce((sum, s) => sum + sceneLength(s.id), 0));
  // The scenes fade in at the start and out at the end (the title stays), so the Short loops cleanly.
  const sceneOpacity =
    ramp(frame, 0, TRANSITION_FRAMES, EASE.inOut) *
    (1 - ramp(frame, durationInFrames - TRANSITION_FRAMES, TRANSITION_FRAMES, EASE.inOut));

  return (
    <PaperBackground board={THEME.board} ink={THEME.ink}>
      <InVideo02.Provider value>
        {scenes.map(({ id }, i) => (
          <Sequence key={`a${id}`} name={`Audio ${id}`} from={offsets[i]} durationInFrames={sceneLength(id)}>
            <SceneAudio from={getScene(id).startFrame} to={getScene(id).endFrame} />
          </Sequence>
        ))}

        {/* Title: cut-paper lines; subtitle: flat, like a source line */}
        {lines.map((line, i) => (
          <At key={i} x={SHORT.width / 2} y={TITLE_TOP + 44 + i * TYPE.h2 * 1.08}>
            <PaperText color={THEME.ink} fontSize={TYPE.h2} depth={1.2} shadowOpacity={THEME.shadow}>
              {line}
            </PaperText>
          </At>
        ))}
        <At x={SHORT.width / 2} y={TITLE_TOP + 44 + lines.length * TYPE.h2 * 1.08 + 20}>
          <PaperText color={THEME.ink} fontSize={46} weight={FONT.weight.body} depth={0} style={{ opacity: TEXT_OPACITY.secondary }}>
            {subtitle}
          </PaperText>
        </At>

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
          {scenes.map(({ id, Component }, i) => (
            <Sequence key={id} name={id} from={offsets[i]} durationInFrames={sceneLength(id)} premountFor={fps}>
              <Component />
            </Sequence>
          ))}
          {offsets.slice(1).map((at) => (
            <Sequence key={`w${at}`} name="Paper wipe" from={at - SHEET_FRAMES / 2} durationInFrames={SHEET_FRAMES}>
              <SheetWipe />
            </Sequence>
          ))}
        </div>

        {scenes.map(({ id }, i) => (
          <Sequence key={`c${id}`} name={`Captions ${id}`} from={offsets[i]} durationInFrames={sceneLength(id)}>
            <ShortCaptions from={getScene(id).startFrame} to={getScene(id).endFrame} />
          </Sequence>
        ))}
      </InVideo02.Provider>
    </PaperBackground>
  );
};
