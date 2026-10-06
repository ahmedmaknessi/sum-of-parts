import { useVideoConfig } from "remotion";
import { Background, TitleCard } from "../../../components";

export const TitleCardScene: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Background>
      <TitleCard
        name="Title card"
        premountFor={fps}
        question="Why does $100 buy less every year?"
        highlight="less"
        subtitle="The quiet math of inflation"
      />
    </Background>
  );
};
