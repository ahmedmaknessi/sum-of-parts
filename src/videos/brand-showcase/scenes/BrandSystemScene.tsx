import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  COLORS,
  DURATION,
  FONT,
  SPACE,
  STROKE,
  TEXT_OPACITY,
  TYPE,
  type BrandColor,
} from "../../../brand/tokens";
import { Background } from "../../../components";
import { mix, progress } from "../../../lib/motion";

const SWATCHES: readonly { key: BrandColor; name: string }[] = [
  { key: "background", name: "Navy" },
  { key: "primary", name: "Cream" },
  { key: "accent", name: "Amber" },
  { key: "teal", name: "Teal" },
  { key: "blue", name: "Blue" },
  { key: "coral", name: "Coral" },
  { key: "muted", name: "Muted" },
  { key: "mutedStrong", name: "Muted strong" },
];

const SWATCH_SIZE = 168;
const SWATCH_GAP = 32;

/** The palette and type scale, for checking the system at a glance. */
export const BrandSystemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingIn = progress(frame, fps, { duration: DURATION.base });
  const typeIn = progress(frame, fps, { start: 1.4, duration: DURATION.base });

  return (
    <Background>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 150,
          textAlign: "center",
          fontSize: TYPE.h2,
          fontWeight: FONT.weight.heading,
          opacity: headingIn,
        }}
      >
        The brand system
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 340,
          display: "flex",
          justifyContent: "center",
          gap: SWATCH_GAP,
        }}
      >
        {SWATCHES.map((swatch, i) => {
          const p = progress(frame, fps, {
            start: 0.3 + i * DURATION.stagger,
            duration: DURATION.base,
          });
          return (
            <div
              key={swatch.key}
              style={{
                width: SWATCH_SIZE,
                opacity: p,
                translate: `0px ${mix(24, 0, p)}px`,
              }}
            >
              <div
                style={{
                  width: SWATCH_SIZE,
                  height: SWATCH_SIZE,
                  backgroundColor: COLORS[swatch.key],
                  boxSizing: "border-box",
                  border:
                    swatch.key === "background"
                      ? `${STROKE.hairline}px solid ${COLORS.mutedStrong}`
                      : "none",
                }}
              />
              <div style={{ marginTop: SPACE.sm, fontSize: 26, fontWeight: FONT.weight.heading }}>
                {swatch.name}
              </div>
              <div style={{ fontSize: 24, opacity: TEXT_OPACITY.tertiary }}>
                {COLORS[swatch.key]}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 760,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: SPACE.xl,
          opacity: typeIn,
        }}
      >
        <div style={{ fontSize: TYPE.h2, fontWeight: FONT.weight.heading }}>
          Outfit 700 headings
        </div>
        <div
          style={{
            fontSize: TYPE.body,
            fontWeight: FONT.weight.body,
            opacity: TEXT_OPACITY.secondary,
          }}
        >
          Outfit 500 body
        </div>
      </div>
    </Background>
  );
};
