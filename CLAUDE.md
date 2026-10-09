# Sum of Parts

A faceless YouTube channel of animated explainers about money, business and the economy. Every video is made in code with Remotion (React).

**Before writing or editing any composition, check the Remotion skills in `.claude/skills/`** (start with `remotion-best-practices`, which routes to the others: `remotion-markup` for animation and timing, `remotion-interactivity` for Studio-editable markup, `remotion-render` for export).

## The channel

- **Promise:** every video answers one money question with clean animated data, in 8 to 12 minutes.
- **Positioning:** the 3Blue1Brown of money, made of paper. A handmade papercut world (bills, coins, buildings, calendars cut from card) where every number and chart stays precise and crisp. No characters, no stock footage, no clip art.
- **Content pillars:**
  1. The math of money: compound interest, inflation, debt, real costs.
  2. How companies make money: business models, strategy breakdowns.
  3. How the economy works: banks, currencies, crises, rich vs poor countries.
- **Audience:** English-speaking adults, mostly in the US, UK, Canada and Australia.

## Brand system

All values live in `src/brand/tokens.ts`. **Never hardcode a hex value, font, or easing curve anywhere else, and never invent new colors.** If something in the brand system is unclear, ask instead of guessing.

### Colors

| Token | Hex | Use |
|---|---|---|
| `COLORS.background` | `#10162B` | Deep navy. Every frame. |
| `COLORS.primary` | `#F3EBDD` | Warm cream. Text and most shapes. |
| `COLORS.accent` | `#F2A93B` | Amber. Only for the ONE key thing in a scene. |
| `COLORS.teal` | `#3FB8A0` | Extra data series. |
| `COLORS.blue` | `#6C8CFF` | Extra data series. |
| `COLORS.coral` | `#E9684B` | Extra data series. |
| `COLORS.muted` | `#26314F` | Grid lines, faint chart marks. |
| `COLORS.mutedStrong` | `#3A4870` | Axes, outlines, stronger faint marks. |

- Amber is used sparingly: one highlighted value, word, bar, or point per scene.
- Data series colors are assigned in order: cream, teal, blue, coral (`SERIES_COLORS`). Amber is never a series color; it marks the highlight.
- Secondary text is cream at reduced opacity (`TEXT_OPACITY.secondary` 0.72, `TEXT_OPACITY.tertiary` 0.5), never a new color.

### Paper palette (paper world only)

Colors for objects and scenery in the papercut styles: `PAPER_COLORS` in `tokens.ts`. Each hue has three tones, computed from the base: `light` (mixed toward cream, far layers), `base`, `dark` (mixed toward navy, near layers and shaded sides). Reference sheet: the `PaperPalette` still (Studio, "Style-Tests").

| Hue | Base | Use |
|---|---|---|
| `green` | `#2E9E6B` | Banknotes, growth, wealth |
| `leaf` | `#8DC85A` | Hills, plants, fresh starts |
| `sky` | `#4DA3E3` | Sky, water, buildings, banks |
| `plum` | `#7E5BB0` | Night, luxury, the unknown |
| `rose` | `#EE8597` | Warmth, people's things |
| `kraft` | `#C78B4E` | Cardboard, envelopes, boxes, the desk |

- Paper colors are **never** used for data: not as a highlight (amber's job) and not as a chart series (`SERIES_COLORS`).
- Kraft is the closest to amber: never put a kraft object right next to the amber highlight.

### Typography

- Font: **Outfit**, loaded with `@remotion/google-fonts/Outfit` in `tokens.ts` (`FONT.family`).
- Weights: **700 for headings** (`FONT.weight.heading`), **500 for body** (`FONT.weight.body`).
- Type scale (`TYPE`): display 200, h1 112, h2 76, body 52, label 38, caption 36 px.
- **Nothing on screen is smaller than 36px** (readable on a phone). Big numbers are 120px or more.

### Visual style: hybrid papercut (from video 02 on)

Every video from 02 on is papercut, in **one of three styles chosen per video** (see "Styles" below). Every style is built from two layers that never mix:

1. **The paper world** tells the story: objects and backdrops cut from card (banknotes, coins, receipts, a house, a bank, a calendar, a clock). It is warm, handmade and layered.
2. **The data layer** carries the facts: numbers, chart lines, axes, value labels. It is printed sharp on top of the paper: clean Outfit type, exact geometry, no texture, no wobble.

If a viewer has to read it or trust it, it belongs to the data layer. If it sets the scene or carries an emotion, it is paper.

**Paper world rules**

- **Colors:** the board and data cards use the brand core (navy, cream); objects and scenery use the paper palette above; amber stays the one highlighted piece per scene. Vivid but grown-up: nothing toy-like, the audience is adults.
- **Depth:** objects are stacked layers of card, and each layer casts one soft drop shadow down and to the right (one light direction for the whole channel). Deeper layers cast slightly longer shadows. Shadows, offsets and blur come from `PAPER` tokens in `tokens.ts`, never typed in a scene. This is the only kind of shadow allowed.
- **Texture:** a subtle paper grain over every card (one shared texture, low opacity), and slightly irregular cut edges on objects (a fixed wobble, identical every frame, so nothing flickers). Chart bars may be card, but their tops and values stay exact.
- **Still banned:** gradients (beyond the paper grain), glow, true 3D or perspective, photos, emoji, characters or faces.
- **Background:** the base board (navy or cream, depending on the style) with the paper grain. The 64px grid survives only as a faint ruled-paper or cutting-mat texture where a chart needs a reference; it is no longer on every frame.

**Data layer rules**

- Numbers in Outfit (700 headings, 500 body), cream or navy depending on what they sit on, amber for the one key value. Big numbers 120px+, nothing under 36px.
- Charts: thin exact marks, direct labels instead of legends, one y-axis only. Axes and gridlines in the muted colors. A chart may sit on a paper card, but the chart itself is never textured or wobbly.
- Every number still comes from `data.ts`, checked by tests.

**Motion**

- Smooth and eased (`EASE.out`, `EASE.inOut`, the no-bounce `EASE.spring`). No overshoot, no bounce, nothing cartoonish.
- Paper moves like paper: cards slide in from behind other layers, flip or unfold on a hinge (a 2D scale on one axis, not 3D), stack, fold away, and get pushed off frame by the next card. Layers move at different speeds when the camera pans (parallax: back layers slower).
- Scene changes are paper moves (a card sliding across, a page turning, layers parting) instead of plain cross-fades where it fits; cross-fades stay allowed at 8 to 12 frames.
- Motion is smooth by default (30fps). Stepped "stop-motion" (each pose held 2 frames) is an option chosen per video at intake.

### Logo

- A circle split into four quarter slices with thin gaps. Three cream; the top-right slice is amber and pulled slightly outward diagonally. Component: `<LogoMark>`. In the paper style the four slices are cut card with the standard paper shadow, and the amber slice lifts toward the viewer (longer shadow) as it pulls out.

### Styles (chosen per video)

All three are kept and built from the same paper components; the user picks one at intake for each new video. Never mix two styles inside one video. Reference clips: the "Style-Tests" folder in Studio (`src/videos/100-a-month-40-years/style-test/`), rendered to `out/style-tests/`.

| Style | Board | Paper world | Data | Feel |
|---|---|---|---|---|
| **Dark paper** | Navy | Muted navy hills/objects, cream cards | Cream text, amber highlight | Night, calm, premium; amber pops hardest |
| **Light paper** | Cream | Cream layers tinted toward navy, slate cards | Navy text; the amber *shape* carries the highlight (amber text is too faint on cream) | Bright, printed-book |
| **Mixed** | Cream | Vivid paper palette (sky, clouds, hills, objects) | On navy data cards standing in the world: cream text, amber highlight | Illustrated and colourful, data stays serious |

- Shadow strength follows the board: `PAPER.shadow.opacity` on navy, `PAPER.shadow.opacityOnLight` on cream.
- Mixed style: design each scene for the card size from the start (never shrink a full-screen layout onto a card), so nothing on the card drops under 36px.

**Built so far:** `PAPER`, `paperShadow()`, `mixHex()`, `PAPER_COLORS` in `tokens.ts`; the grain tile (`scripts/make-paper-texture.ts` → `public/paper/grain.png`); `src/components/paper/` (`PaperBackground`, `PaperShape` + `PaperDefs`, `paperRect`, `paperHill`, `paperCircle`, `paperCloud`). **Still to build** before or during video 02: paper logo intro and end card, reusable objects (banknote, coin, receipt, calendar), the data card as a component, and a frame-QA check that the data layer stays crisp.

### Composition rules

- One idea per scene. Generous empty space. Keep key content inside `SAFE_AREA` (128px sides, 96px top and bottom).
- Video 01 (`100-a-month-40-years`) and the brand showcase were made in the earlier flat style (no shadows, grid on every frame). Leave them as they are.

## Starting a new video: intake checklist (hard gate)

**Do not start building a video until the user has provided everything below.** At the start of every new video, send the user this checklist filled in with what is already provided and what is missing, and wait. If anything is missing or unclear, ask; never fill a gap with a guess (no invented numbers, sources, wording or timestamps).

**Decisions**

- [ ] **Style:** dark paper, light paper or mixed (show the three reference clips if useful).
- [ ] **Motion:** smooth (default) or stop-motion ("on twos"), and whether slight overshoot / settle wobble is allowed.
- [ ] **Text treatment:** paper titles with crisp data numbers (default), or everything as cut paper (only source lines flat).
- [ ] **Exceptions to the brand** the script asks for (e.g. paper figures, new colours): approved for this video only, or as a permanent rule.
- [ ] **Working title** and the one money question the video answers.
- [ ] **Pillar:** math of money, how companies make money, or how the economy works.

**Script and audio**

- [ ] **Script with scene notes** (`script.md`): every scene, its voiceover and what it should show.
- [ ] **Exact voiceover wording** (`voiceover.txt`), identical to the recording.
- [ ] **Voiceover recording** (`public/audio/<slug>/voiceover.mp3`), final take, clean, no music under it.
- [ ] Whether the voice is an **AI voice or a clone** of a real person (needed for YouTube's disclosure).

**Facts**

- [ ] **Every number** the video shows, with how it is calculated (assumptions: rates, periods, compounding, inflation adjustment).
- [ ] **Sources** for every external figure: name, link, year, and the exact series used.
- [ ] Anything the user wants **avoided or caveated** (financial advice wording, specific products).

**Channel and publishing**

- [ ] **Next video** to tease at the end (title or topic), and which videos go in the end screen slots.
- [ ] **Music bed** (optional): a licensed file, or a clear "no music".
- [ ] **Shorts:** how many and which moments (can be decided after the main cut).
- [ ] **Thumbnail direction** (optional): any text or angle the user wants tested.

Only when every required box is ticked: create `src/videos/<slug>/`, write the decisions into `src/videos/<slug>/BUILD_NOTES.md` (they override the script where they differ), run the voiceover pipeline below, and build. Licensed music packs go in `public/music/<slug>/` (git-ignored).

## Video format

- 1920x1080, 30fps (`VIDEO` in tokens).
- Structure:
  1. Hook question in the first 10 seconds.
  2. A surprising number by 30 seconds.
  3. Build the answer step by step, one idea per scene.
  4. End with one clear takeaway, then the end card.
- Every scene is timed to the voiceover. **All timing lives in one file per video, `timeline.json`, generated from the audio, never typed by hand.** Scenes read their start, length and cue frames from it (`timeline.ts`: `sceneTiming(id).cue("name")`). Never hardcode a frame number, a scene length or a dollar figure in a scene.
- Readability: nothing under 36px, big numbers 120px+, nothing inside 96px of an edge, nothing static for more than about 4s, no empty-background frame longer than 0.5s, 8 to 12 frame cross-fades between scenes.
- Every on-screen number comes from code: pure functions in `src/lib/finance.ts`, collected per video in `data.ts` (values + display labels), checked by tests.

## Voiceover pipeline (how video 01 was built; reuse it)

Per video, in `src/videos/<slug>/`: `voiceover.txt` (exact wording), `timeline-spec.ts` (scene anchor phrases + cue phrases), and the audio in `public/audio/<slug>/voiceover.mp3`.

1. `npm run transcribe -- <slug>`: whisper.cpp (`medium.en`, installed in `whisper.cpp/`) writes `transcript.json` with word timestamps.
2. `npm run timeline -- <slug>`: finds every anchor and cue (number words normalized on both sides, phrases located in the script first), snaps word times to the measured audio (pause ends, short dips, energy valleys; whisper alone drifts), and writes `timeline.json`. If a phrase is missing it lists it and writes nothing: never guess a timestamp. To add a beat inside a long hold, add a cue phrase to `timeline-spec.ts` and rebuild.
3. `npm test`: finance and label tests. Must pass before anything renders.
4. `npm run mix -- <slug>`: measures loudness (as delivered, mono voice on both stereo channels) and writes `audio-mix.json` (gain for `<Audio volume>`, plus a peak-limited copy when needed). Target -16 LUFS, peaks under -1.5 dBTP. The source mp3 is never modified.
5. QA: `npx tsx scripts/qa/static-checks.ts <slug>` (hardcoded numbers, font sizes, colors, every cue firing within 3 frames), `npx tsx scripts/qa/frame-checks.ts <slug>` (renders scene starts and cues; safe margin, visible change at each cue), `npx tsx scripts/qa/video-checks.ts <slug> <mp4>` (empty frames, duration, loudness).
6. Sound and music (papercut videos): `src/videos/<slug>/sfx.ts` (cue sheet, sounds under `public/sfx/`) and `music.ts` (arrangement per scene: full / thin stems / sparse / open), mixed by `npm run audio -- <slug>` into `public/audio/<slug>/music-bed.wav` and `sfx-track.wav` (ducked under the voice, peak-safe on voice + music + sfx).
7. Render with the video's `render:<video>` npm script (tests first; H.264 CRF 18, yuv420p, BT.709, AAC 320k), then `npx tsx scripts/export-extras.ts <slug>` for YouTube chapters (from `src/videos/<slug>/chapters.ts`), the SRT and `captions.json`.
8. Publishing copy, two files per video:
   - `src/videos/<slug>/youtube.md`: the main video (title + A/B alternatives, description with chapters and sources, tags, pinned comment, upload settings, end screen, thumbnails, pre-publish checklist).
   - `src/videos/<slug>/socials.md`: everything for the short-form and social posts, **always including the YouTube Shorts** (title, description, Related video setting for each Short) next to Instagram Reels (caption, hashtags, alt text, cover) and Facebook (Reels and any landscape teaser: caption, first comment, settings), plus the licence notes and a posting schedule. `youtube.md` only points to it for the Shorts.

## Project structure

```
src/
  brand/tokens.ts          colors, fonts, type scale, spacing, easing, video format
  lib/                     helpers: motion (progress, fades), format (numbers), timeline (scene frames), scale (chart axes)
  components/              reusable animated building blocks (import from "components")
  videos/<video-slug>/     one folder per video
    script.md, voiceover.txt   script with scene notes, exact voiceover wording
    timeline-spec.ts       anchor + cue phrases; timeline.json is generated from it
    timeline.json          all timing (generated); timeline.ts reads it
    data.ts                every number shown on screen, from src/lib/finance.ts
    audio-mix.json         voiceover gain (generated by npm run mix)
    Video01.tsx            the full video: one shared background, voiceover, a slot per scene
    scenes/*.tsx           one component per scene (SceneRoot draws the background when previewed alone)
    parts/*.tsx            pieces shared by several scenes (chart axes, chips)
  Root.tsx                 registers each video, its thumbnails, its Shorts and its scenes (in Folders)
scripts/                   transcribe, build-timeline, mix-audio, export-extras, qa/
```

- Each scene component is registered in `Root.tsx` as its own composition (a connected composition) so it can be previewed alone in Studio.
- Sound effects: `scripts/make-sfx.ts` synthesizes the kit into `public/sfx/`. Each video's `sfx.ts` places sounds on the same cue frames and timing helpers the scenes use, and `npm run sfx` mixes them into one track under the voice (peak-safe).
- Shorts: `shorts/` in the video folder replays single scenes in a 1080x1920 frame (`SHORT` in tokens) with a title, the scene, word-by-word captions from `captions.json` (written by `export-extras.ts`), and the same voice and sound.
- `src/videos/brand-showcase/` shows every component in order (it still uses a simple seconds-based `scenes.ts`).
- `src/videos/100-a-month-40-years/` is the reference for real, voiceover-driven videos: copy its structure.

## Components

All components are built with `Interactive.withSchema({wrapInSequence: true})`, so they accept timing props directly (`name`, `from`, `durationInFrames`, `premountFor`) and their main props are editable in Studio. Always pass `premountFor={fps}`.

| Component | What it does | Key props |
|---|---|---|
| `<Background>` | Navy + grid canvas, sets font | `showGrid` |
| `<LogoMark>` | Static or driven logo | `size`, `sliceProgress`, `pullProgress` |
| `<LogoIntro>` | Slices assemble, amber pulls out, name fades in (~3s) | `channelName` |
| `<TitleCard>` | Big question, word-by-word reveal | `question`, `highlight` (amber phrase), `subtitle` |
| `<NumberCounter>` | Counts up to a value | `value`, `startValue`, `unit` ("currency" / "percent"), `compact` (1.2M), `decimals`, `label`, `highlight` |
| `<BarChart>` | Bars grow in, values count | `data` ({label, value, highlight}), `title`, `unit`, `compact`, `frame` |
| `<LineChart>` | Lines draw left to right | `labels`, `series`, `highlight` ({series, index}), `title`, `unit`, `compact`, `xLabelEvery` |
| `<Callout>` | Ring + leader line + note | `target` (px), `text`, `direction`, `length`, `ring`, `accent` |
| `<SourceLowerThird>` | "Source: World Bank, 2024", fades out at end | `source`, `label`, `align` ("left" / "right") |
| `<Pill>` | Rounded outline note ("All figures in today's dollars") | `children`, `accent` |
| `<TabularNumber>` | Text with fixed-width digits, so counters never jitter | `text` |
| `<ApproxSign>`, `<ArrowRight>`, `<CoffeeCupIcon>` | Drawn ≈, → and coffee cup (Outfit's latin subset has no ≈ or →) | `weight` |
| `<EndCard>` | Subscribe prompt + two video slots | `subscribeTitle`, `subscribePrompt`, `leftLabel`, `rightLabel` |

- Aim callouts at chart data with `getBarAnchor(chartProps, index, "top" | "right")` and `getLinePoint(chartProps, seriesIndex, index)`, passing the same props the chart gets.
- Number formatting goes through `formatNumber()` in `src/lib/format.ts` (`$1.2M`, `7.3%`, `48,210`). Percent values are passed as 7.3, not 0.073.
- End card slot positions for the YouTube end screen editor are in `END_CARD_LAYOUT`.

## Remotion rules for this repo

- Animate only with `useCurrentFrame()` + `interpolate()` / the `progress()` helper. No CSS transitions or animations.
- Get `fps` from `useVideoConfig()`; express time as `seconds * fps`.
- Prefer `scale` / `translate` / `rotate` style properties over `transform`.
- Add Remotion packages with `npx remotion add <package>` so versions match.
- Only render when explicitly asked; otherwise preview in Studio.

## Commands

- `npm run dev` starts Remotion Studio.
- `npm test` runs the finance and data tests.
- `npm run transcribe -- <slug>`, `npm run timeline -- <slug>`, `npm run mix -- <slug>`: the voiceover pipeline above.
- `npm run render:video01` renders video 01 (tests first) to `out/`; `npm run render:video01-shorts` renders its Shorts to `out/shorts/`.
- `npm run sfx` regenerates the sound kit and video 01's sound-effects track; `npm run audio -- <slug>` regenerates both kits and a papercut video's music bed + sfx track.
- `npm run render:video02` renders video 02 (tests and audio first) to `out/`; `npm run render:video02-shorts` renders its four Shorts to `out/shorts/`.
- `npm run render:video03` renders video 03 (tests and audio first); `npm run render:video03-shorts` renders its four Shorts; `npm run render:video03-extras` renders its Facebook teaser, thumbnails and Instagram covers (`out/covers/`).
- `npm run render:video01-thumbnails` renders the three A/B-test thumbnails to `out/thumbnails/`.
- `npm run lint` runs ESLint and the TypeScript check.
- `npm run gpt:sync` refreshes `gpt/` (the kit for running this same pipeline with GPT / Codex: `gpt/README.md`) after this file or the skills change. New lessons from a session go in `gpt/LESSONS.md`.
