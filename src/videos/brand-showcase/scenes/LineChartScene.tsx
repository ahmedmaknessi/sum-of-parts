import { useVideoConfig } from "remotion";
import {
  Background,
  Callout,
  getLinePoint,
  LineChart,
  SourceLowerThird,
  type LineHighlight,
  type LineSeries,
} from "../../../components";

const YEARS = Array.from({ length: 31 }, (_, i) => i);
const LABELS = YEARS.map((y) => `Year ${y}`);

/** $10,000 compounding at 7% a year vs. the same $10,000 left in cash. */
const SERIES: LineSeries[] = [
  {
    label: "Invested at 7%",
    values: YEARS.map((y) => Math.round(10000 * 1.07 ** y)),
    color: "primary",
  },
  {
    label: "Kept in cash",
    values: YEARS.map(() => 10000),
    color: "teal",
  },
];

const HIGHLIGHT: LineHighlight = { series: 0, index: 30 };

export const LineChartScene: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Background>
      <LineChart
        name="Line chart"
        premountFor={fps}
        title="$10,000 over 30 years"
        labels={LABELS}
        series={SERIES}
        highlight={HIGHLIGHT}
        unit="currency"
        compact
        xLabelEvery={5}
      />
      <Callout
        name="Curve callout"
        from={2.6 * fps}
        premountFor={fps}
        target={getLinePoint({ labels: LABELS, series: SERIES }, 0, 20)}
        text="Growth speeds up over time"
        direction="down-right"
        length={160}
        accent={false}
      />
      <SourceLowerThird
        name="Source"
        from={1 * fps}
        premountFor={fps}
        label="Method"
        source="Compound interest, 7% a year"
      />
    </Background>
  );
};
