import { useVideoConfig } from "remotion";
import { Background, NumberCounter } from "../../../components";

/** Three counters side by side: currency + compact, percent, plain number. */
export const CountersScene: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Background>
      <NumberCounter
        name="Currency counter"
        premountFor={fps}
        value={1240000}
        unit="currency"
        compact
        highlight={false}
        fontSize={140}
        label="Compact currency"
        style={{ left: 0, width: 640 }}
      />
      <NumberCounter
        name="Percent counter"
        from={0.3 * fps}
        premountFor={fps}
        value={7.3}
        unit="percent"
        decimals={1}
        highlight
        fontSize={140}
        label="Percent, the key number"
        style={{ left: 640, width: 640 }}
      />
      <NumberCounter
        name="Plain counter"
        from={0.6 * fps}
        premountFor={fps}
        value={48210}
        highlight={false}
        fontSize={140}
        label="Plain with separators"
        style={{ left: 1280, width: 640 }}
      />
    </Background>
  );
};
