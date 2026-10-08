/**
 * Shape of each video's timeline-spec.ts, the input of scripts/build-timeline.ts:
 * scene anchors and cue phrases, written as they appear in voiceover.txt.
 * A cue is the START of its phrase unless marked `at: "end"`.
 */
export type CueSpec = string | { readonly phrase: string; readonly at: "start" | "end" };

export type SceneSpec = {
  readonly id: string;
  /** First words of the scene. Searched forward from the previous scene. */
  readonly anchor: string;
  readonly cues: Readonly<Record<string, CueSpec>>;
};

export type TimelineSpec = {
  readonly fps: number;
  /** Scene visuals start this many frames before their anchor word. */
  readonly sceneLeadFrames: number;
  readonly logo: {
    readonly id: string;
    /** Logo goes after the scene that ends with this phrase. */
    readonly afterPhrase: string;
    /** Pause between the last word and the logo. */
    readonly breathingRoomSec: number;
    readonly durationSec: number;
    /** Voice resumes this long after the logo ends. */
    readonly resumeLeadSec: number;
  };
  readonly endCard: {
    readonly id: string;
    readonly afterPhrase: string;
    readonly gapSec: number;
    readonly durationSec: number;
  };
  readonly scenes: readonly SceneSpec[];
};
