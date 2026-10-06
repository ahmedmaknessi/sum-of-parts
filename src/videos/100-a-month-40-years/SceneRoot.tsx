import type React from "react";
import { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONT } from "../../brand/tokens";
import { Background } from "../../components";

/** True inside Video01, where one shared background sits under every scene. */
export const InVideo01 = createContext(false);

type SceneRootProps = {
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/**
 * Root of every video 01 scene. Inside the full video the scene is transparent
 * over the shared, never re-animating background. Opened on its own in Studio,
 * it draws the background itself so the preview looks the same.
 */
export const SceneRoot: React.FC<SceneRootProps> = ({ children, style }) => {
  const inVideo = useContext(InVideo01);
  const content = (
    <AbsoluteFill
      style={{
        fontFamily: FONT.family,
        fontWeight: FONT.weight.body,
        color: COLORS.primary,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
  return inVideo ? content : <Background>{content}</Background>;
};
