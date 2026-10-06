import type React from "react";
import { useVideoConfig } from "remotion";
import { EndCard } from "../../../components";
import { SceneRoot } from "../SceneRoot";

/**
 * 20s end card. The two slots only reserve space: the real video suggestions
 * are placed in YouTube's end screen editor (positions in END_CARD_LAYOUT).
 * Static on purpose, so the slots line up with YouTube's elements.
 */
export const S14EndCard: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <SceneRoot>
      <EndCard
        name="End card"
        premountFor={fps}
        subscribeTitle="Subscribe"
        subscribePrompt="One money question, answered with data."
        leftLabel="Coming soon"
        rightLabel="Coming soon"
      />
    </SceneRoot>
  );
};
