import type React from "react";
import { useVideoConfig } from "remotion";
import { LogoIntro } from "../../../components";
import { SceneRoot } from "../SceneRoot";

/** 3.0s logo intro, no voiceover. Length comes from timeline.json. */
export const S02Logo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <SceneRoot>
      <LogoIntro name="Logo intro" premountFor={fps} channelName="Sum of Parts" />
    </SceneRoot>
  );
};
