import type React from "react";
import { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "../../brand/tokens";
import { PaperBackground } from "../../components/paper/PaperBackground";
import { THEME } from "./theme";

/** True inside Video02, where one shared paper board sits under every scene. */
export const InVideo02 = createContext(false);

type SceneRootProps = {
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/**
 * Root of every video 02 scene: transparent over the shared board inside the
 * full video, and drawing the cream paper board itself when previewed alone.
 */
export const SceneRoot: React.FC<SceneRootProps> = ({ children, style }) => {
  const inVideo = useContext(InVideo02);
  const content = (
    <AbsoluteFill style={{ fontFamily: FONT.family, fontWeight: FONT.weight.body, color: THEME.ink, ...style }}>
      {children}
    </AbsoluteFill>
  );
  return inVideo ? content : <PaperBackground board={THEME.board} ink={THEME.ink}>{content}</PaperBackground>;
};
