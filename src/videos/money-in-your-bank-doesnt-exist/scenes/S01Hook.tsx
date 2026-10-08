import type React from "react";
import { useCurrentFrame } from "remotion";
import {
  COLORS,
  EASE,
  FONT,
  PAPER_COLORS,
  TEXT_OPACITY,
} from "../../../brand/tokens";
import { At, PaperSvg, Piece } from "../../../components/paper/Piece";
import { PaperShape } from "../../../components/paper/PaperShape";
import { PaperText } from "../../../components/paper/PaperText";
import {
  jitter,
  paperCircle,
  paperRect,
  paperRoundRect,
} from "../../../components/paper/paperPath";
import { formatUSD } from "../../../lib/finance";
import { mix, ramp } from "../../../lib/motion";
import { idleJitter, onTwos, placed } from "../../../lib/paper-motion";
import { LABELS } from "../data";
import { SceneRoot } from "../SceneRoot";
import { THEME } from "../theme";
import { sceneTiming } from "../timeline";

const T = sceneTiming("s01-hook");

// --- Layout (px at 1920x1080) -------------------------------------------------
const PHONE = { x: 960, y: 560, w: 460, h: 780 } as const;
const CARD = {
  w: 380,
  h: 220,
  inPhoneY: 440,
  peeledY: 320,
  centreY: 430,
} as const;
const VAULT = { x: 1420, y: 560, r: 230 } as const;
const TILE = { w: 58, h: 92, comma: 26, gap: 4, font: 80 } as const;
/** Card scale once it is alone in the middle, and the camera pull-back target. */
const CARD_BIG = 1.6;
const PULL_BACK_SCALE = 0.12;
/** Grid of other people's cards revealed by the pull-back (world px around the card). */
const GRID = { cols: 12, rows: 12, pitchX: 760, pitchY: 440 } as const;

const CHARS = LABELS.balance.split("");
const tileWidth = (c: string) => (c === "," ? TILE.comma : TILE.w);
const TILES_W = CHARS.reduce(
  (sum, c) => sum + tileWidth(c) + TILE.gap,
  -TILE.gap,
);
const tileX = CHARS.map(
  (_, i) =>
    -TILES_W / 2 +
    CHARS.slice(0, i).reduce((s, c) => s + tileWidth(c) + TILE.gap, 0) +
    tileWidth(CHARS[i]) / 2,
);
const TILES_Y = 22;

// --- Static paths (built once: shapes never flicker) ----------------------------
const PHONE_BODY = paperRoundRect(
  -PHONE.w / 2,
  -PHONE.h / 2,
  PHONE.w,
  PHONE.h,
  56,
  { seed: 1 },
);
const PHONE_SCREEN = paperRoundRect(
  -PHONE.w / 2 + 30,
  -PHONE.h / 2 + 70,
  PHONE.w - 60,
  PHONE.h - 160,
  26,
  { seed: 2 },
);
const PHONE_SPEAKER = paperRoundRect(-50, -PHONE.h / 2 + 30, 100, 14, 7, {
  seed: 3,
});
const PHONE_BUTTON = paperCircle(0, PHONE.h / 2 - 46, 22, { seed: 4 });
const CARD_BACK = paperRoundRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 22, {
  seed: 5,
});
const CARD_FRONT = paperRoundRect(
  -CARD.w / 2,
  -CARD.h / 2,
  CARD.w,
  CARD.h,
  22,
  { seed: 6 },
);
const tilePath = (c: string, i: number) =>
  paperRoundRect(-tileWidth(c) / 2, -TILE.h / 2, tileWidth(c), TILE.h, 8, {
    seed: 20 + i,
  });
const VAULT_OUTER = paperCircle(0, 0, VAULT.r, { seed: 30 });
const VAULT_FACE = paperCircle(0, 0, VAULT.r - 46, { seed: 31 });
const VAULT_HUB = paperCircle(0, 0, 44, { seed: 32 });
const VAULT_SPOKE = paperRect(-14, -120, 28, 240, { seed: 33 });
const VAULT_BOLTS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return paperCircle(
    Math.cos(a) * (VAULT.r - 24),
    Math.sin(a) * (VAULT.r - 24),
    13,
    { seed: 40 + i },
  );
}).join(" ");
const TAG = paperRoundRect(-125, 0, 250, 84, 14, { seed: 50 });
const STRIP = paperRect(-290, -44, 580, 88, { seed: 51, torn: "ends" });
const PROMISE_STRIP = paperRect(-330, -80, 660, 160, {
  seed: 52,
  torn: "ends",
});

/** Other people's balances on the grid: decorative, seeded, never data. */
const GRID_CELLS = Array.from(
  { length: (2 * GRID.cols + 1) * (2 * GRID.rows + 1) },
  (_, k) => {
    const c = (k % (2 * GRID.cols + 1)) - GRID.cols;
    const r = Math.floor(k / (2 * GRID.cols + 1)) - GRID.rows;
    const amount =
      Math.round((500 + ((jitter(77, k) + 1) / 2) * 89_500) / 10) * 10;
    return { c, r, label: formatUSD(amount), dist: Math.hypot(c, r) };
  },
).filter((cell) => cell.c !== 0 || cell.r !== 0);
const cw = CARD.w * CARD_BIG;
const ch = CARD.h * CARD_BIG;
const GRID_BACKS = GRID_CELLS.map((g, i) =>
  paperRoundRect(
    g.c * GRID.pitchX - cw / 2,
    g.r * GRID.pitchY - ch / 2,
    cw,
    ch,
    34,
    { seed: 100 + i },
  ),
).join(" ");

export const S01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const f2 = onTwos(frame);
  const cue = {
    balance: T.cue("balance"),
    whereIs: T.cue("whereIs"),
    notInVault: T.cue("notInVault"),
    nameOnIt: T.cue("nameOnIt"),
    stranger: T.cue("stranger"),
    holding: T.cue("holding"),
    promise: T.cue("promise"),
    mostMoney: T.cue("mostMoney"),
  };

  // Phone slides up from below and lands with a wobble; leaves at "The truth is stranger".
  const phoneIn = placed(frame, 0, 18, { seed: 1 });
  const phoneOut = ramp(f2, cue.stranger, 16, EASE.in);
  const phoneY = mix(PHONE.y + 900, PHONE.y, phoneIn.t) + phoneOut * 900;

  // The balance card: in the phone, peels out on "where is that money", centres on "stranger".
  const peel = placed(frame, cue.whereIs, 16, { seed: 2, wobbleDeg: 3 });
  const centre = placed(frame, cue.stranger + 4, 18, { seed: 3, wobbleDeg: 2 });
  const cardY = mix(
    mix(phoneY - PHONE.y + CARD.inPhoneY, CARD.peeledY, peel.t),
    CARD.centreY,
    centre.t,
  );
  const cardScale = mix(mix(1, 1.25, peel.t), CARD_BIG, centre.t);
  // Lies in the phone (0.6), floats above it once peeled (2.6), settles lower when centred (1.6).
  const cardDepth =
    mix(mix(0.6, 2.6, peel.t), 1.6, centre.t) + centre.lift * 0.6;

  // Vault slides in from the right, gets its name tag, then an amber strip slaps across it.
  const vaultIn = placed(frame, cue.notInVault, 16, { seed: 4 });
  const vaultOut = ramp(f2, cue.stranger, 16, EASE.in);
  const vaultX = mix(VAULT.x + 900, VAULT.x, vaultIn.t) + vaultOut * 900;
  const tag = placed(frame, cue.nameOnIt, 12, { seed: 5, wobbleDeg: 6 });
  const slap = placed(frame, cue.nameOnIt + 22, 8, { seed: 6, wobbleDeg: 2 });

  // "isn't money the bank is holding": the digits loosen; "It's a promise": they fly off.
  const loosen = ramp(f2, cue.holding, 20, EASE.inOut);
  const flyStart = (i: number) => cue.promise + 2 + i * 4;
  const promiseIn = placed(frame, cue.promise + 2 + CHARS.length * 4 + 6, 14, {
    seed: 7,
    wobbleDeg: 3,
  });

  // "most of the money in the world": the camera pulls back over a table of cards.
  const pull = ramp(frame, cue.mostMoney, 50, EASE.inOut);
  const camera = mix(1, PULL_BACK_SCALE, pull);
  const promiseFold = 1 - ramp(f2, cue.mostMoney, 10, EASE.inOut);
  const gridIn = (dist: number) =>
    ramp(f2, cue.mostMoney + Math.min(dist, 6) * 2, 10, EASE.settle);

  // Idle life on the hold.
  const idle = idleJitter(frame, 9);

  return (
    <SceneRoot>
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: camera,
          transformOrigin: `960px ${CARD.centreY}px`,
        }}
      >
        {/* Other people's cards, revealed by the pull-back */}
        {pull > 0 ? (
          <Piece x={960} y={CARD.centreY}>
            <PaperSvg
              w={2 * GRID.cols * GRID.pitchX + cw}
              h={2 * GRID.rows * GRID.pitchY + ch}
            >
              <PaperShape
                d={GRID_BACKS}
                fill={THEME.card}
                depth={1.2}
                shadowOpacity={THEME.shadow}
                opacity={gridIn(1)}
              />
            </PaperSvg>
            {GRID_CELLS.map((g) => (
              <At
                key={`${g.c},${g.r}`}
                x={g.c * GRID.pitchX}
                y={g.r * GRID.pitchY + 22 * CARD_BIG}
              >
                <span
                  style={{
                    fontSize: TILE.font * CARD_BIG,
                    fontWeight: FONT.weight.heading,
                    color: THEME.ink,
                    opacity: gridIn(g.dist),
                  }}
                >
                  {g.label}
                </span>
              </At>
            ))}
          </Piece>
        ) : null}

        {/* Phone (gone once it has left, so the pull-back never shows it again) */}
        {phoneOut < 1 ? (
          <Piece x={PHONE.x} y={phoneY} rotate={phoneIn.rotate}>
            <PaperSvg w={PHONE.w + 60} h={PHONE.h + 60}>
              <PaperShape
                d={PHONE_BODY}
                fill={THEME.ink}
                depth={1.4 + phoneIn.lift}
                shadowOpacity={THEME.shadow}
              />
              <PaperShape
                d={PHONE_SCREEN}
                fill={COLORS.primary}
                depth={0.5}
                shadowOpacity={THEME.shadow}
              />
              <PaperShape
                d={PHONE_SPEAKER}
                fill={COLORS.muted}
                depth={0.3}
                shadowOpacity={THEME.shadow}
              />
              <PaperShape
                d={PHONE_BUTTON}
                fill={COLORS.muted}
                depth={0.3}
                shadowOpacity={THEME.shadow}
              />
            </PaperSvg>
          </Piece>
        ) : null}

        {/* Vault door, its name tag and the amber strip */}
        {vaultOut < 1 ? (
          <Piece x={vaultX} y={VAULT.y} rotate={vaultIn.rotate}>
            <PaperSvg w={VAULT.r * 2 + 60} h={VAULT.r * 2 + 60}>
              <PaperShape
                d={VAULT_OUTER}
                fill={THEME.slate}
                depth={1.4 + vaultIn.lift}
                shadowOpacity={THEME.shadow}
              />
              <PaperShape
                d={VAULT_FACE}
                fill={COLORS.muted}
                depth={0.6}
                shadowOpacity={THEME.shadow}
              />
              <PaperShape
                d={VAULT_BOLTS}
                fill={PAPER_COLORS.kraft.base}
                depth={0.5}
                shadowOpacity={THEME.shadow}
              />
              {[0, 60, 120].map((a) => (
                <g key={a} transform={`rotate(${a + 15})`}>
                  <PaperShape
                    d={VAULT_SPOKE}
                    fill={COLORS.primary}
                    depth={0.8}
                    shadowOpacity={THEME.shadow}
                  />
                </g>
              ))}
              <PaperShape
                d={VAULT_HUB}
                fill={PAPER_COLORS.kraft.base}
                depth={1}
                shadowOpacity={THEME.shadow}
              />
            </PaperSvg>
            {tag.t > 0 ? (
              <Piece x={0} y={30} rotate={tag.rotate * 2} origin="0px 0px">
                <PaperSvg w={300} h={240}>
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={66}
                    stroke={THEME.ink}
                    strokeWidth={3}
                  />
                  <g
                    transform={`translate(0 ${66 + (1 - Math.min(tag.t, 1)) * -40})`}
                  >
                    <PaperShape
                      d={TAG}
                      fill={PAPER_COLORS.kraft.light}
                      depth={1.2}
                      shadowOpacity={THEME.shadow}
                    />
                  </g>
                </PaperSvg>
                <At x={0} y={108}>
                  <PaperText
                    color={THEME.ink}
                    fontSize={40}
                    weight={FONT.weight.body}
                    depth={0.4}
                    shadowOpacity={THEME.shadow}
                  >
                    Your name
                  </PaperText>
                </At>
              </Piece>
            ) : null}
            {slap.t > 0 ? (
              <Piece
                x={0}
                y={0}
                rotate={-22 + slap.rotate}
                scale={mix(1.35, 1, Math.min(slap.t, 1.05))}
              >
                <PaperSvg w={720} h={140}>
                  <PaperShape
                    d={STRIP}
                    fill={THEME.amber}
                    depth={mix(2.4, 1.4, slap.t)}
                    shadowOpacity={THEME.shadow}
                  />
                </PaperSvg>
              </Piece>
            ) : null}
          </Piece>
        ) : null}

        {/* The balance card: navy backing (seen through the holes), light-blue front, flip-digit tiles */}
        <Piece
          x={960}
          y={cardY}
          scale={cardScale}
          rotate={peel.rotate + centre.rotate + idle}
        >
          <PaperSvg w={CARD.w + 40} h={CARD.h + 40}>
            <PaperShape
              d={CARD_BACK}
              fill={THEME.ink}
              depth={Math.max(cardDepth, 0.6)}
              shadowOpacity={THEME.shadow}
            />
            <PaperShape d={CARD_FRONT} fill={THEME.card} depth={0} />
          </PaperSvg>
          <At x={0} y={-62}>
            <PaperText
              color={THEME.ink}
              fontSize={36}
              weight={FONT.weight.body}
              depth={0}
              style={{ opacity: TEXT_OPACITY.secondary }}
            >
              Balance
            </PaperText>
          </At>
          {/* Holes: the number cut out of the card, showing the navy backing */}
          {CHARS.map((c, i) => (
            <At key={`h${i}`} x={tileX[i]} y={TILES_Y}>
              <span
                style={{
                  fontSize: TILE.font,
                  fontWeight: FONT.weight.heading,
                  color: THEME.ink,
                  lineHeight: 1,
                }}
              >
                {c}
              </span>
            </At>
          ))}
          {CHARS.map((c, i) => (
            <FlipTile
              key={`t${i}`}
              char={c}
              index={i}
              x={tileX[i]}
              frame={frame}
              flipAt={cue.balance}
              loosen={loosen}
              flyAt={flyStart(i)}
            />
          ))}
        </Piece>

        {/* "Promise": amber letters on a navy strip, dropped under the empty card */}
        {promiseIn.t > 0 ? (
          <Piece
            x={960}
            y={mix(
              CARD.centreY + 120,
              CARD.centreY + 330,
              Math.min(promiseIn.t, 1.05),
            )}
            rotate={promiseIn.rotate - 2}
            scaleY={promiseFold}
            origin="0px -80px"
          >
            <PaperSvg w={720} h={200}>
              <PaperShape
                d={PROMISE_STRIP}
                fill={THEME.ink}
                depth={1.2 + promiseIn.lift}
                shadowOpacity={THEME.shadow}
              />
            </PaperSvg>
            <At x={0} y={0}>
              <PaperText
                color={THEME.amber}
                fontSize={120}
                depth={0.8}
                shadowOpacity={THEME.shadow}
              >
                Promise
              </PaperText>
            </At>
          </Piece>
        ) : null}
      </div>
    </SceneRoot>
  );
};

type FlipTileProps = {
  readonly char: string;
  readonly index: number;
  readonly x: number;
  readonly frame: number;
  /** Starts flipping through digits here, then settles on `char`. */
  readonly flipAt: number;
  /** 0..1: how loose the tile is (shaking before it flies). */
  readonly loosen: number;
  /** Flies off the card here. */
  readonly flyAt: number;
};

/** One paper flip-digit tile on the balance card. */
const FlipTile: React.FC<FlipTileProps> = ({
  char,
  index,
  x,
  frame,
  flipAt,
  loosen,
  flyAt,
}) => {
  const f = onTwos(frame);
  const isDigit = /\d/.test(char);
  // Each flip takes 4 frames (squash on the first two); digits flip 4 to 7 times, staggered.
  const flips = isDigit ? 4 + Math.floor(((jitter(60, index) + 1) / 2) * 4) : 1;
  const start = flipAt + index * 2;
  const k = Math.floor((f - start) / 4);
  const flipping = f >= start && k < flips;
  const shown =
    f < start
      ? ""
      : flipping && isDigit
        ? String(Math.floor(((jitter(61 + index, k) + 1) / 2) * 10) % 10)
        : char;
  const squash = flipping && (f - start) % 4 < 2 ? 0.2 : 1;

  const fly = ramp(f, flyAt, 18, EASE.in);
  if (fly >= 1) return null;
  const shake = loosen * (1 - fly) * jitter(70 + index, Math.floor(f / 2)) * 5;
  const dir = jitter(80, index) >= 0 ? 1 : -1;
  return (
    <Piece
      x={x + fly * dir * (260 + index * 40)}
      y={
        TILES_Y -
        fly * 760 -
        loosen * Math.abs(jitter(90 + index, Math.floor(f / 2))) * 4
      }
      rotate={shake + fly * dir * 50}
      scaleY={squash}
    >
      <PaperSvg w={tileWidth(char) + 20} h={TILE.h + 20}>
        <PaperShape
          d={tilePath(char, index)}
          fill={COLORS.primary}
          depth={0.8 + fly * 2.4 + loosen * 0.3}
          shadowOpacity={THEME.shadow}
        />
      </PaperSvg>
      <At x={0} y={2}>
        <PaperText color={THEME.ink} fontSize={TILE.font} depth={0}>
          {shown}
        </PaperText>
      </At>
    </Piece>
  );
};
