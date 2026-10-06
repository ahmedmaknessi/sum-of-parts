import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../../../brand/tokens";
import { mix, ramp } from "../../../lib/motion";
import { MATTRESS_SEGMENTS, MattressBar } from "../parts/MattressBar";
import { SceneRoot } from "../SceneRoot";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s04-mattress");

const ENTER = 15;
/** Each year's segment pops in over this many frames. */
const SEGMENT_POP = 4;

export const S04Mattress: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = {
    bar: T.cue("barAppears"),
    fortyEight: T.cue("fortyEight"),
    keep: T.cue("keepInMind"),
  };

  // 40 segments, evenly spaced so the last one completes exactly on "forty-eight thousand dollars".
  const fillStart = cue.bar + ENTER;
  const step = (cue.fortyEight - fillStart) / MATTRESS_SEGMENTS;
  const segments = Array.from({ length: MATTRESS_SEGMENTS }, (_, i) => {
    const done = fillStart + (i + 1) * step;
    return ramp(frame, done - SEGMENT_POP, SEGMENT_POP, EASE.out);
  });

  // "First, the boring version": an empty dashed slot waits where the bar will rise.
  const slotIn = ramp(frame, T.anchor, 20, EASE.out);
  const outlineIn = ramp(frame, cue.bar, ENTER, EASE.out);
  const labelIn = ramp(frame, cue.fortyEight, ENTER);

  // "Keep that number in mind" -> fill fades to a 30% outline, then it slides to the baseline chip.
  const dim = ramp(frame, cue.keep, 20, EASE.out);
  const toChip = ramp(frame, cue.keep + 10, 36, EASE.inOut);

  // Gentle push while "$48,000" holds, released as the bar becomes the chip.
  const push = interpolate(frame, [cue.fortyEight, cue.keep], [1, 1.025], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // At the scene's end the identical baseline chip overlay in Video01 takes over,
  // so this copy disappears instead of cross-fading on top of it.
  const handedOver = frame >= T.duration;

  return (
    <SceneRoot>
      <div style={{ position: "absolute", inset: 0, scale: mix(push, 1, toChip), opacity: handedOver ? 0 : 1 }}>
        <MattressBar slotIn={slotIn} outlineIn={outlineIn} segments={segments} labelIn={labelIn} dim={dim} toChip={toChip} />
      </div>
    </SceneRoot>
  );
};
