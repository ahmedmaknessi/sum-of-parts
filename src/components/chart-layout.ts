/** Where a chart's plot sits in the 1920x1080 frame, in px. */
export type ChartFrame = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Default plot area: leaves room for a title above and labels below. */
export const DEFAULT_CHART_FRAME: ChartFrame = {
  x: 192,
  y: 256,
  width: 1536,
  height: 576,
};

/** A point in composition coordinates (px from the top-left of the frame). */
export type Point = {
  readonly x: number;
  readonly y: number;
};

/** Gap between a chart title and the top of the plot. */
export const TITLE_GAP = 72;
