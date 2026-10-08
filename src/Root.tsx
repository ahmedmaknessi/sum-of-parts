import { Composition, Folder, Still } from "remotion";
import { SHORT, VIDEO } from "./brand/tokens";
import { getTotalFrames, toFrames } from "./lib/timeline";
import { BrandShowcase } from "./videos/brand-showcase/BrandShowcase";
import { SCENES, TRANSITION_SECONDS } from "./videos/brand-showcase/scenes";
import { BarChartScene } from "./videos/brand-showcase/scenes/BarChartScene";
import { BrandSystemScene } from "./videos/brand-showcase/scenes/BrandSystemScene";
import { CountersScene } from "./videos/brand-showcase/scenes/CountersScene";
import { EndCardScene } from "./videos/brand-showcase/scenes/EndCardScene";
import { LineChartScene } from "./videos/brand-showcase/scenes/LineChartScene";
import { LogoIntroScene } from "./videos/brand-showcase/scenes/LogoIntroScene";
import { TitleCardScene } from "./videos/brand-showcase/scenes/TitleCardScene";
import { S01Hook } from "./videos/100-a-month-40-years/scenes/S01Hook";
import { S02Logo } from "./videos/100-a-month-40-years/scenes/S02Logo";
import { S03Rules } from "./videos/100-a-month-40-years/scenes/S03Rules";
import { S04Mattress } from "./videos/100-a-month-40-years/scenes/S04Mattress";
import { S05Compounding } from "./videos/100-a-month-40-years/scenes/S05Compounding";
import { S06Why7 } from "./videos/100-a-month-40-years/scenes/S06Why7";
import { S07Curve } from "./videos/100-a-month-40-years/scenes/S07Curve";
import { S08Decades } from "./videos/100-a-month-40-years/scenes/S08Decades";
import { S09TippingPoint } from "./videos/100-a-month-40-years/scenes/S09TippingPoint";
import { S10CostOfWaiting } from "./videos/100-a-month-40-years/scenes/S10CostOfWaiting";
import { S11WhereItCameFrom } from "./videos/100-a-month-40-years/scenes/S11WhereItCameFrom";
import { S12FinePrint } from "./videos/100-a-month-40-years/scenes/S12FinePrint";
import { S13Takeaway } from "./videos/100-a-month-40-years/scenes/S13Takeaway";
import { S14EndCard } from "./videos/100-a-month-40-years/scenes/S14EndCard";
import { shortDuration } from "./videos/100-a-month-40-years/shorts/ShortFrame";
import { ShortComposition, SHORTS } from "./videos/100-a-month-40-years/shorts/Shorts";
import { StyleTestPaperDecadesMixed } from "./videos/100-a-month-40-years/style-test/MixedPaperDecades";
import { PaperPalette } from "./videos/100-a-month-40-years/style-test/PaperPalette";
import { StyleTestPaperDecades, styleTestDuration } from "./videos/100-a-month-40-years/style-test/S08DecadesPaper";
import { slotDuration, TIMELINE } from "./videos/100-a-month-40-years/timeline";
import { Thumbnail01A, Thumbnail01B, Thumbnail01C } from "./videos/100-a-month-40-years/Thumbnail01";
import { Video01 } from "./videos/100-a-month-40-years/Video01";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Video01"
        component={Video01}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={TIMELINE.fps}
        durationInFrames={TIMELINE.totalFrames}
        defaultProps={{ muted: false }}
      />
      <Folder name="Video01-Thumbnails">
        <Still id="Thumbnail01A" component={Thumbnail01A} width={1280} height={720} />
        <Still id="Thumbnail01B" component={Thumbnail01B} width={1280} height={720} />
        <Still id="Thumbnail01C" component={Thumbnail01C} width={1280} height={720} />
      </Folder>
      <Folder name="Video01-Scenes">
        <Composition
          id="V01-S01-Hook"
          component={S01Hook}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s01-hook")}
        />
        <Composition
          id="V01-S02-Logo"
          component={S02Logo}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s02-logo")}
        />
        <Composition
          id="V01-S03-Rules"
          component={S03Rules}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s03-rules")}
        />
        <Composition
          id="V01-S04-Mattress"
          component={S04Mattress}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s04-mattress")}
        />
        <Composition
          id="V01-S05-Compounding"
          component={S05Compounding}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s05-compounding")}
        />
        <Composition
          id="V01-S06-Why7"
          component={S06Why7}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s06-why-7")}
        />
        <Composition
          id="V01-S07-Curve"
          component={S07Curve}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s07-curve")}
        />
        <Composition
          id="V01-S08-Decades"
          component={S08Decades}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s08-decades")}
        />
        <Composition
          id="V01-S09-TippingPoint"
          component={S09TippingPoint}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s09-tipping-point")}
        />
        <Composition
          id="V01-S10-CostOfWaiting"
          component={S10CostOfWaiting}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s10-cost-of-waiting")}
        />
        <Composition
          id="V01-S11-WhereItCameFrom"
          component={S11WhereItCameFrom}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s11-where-it-came-from")}
        />
        <Composition
          id="V01-S12-FinePrint"
          component={S12FinePrint}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s12-fine-print")}
        />
        <Composition
          id="V01-S13-Takeaway"
          component={S13Takeaway}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("s13-takeaway")}
        />
        <Composition
          id="V01-S14-EndCard"
          component={S14EndCard}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={TIMELINE.fps}
          durationInFrames={slotDuration("end-card")}
        />
      </Folder>
      <Folder name="Style-Tests">
        <Still id="PaperPalette" component={PaperPalette} width={VIDEO.width} height={VIDEO.height} />
        <Composition
          id="StyleTestPaperDecades"
          component={StyleTestPaperDecades}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={styleTestDuration()}
          defaultProps={{ theme: "dark" as const }}
        />
        <Composition
          id="StyleTestPaperDecadesLight"
          component={StyleTestPaperDecades}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={styleTestDuration()}
          defaultProps={{ theme: "light" as const }}
        />
        <Composition
          id="StyleTestPaperDecadesMixed"
          component={StyleTestPaperDecadesMixed}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={styleTestDuration()}
        />
      </Folder>
      <Folder name="Video01-Shorts">
        {SHORTS.map((short) => (
          <Composition
            key={short.id}
            id={short.id}
            component={ShortComposition}
            width={SHORT.width}
            height={SHORT.height}
            fps={SHORT.fps}
            durationInFrames={shortDuration(short.scene)}
            defaultProps={{ short: short.id }}
          />
        ))}
      </Folder>
      <Composition
        id="BrandShowcase"
        component={BrandShowcase}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={getTotalFrames(SCENES, VIDEO.fps, TRANSITION_SECONDS)}
      />
      <Folder name="BrandShowcase-Scenes">
        <Composition
          id="Showcase-LogoIntro"
          component={LogoIntroScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={toFrames(SCENES.logoIntro, VIDEO.fps)}
        />
        <Composition
          id="Showcase-BrandSystem"
          component={BrandSystemScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={toFrames(SCENES.brandSystem, VIDEO.fps)}
        />
        <Composition
          id="Showcase-TitleCard"
          component={TitleCardScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={toFrames(SCENES.titleCard, VIDEO.fps)}
        />
        <Composition
          id="Showcase-Counters"
          component={CountersScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={toFrames(SCENES.counters, VIDEO.fps)}
        />
        <Composition
          id="Showcase-BarChart"
          component={BarChartScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={toFrames(SCENES.barChart, VIDEO.fps)}
        />
        <Composition
          id="Showcase-LineChart"
          component={LineChartScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={toFrames(SCENES.lineChart, VIDEO.fps)}
        />
        <Composition
          id="Showcase-EndCard"
          component={EndCardScene}
          width={VIDEO.width}
          height={VIDEO.height}
          fps={VIDEO.fps}
          durationInFrames={toFrames(SCENES.endCard, VIDEO.fps)}
        />
      </Folder>
    </>
  );
};
