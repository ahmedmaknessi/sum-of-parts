/**
 * Video 02: typed access to timeline.json, the single source of truth for timing.
 * Scenes never hardcode a start, a duration or a cue frame: they ask here.
 */
import timelineJson from "./timeline.json";

type SceneJson = {
  readonly id: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly anchorFrame: number;
  readonly cues: Readonly<Record<string, number | undefined>>;
};

type AudioSegmentJson = {
  readonly file: string;
  readonly fromSec: number;
  readonly toSec: number;
  readonly atFrame: number;
  readonly fromFrame: number;
  readonly toFrame: number;
};

type TimelineJson = {
  readonly fps: number;
  readonly totalFrames: number;
  readonly audioSegments: readonly AudioSegmentJson[];
  readonly segment2OffsetSec: number;
  readonly scenes: readonly SceneJson[];
};

export const TIMELINE: TimelineJson = timelineJson;

export type SceneId =
  | "s01-hook"
  | "s02-logo"
  | "s03-textbook"
  | "s04-twist"
  | "s05-watch"
  | "s06-two-layers"
  | "s07-destroyed"
  | "s08-cash"
  | "s09-iou"
  | "s10-infinite"
  | "s11-trust"
  | "s12-insurance"
  | "s13-takeaway"
  | "end-card";

/** Overlap between consecutive scenes, in frames: paper transitions run inside it. */
export const TRANSITION_FRAMES = 10;

export const getScene = (id: SceneId): SceneJson => {
  const scene = TIMELINE.scenes.find((s) => s.id === id);
  if (!scene) {
    throw new Error(`Scene ${id} is missing from timeline.json`);
  }
  return scene;
};

const isLastScene = (id: SceneId) => TIMELINE.scenes[TIMELINE.scenes.length - 1].id === id;

/** How long a scene's sequence runs, including the cross-fade into the next scene. */
export const slotDuration = (id: SceneId): number => {
  const s = getScene(id);
  return s.endFrame - s.startFrame + (isLastScene(id) ? 0 : TRANSITION_FRAMES);
};

/**
 * Timing for one scene, in frames relative to the scene's own start (which is
 * what useCurrentFrame() returns inside the scene).
 */
export const sceneTiming = (id: SceneId) => {
  const s = getScene(id);
  return {
    /** Frames until the next scene starts (the cross-fade runs after this). */
    duration: s.endFrame - s.startFrame,
    anchor: s.anchorFrame - s.startFrame,
    /** Frame where the narrator starts the cue phrase. Throws on a typo. */
    cue: (name: string): number => {
      const frame = s.cues[name];
      if (frame === undefined) {
        throw new Error(`Cue "${name}" is missing from scene ${id} in timeline.json`);
      }
      return frame - s.startFrame;
    },
  };
};
