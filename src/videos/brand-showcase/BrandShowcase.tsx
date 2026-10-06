import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useVideoConfig } from "remotion";
import { EASE } from "../../brand/tokens";
import { toFrames } from "../../lib/timeline";
import { SCENES, TRANSITION_SECONDS } from "./scenes";
import { BarChartScene } from "./scenes/BarChartScene";
import { BrandSystemScene } from "./scenes/BrandSystemScene";
import { CountersScene } from "./scenes/CountersScene";
import { EndCardScene } from "./scenes/EndCardScene";
import { LineChartScene } from "./scenes/LineChartScene";
import { LogoIntroScene } from "./scenes/LogoIntroScene";
import { TitleCardScene } from "./scenes/TitleCardScene";

/** Every brand component, one after another. Timing comes from scenes.ts. */
export const BrandShowcase: React.FC = () => {
  const { fps } = useVideoConfig();
  const crossfade = linearTiming({
    durationInFrames: toFrames(TRANSITION_SECONDS, fps),
    easing: EASE.inOut,
  });

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence
        name="Logo intro"
        durationInFrames={toFrames(SCENES.logoIntro, fps)}
        premountFor={fps}
      >
        <LogoIntroScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={crossfade} />
      <TransitionSeries.Sequence
        name="Brand system"
        durationInFrames={toFrames(SCENES.brandSystem, fps)}
        premountFor={fps}
      >
        <BrandSystemScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={crossfade} />
      <TransitionSeries.Sequence
        name="Title card"
        durationInFrames={toFrames(SCENES.titleCard, fps)}
        premountFor={fps}
      >
        <TitleCardScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={crossfade} />
      <TransitionSeries.Sequence
        name="Counters"
        durationInFrames={toFrames(SCENES.counters, fps)}
        premountFor={fps}
      >
        <CountersScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={crossfade} />
      <TransitionSeries.Sequence
        name="Bar chart"
        durationInFrames={toFrames(SCENES.barChart, fps)}
        premountFor={fps}
      >
        <BarChartScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={crossfade} />
      <TransitionSeries.Sequence
        name="Line chart"
        durationInFrames={toFrames(SCENES.lineChart, fps)}
        premountFor={fps}
      >
        <LineChartScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={crossfade} />
      <TransitionSeries.Sequence
        name="End card"
        durationInFrames={toFrames(SCENES.endCard, fps)}
        premountFor={fps}
      >
        <EndCardScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
