import type React from "react";
import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE, FONT, TEXT_OPACITY, TYPE, VIDEO } from "../../../brand/tokens";
import { PaperBackground } from "../../../components/paper/PaperBackground";
import { At, PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { PaperText } from "../../../components/paper/PaperText";
import { paperPolygon, paperRoundRect } from "../../../components/paper/paperPath";
import { ramp } from "../../../lib/motion";
import { onTwos } from "../../../lib/paper-motion";
import { enter, Label } from "../../../components/paper/kit";
import { SceneAudio } from "../SceneAudio";
import { InVideo03 } from "../SceneRoot";
import { S01Hook } from "../scenes/S01Hook";
import { S05Zimbabwe } from "../scenes/S05Zimbabwe";
import { S06Us } from "../scenes/S06Us";
import { CAPTIONS, toPages } from "../shorts/ShortFrame";
import { Thumbnail03A } from "../Thumbnail03";
import { THEME } from "../theme";
import { getScene, sceneTiming, TRANSITION_FRAMES, type SceneId } from "../timeline";
import { SheetWipe, SHEET_FRAMES } from "../../money-in-your-bank-doesnt-exist/Video02";

/**
 * Facebook teaser (16:9, about 69 s) that leads to the full video on YouTube:
 * the hook, Zimbabwe at its peak, and the question of why the US did not
 * become Zimbabwe, then a call-to-action card. It asks the question without
 * the answer. Captions are burned in under the picture (Facebook autoplays muted).
 */
type Clip = { readonly scene: SceneId; readonly Component: React.FC; readonly from: number; readonly to: number };

/** [scene, start, end] in frames relative to the scene. */
const CLIPS: readonly Clip[] = [
  { scene: "s01-hook", Component: S01Hook, from: 0, to: sceneTiming("s01-hook").duration },
  // "At the peak ... Saving was pointless."
  { scene: "s05-zimbabwe", Component: S05Zimbabwe, from: sceneTiming("s05-zimbabwe").cue("peak") - 6, to: sceneTiming("s05-zimbabwe").cue("spend") },
  // "So why didn't America become Zimbabwe? ... it wasn't hyperinflation."
  { scene: "s06-us", Component: S06Us, from: sceneTiming("s06-us").cue("whyNot") - 6, to: sceneTiming("s06-us").duration },
];
/** The call to action at the end. */
const CTA_FRAMES = 8 * VIDEO.fps;

const clipLength = (c: Clip) => c.to - c.from;
const OFFSETS = CLIPS.map((_, i) => CLIPS.slice(0, i).reduce((s, c) => s + clipLength(c), 0));
const CTA_AT = CLIPS.reduce((s, c) => s + clipLength(c), 0);
export const FACEBOOK_TEASER_FRAMES = CTA_AT + CTA_FRAMES;

/** The picture shrinks a little to leave a caption band at the bottom. */
const PICTURE_SCALE = 0.86;
const CAPTION_Y = VIDEO.height * PICTURE_SCALE + (VIDEO.height * (1 - PICTURE_SCALE)) / 2;

/** Burned-in captions for one clip (absolute frames of the full video). */
const ClipCaptions: React.FC<{ readonly from: number; readonly to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fromMs = (from / fps) * 1000;
  const toMs = (to / fps) * 1000;
  const pages = toPages(CAPTIONS.filter((c) => c.startMs >= fromMs && c.startMs < toMs), 46);
  const nowMs = ((from + frame) / fps) * 1000;
  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.endMs);
  if (!page) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: CAPTION_Y - 34,
        textAlign: "center",
        fontFamily: FONT.family,
        fontSize: 56,
        fontWeight: FONT.weight.heading,
        lineHeight: 1.1,
        color: THEME.ink,
      }}
    >
      {page.words.map((w, i) => (
        <span key={i} style={{ opacity: nowMs >= w.startMs ? 1 : TEXT_OPACITY.tertiary }}>
          {w.text}
        </span>
      ))}
    </div>
  );
};

/** The call-to-action card: the YouTube thumbnail, the title and where to watch. */
const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const thumb = enter(frame, 4, { from: [0, -700], dur: 16, seed: 2501, wobbleDeg: 2 });
  const play = enter(frame, 18, { from: [0, -300], dur: 10, seed: 2502, wobbleDeg: 4 });
  const line = enter(frame, 24, { from: [0, 300], dur: 12, seed: 2503 });
  const title = enter(frame, 34, { from: [0, 300], dur: 12, seed: 2504 });
  const pulse = 1 + 0.04 * Math.sin(Math.PI * ramp(onTwos(frame), 90, 20, EASE.inOut));
  const T = { w: 1280, h: 720, scale: 0.62 } as const;
  return (
    <AbsoluteBoard>
      {thumb.on ? (
        <Piece x={VIDEO.width / 2 + thumb.dx} y={360 + thumb.dy} rotate={thumb.rotate - 2}>
          <PaperSvg w={T.w * T.scale + 80} h={T.h * T.scale + 80}>
            <PaperShape
              d={paperRoundRect((-T.w * T.scale) / 2 - 16, (-T.h * T.scale) / 2 - 16, T.w * T.scale + 32, T.h * T.scale + 32, 18, { seed: 2505 })}
              fill={THEME.ink}
              depth={2 + thumb.lift}
              shadowOpacity={THEME.shadow}
            />
          </PaperSvg>
          <div
            style={{
              position: "absolute",
              left: (-T.w * T.scale) / 2,
              top: (-T.h * T.scale) / 2,
              width: T.w * T.scale,
              height: T.h * T.scale,
              overflow: "hidden",
              borderRadius: 8,
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, width: T.w, height: T.h, scale: T.scale, transformOrigin: "0 0" }}>
              <Thumbnail03A />
            </div>
          </div>
          {play.on ? (
            <Piece x={play.dx} y={play.dy} rotate={play.rotate} scale={pulse}>
              <PaperSvg w={260} h={200}>
                <PaperShape d={paperRoundRect(-100, -70, 200, 140, 36, { seed: 2506 })} fill={COLORS.coral} depth={2.4} shadowOpacity={THEME.shadow} />
                <PaperShape
                  d={paperPolygon(
                    [
                      [-26, -38],
                      [40, 0],
                      [-26, 38],
                    ],
                    { seed: 2507 },
                  )}
                  fill={COLORS.primary}
                  depth={0.6}
                  shadowOpacity={THEME.shadow}
                />
              </PaperSvg>
            </Piece>
          ) : null}
        </Piece>
      ) : null}
      {line.on ? (
        <Piece x={VIDEO.width / 2 + line.dx} y={770 + line.dy} rotate={line.rotate - 1}>
          <Label text="Watch the full video on YouTube" fontSize={64} strip={THEME.amber} depth={1.8 + line.lift} seed={2508} />
        </Piece>
      ) : null}
      {title.on ? (
        <Piece x={VIDEO.width / 2 + title.dx} y={890 + title.dy}>
          <At x={0} y={0}>
            <PaperText color={THEME.ink} fontSize={TYPE.body} depth={0.8} shadowOpacity={THEME.shadow}>
              {"“Why Can't Countries Just Print More Money?”  ·  Sum of Parts"}
            </PaperText>
          </At>
        </Piece>
      ) : null}
    </AbsoluteBoard>
  );
};

const AbsoluteBoard: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0 }}>{children}</div>
);

export const FacebookTeaser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = ramp(frame, 0, TRANSITION_FRAMES, EASE.inOut);
  return (
    <PaperBackground board={THEME.board} ink={THEME.ink}>
      <InVideo03.Provider value>
        {CLIPS.map((c, i) => {
          const start = getScene(c.scene).startFrame;
          return (
            <Sequence key={c.scene} name={`Clip ${c.scene}`} from={OFFSETS[i]} durationInFrames={clipLength(c)} premountFor={fps}>
              <SceneAudio from={start + c.from} to={start + c.to} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  scale: PICTURE_SCALE,
                  transformOrigin: "50% 0%",
                  opacity: i === 0 ? fadeIn : 1,
                }}
              >
                <Sequence from={-c.from} premountFor={fps}>
                  <c.Component />
                </Sequence>
              </div>
              <ClipCaptions from={start + c.from} to={start + c.to} />
            </Sequence>
          );
        })}
        {/* The end card's music (no voice there) under the call to action */}
        <Sequence name="Call to action" from={CTA_AT} durationInFrames={CTA_FRAMES}>
          <SceneAudio from={getScene("end-card").startFrame} to={getScene("end-card").startFrame + CTA_FRAMES} musicFade={20} />
          <CallToAction />
        </Sequence>
        {/* Paper wipes at every cut */}
        {[...OFFSETS.slice(1), CTA_AT].map((at) => (
          <Sequence key={`w${at}`} name="Paper wipe" from={at - SHEET_FRAMES / 2} durationInFrames={SHEET_FRAMES}>
            <SheetWipe />
          </Sequence>
        ))}
      </InVideo03.Provider>
    </PaperBackground>
  );
};
