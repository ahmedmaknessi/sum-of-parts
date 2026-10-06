import { useVideoConfig } from "remotion";
import { Background, LogoIntro } from "../../../components";

export const LogoIntroScene: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Background>
      <LogoIntro name="Logo intro" premountFor={fps} channelName="Sum of Parts" />
    </Background>
  );
};
