/**
 * The LIGHT PAPER theme (videos 02, 03): cream board, navy as a paper colour,
 * objects from the vivid paper palette, amber as a paper shape. The shared
 * paper kit (kit.tsx, machine.tsx) is drawn in this theme.
 */
import { COLORS, PAPER, PAPER_COLORS } from "../../brand/tokens";

export const THEME = {
  board: COLORS.primary,
  /** Text and dark paper pieces. */
  ink: COLORS.background,
  /** Shadow strength on the cream board. */
  shadow: PAPER.shadow.opacityOnLight,
  /** Light paper pieces that must stand out on the cream board. */
  card: PAPER_COLORS.sky.light,
  slate: COLORS.mutedStrong,
  amber: COLORS.accent,
} as const;
