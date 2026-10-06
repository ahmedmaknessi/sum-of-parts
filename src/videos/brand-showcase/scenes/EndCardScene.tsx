import { useVideoConfig } from "remotion";
import { Background, EndCard } from "../../../components";

export const EndCardScene: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Background>
      <EndCard
        name="End card"
        premountFor={fps}
        subscribeTitle="Subscribe"
        subscribePrompt="One money question, answered with data."
        leftLabel="Watch next"
        rightLabel="You might also like"
      />
    </Background>
  );
};
