# Sum of Parts

A faceless YouTube channel of animated explainers about money, business and the economy. Every video is made in code with Remotion (React).

**Before writing or editing any composition, check the Remotion skills in `.claude/skills/`** (start with `remotion-best-practices`, which routes to the others: `remotion-markup` for animation and timing, `remotion-interactivity` for Studio-editable markup, `remotion-render` for export).

## The channel

- **Promise:** every video answers one money question with clean animated data, in 8 to 12 minutes.
- **Positioning:** the 3Blue1Brown of money. Minimal, precise, data-driven motion graphics. No characters, no stock footage, no clip art.
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

### Typography

- Font: **Outfit**, loaded with `@remotion/google-fonts/Outfit` in `tokens.ts` (`FONT.family`).
- Weights: **700 for headings** (`FONT.weight.heading`), **500 for body** (`FONT.weight.body`).
- Type scale (`TYPE`): display 200, h1 112, h2 76, body 52, label 38, caption 36 px.
- **Nothing on screen is smaller than 36px** (readable on a phone). Big numbers are 120px or more.

### Background

- Navy with a faint grid of thin lines, 64px spacing, cream at 4.5% opacity, centered on the frame (`GRID`). Use the `<Background>` component; it also sets the font.

### Logo

- A circle split into four quarter slices with thin gaps. Three cream; the top-right slice is amber and pulled slightly outward diagonally. Component: `<LogoMark>`.

### Style rules

- Flat shapes, crisp edges. **No gradients, no shadows, no glow, no 3D, no emoji.**
- Smooth eased motion only (`EASE.out`, `EASE.inOut`, or the no-bounce `EASE.spring`). Nothing bouncy or cartoonish, no overshoot.
- One idea per scene. Generous empty space. Keep key content inside `SAFE_AREA` (128px sides, 96px top and bottom).
- Charts: thin marks, recessive grid and axes in the muted colors, direct labels instead of legends, one y-axis only.

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
6. Render with the video's `render:<video>` npm script (tests first; H.264 CRF 18, yuv420p, BT.709, AAC 320k), then `npx tsx scripts/export-extras.ts <slug>` for YouTube chapters and the SRT.

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
  Root.tsx                 registers each video, its thumbnail and its scenes (in a Folder)
scripts/                   transcribe, build-timeline, mix-audio, export-extras, qa/
```

- Each scene component is registered in `Root.tsx` as its own composition (a connected composition) so it can be previewed alone in Studio.
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
- `npm run render:video01` renders video 01 (tests first) to `out/`.
- `npm run lint` runs ESLint and the TypeScript check.
