/**
 * Video 02 is LIGHT PAPER (BUILD_NOTES.md): cream board, navy as a paper
 * colour, objects from the vivid paper palette, amber as a paper shape.
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
