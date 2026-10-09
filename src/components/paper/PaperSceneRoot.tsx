import type React from "react";
import { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "../../brand/tokens";
import { PaperBackground } from "./PaperBackground";
import { THEME } from "./theme";

/** True inside a full papercut video, where one shared paper board sits under every scene. */
export const InPaperVideo = createContext(false);

type PaperSceneRootProps = {
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/**
 * Root of every papercut scene (light paper): transparent over the shared
 * board inside the full video, drawing the cream paper board itself when the
 * scene is previewed alone.
 */
export const PaperSceneRoot: React.FC<PaperSceneRootProps> = ({ children, style }) => {
  const inVideo = useContext(InPaperVideo);
  const content = (
    <AbsoluteFill style={{ fontFamily: FONT.family, fontWeight: FONT.weight.body, color: THEME.ink, ...style }}>{children}</AbsoluteFill>
  );
  return inVideo ? content : <PaperBackground board={THEME.board} ink={THEME.ink}>{content}</PaperBackground>;
};
