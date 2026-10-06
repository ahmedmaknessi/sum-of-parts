import { useVideoConfig } from "remotion";
import {
  Background,
  BarChart,
  Callout,
  getBarAnchor,
  SourceLowerThird,
  type BarDatum,
} from "../../../components";

/** Illustrative data only. */
const DATA: BarDatum[] = [
  { label: "Housing", value: 1400, highlight: true },
  { label: "Food", value: 620 },
  { label: "Transport", value: 480 },
  { label: "Savings", value: 400 },
  { label: "Everything else", value: 1100 },
];

export const BarChartScene: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Background>
      <BarChart
        name="Bar chart"
        premountFor={fps}
        title="Where a $4,000 paycheck goes"
        data={DATA}
        unit="currency"
      />
      <Callout
        name="Housing callout"
        from={2 * fps}
        premountFor={fps}
        target={getBarAnchor({ data: DATA }, 0, "right")}
        text="35% of take-home pay"
        direction="up-right"
        length={90}
        ring={false}
      />
      <SourceLowerThird
        name="Source"
        from={1 * fps}
        premountFor={fps}
        source="Illustrative data"
      />
    </Background>
  );
};
