# BUILD SPEC: Video 01, "What $100 a Month Becomes in 40 Years"

This file is the complete build spec for video 01 of Sum of Parts. Read it fully before writing any code. Follow CLAUDE.md for the brand system. Use the installed Remotion skills for every Remotion decision. If anything here conflicts with CLAUDE.md, CLAUDE.md wins for visual style and this file wins for content, numbers and timing.

Work in the phases below, in order. Stop at every CHECKPOINT and wait for my feedback before continuing.

---

## 0. Inputs and paths

Video slug: `100-a-month-40-years`

| What | Path |
|---|---|
| This spec | `src/videos/100-a-month-40-years/BUILD_VIDEO_01.md` |
| Full script with scene notes | `src/videos/100-a-month-40-years/script.md` |
| Voiceover text (one block, no scene markers) | `src/videos/100-a-month-40-years/voiceover.txt` |
| Voiceover audio (one single file, all scenes) | `public/audio/100-a-month-40-years/voiceover.mp3` |
| Optional music bed (may not exist) | `public/music/bed.mp3` |

Before anything else, check that every required file exists. If one is missing, stop and tell me which.

Output settings: 1920x1080, 30fps, H.264.

---

## 1. Non-negotiable rules

1. **Every number on screen comes from code.** Never type a calculated dollar figure by hand. All figures come from the finance utility in Phase 2. Rounded display labels ($17K, $35K) are derived from the exact values with a formatting function.
2. **Every animation event is driven by the voiceover timestamps,** not by guessed frame numbers. If the narrator says a number, it appears within 3 frames (0.1s) of the word starting.
3. **One timeline file is the single source of truth** for all timing: `src/videos/100-a-month-40-years/timeline.json`. No scene hardcodes its own start or duration.
4. **Brand only.** Colors, font, grid background and motion style exactly as in CLAUDE.md. Amber (#F2A93B) marks the ONE key thing per scene. No gradients, shadows, glow, emoji, stock imagery or characters.
5. **Readable on a phone.** Minimum on-screen text size 36px. Big numbers 120px or more. Keep all text inside a 96px safe margin from every edge.
6. **Nothing static for more than about 4 seconds.** If a scene holds, add a subtle movement (a slow chart reveal, a gentle number pulse, a highlight).
7. **Never leave a blank frame** between scenes. Use short cross-fades or motion transitions (8 to 12 frames).

---

## 2. Phase 1: Transcribe the voiceover and build the timeline

### 2.1 Transcribe

Use Whisper locally through Remotion's tooling (`@remotion/install-whisper-cpp`, model `medium.en` or better) to transcribe the voiceover with **word-level timestamps**. Save the raw result to `src/videos/100-a-month-40-years/transcript.json`.

voiceover.txt has no scene markers. Scene boundaries are found only through the anchor phrases in section 2.3.

Whisper may write numbers as digits ("100") even though the script says "one hundred". Normalize both sides before matching: lowercase, strip punctuation, and convert number words to digits on both sides (or the reverse), so matching is reliable.

### 2.2 Assemble the master audio timeline

The final audio is built from two segments of the same file, in this order:

1. voiceover.mp3, from its start until the end of the sentence "...one of the most important ideas in all of money." (end of Scene 1)
2. **Scene 2 logo intro: 3.0 seconds with no voiceover** (only the logo animation and an optional soft sound)
3. voiceover.mp3, from "Let's set the rules." to its end (Scenes 3 to 13)

Every timestamp after the logo intro is therefore shifted later by (logo duration + breathing room). Apply this offset in one place, in the timeline builder.

Implement this with Remotion `<Audio>` / `<Sequence>` trimming (start and end in frames calculated from the timestamps). Do not re-encode or cut the mp3 file itself.

Leave 0.4s of breathing room after the last word of Scene 1 before the logo intro starts.

### 2.3 Find scene boundaries

Each scene starts at the first word of its anchor phrase below, and ends where the next scene starts. Find each anchor in the word timestamps.

| Scene | Starts at the phrase |
|---|---|
| 01 Hook | "If you put away" |
| 02 Logo | after Scene 1 ends + 0.4s, lasts 3.0s, no voiceover |
| 03 Rules | "Let's set the rules" |
| 04 Mattress | "First, the boring version" |
| 05 Compounding | "Now let's do something different" |
| 06 Why 7% | "Why seven percent" |
| 07 Curve | "So here's what happens" |
| 08 Decades | "Look at it decade by decade" |
| 09 Tipping point | "There's a moment in this story" |
| 10 Cost of waiting | "Now let's change one thing" |
| 11 Where it came from | "Back to our two hundred" |
| 12 Fine print | "A few honest caveats" |
| 13 Takeaway | "So, what does one hundred dollars" |
| End card | starts 0.6s after the last word "See you there", lasts 20s |

Some phrases appear more than once in the script (for example "forty years"). Always search forward from the previous scene's start, so each match is the next occurrence, never an earlier one.

Each scene's visuals may start up to 6 frames BEFORE its anchor word, so motion is already moving when the voice lands.

### 2.4 Find cue points

Inside each scene there are cue points (listed per scene in Phase 4 as `CUE: "phrase" -> event`). For each cue, store the timestamp of the FIRST word of the phrase.

### 2.5 Write timeline.json

Structure:

```json
{
  "fps": 30,
  "totalFrames": 0,
  "audioSegments": [
    { "file": "voiceover.mp3", "fromSec": 0, "toSec": 0, "atFrame": 0 },
    { "file": "voiceover.mp3", "fromSec": 0, "toSec": 0, "atFrame": 0 }
  ],
  "scenes": [
    {
      "id": "s01-hook",
      "startFrame": 0,
      "endFrame": 0,
      "cues": { "hundredAppears": 0, "guessFifty": 0, "fiveTimes": 0 }
    }
  ]
}
```

Generate it with a script (`scripts/build-timeline.ts`) so it can be re-run any time the audio changes. Print a table of every scene and cue with its time in seconds so I can check it.

If any anchor or cue phrase cannot be found, do not guess. List the missing ones and stop.

**CHECKPOINT 1:** Show me the scene and cue table. Wait for my OK.

---

## 3. Phase 2: Finance utility and number verification

Create `src/lib/finance.ts` with typed, pure functions:

- `futureValueMonthly(monthlyDeposit, annualRate, years)`: monthly compounding at `annualRate / 12`, deposit added at the END of each month. With rate 0, it returns deposit x months.
- `yearlySeries(monthlyDeposit, annualRate, years)`: an array, one entry per year, with `{ year, balance, depositedThisYear, growthThisYear, totalDeposited }`.
- `formatUSD(value, { compact })`: "$262,481" or compact "$262K" / "$1.2M".

Then write a test (`src/lib/finance.test.ts`) that asserts these EXACT rounded values. The build must not continue if any fails.

| Check | Expected |
|---|---|
| 0%, 40 years | 48,000 |
| 4%, 40 years | 118,196 |
| 7%, 10 years | 17,308 |
| 7%, 20 years | 52,093 |
| 7%, 30 years | 121,997 |
| 7%, 40 years | 262,481 |
| 10%, 40 years | 632,408 |
| 6%, 40 years (1% fee case) | 199,149 |
| 7%, growth in year 1 | 39 |
| 7%, growth in year 11 | 1,290 (first year growth > 1,200) |
| 7%, growth in year 40 | 17,651 |
| 7%, added in decade 1 / 2 / 3 / 4 | 17,308 / 34,784 / 69,904 / 140,484 |
| Growth share at 7%, 40 years | 81.7% (shown as "82%") |
| 7%, 40 years minus deposits | 214,481 |
| Start 10 years late, gap at the end | 140,484 |
| Monthly deposit needed over 30 years to match 262,481 | 215 (rounded) |

Also export one constants object for this video (`src/videos/100-a-month-40-years/data.ts`) that every scene imports. Scenes never compute numbers on their own.

**CHECKPOINT 2:** Show me the test output. Wait for my OK.

---

## 4. Phase 3: Scene specs

Global layout rules:
- Canvas 1920x1080, navy background with the faint 64px grid on every scene (part of a shared `<Background>` component, always present, never re-animating between scenes, so the video feels like one continuous surface).
- Default text: Outfit 500, cream. Headings and big numbers: Outfit 700.
- Charts: axis lines and labels in muted #3A4870 or cream at 60% opacity. Data lines 4 to 6px. The highlighted series in amber, 8px.
- Number counters use tabular figures so digits don't jump.
- Easing: smooth spring (no overshoot) or ease-in-out. Entrances 12 to 20 frames.

Below, `CUE: "phrase" -> event` means: when the narrator starts that phrase, trigger that event.

### Scene 01: Hook
Layout: centered, minimal.
- CUE: "If you put away" -> "$100" fades and scales in, center, 140px cream. Under it, small "/ month" 48px.
- CUE: "every month" -> a small month counter appears under it and ticks rapidly from "Month 1" to "Month 480" until the cue "how much would you".
- CUE: "how much would you" -> everything shifts up, a large "?" fades in, 200px amber.
- CUE: "Most people guess" -> "?" is replaced by "$50,000?" in cream at 60% opacity, 120px.
- CUE: "The real answer" -> "$50,000?" fades out.
- CUE: "five times that" -> "$262,481" slams in (fast scale from 1.15 to 1.0, 10 frames), 160px cream, with an amber underline drawing left to right under it.
- Hold until scene end, slight slow zoom (1.0 to 1.03).

### Scene 02: Logo intro
Use the existing logo intro component. 3.0s exactly. Optional soft whoosh sound if one exists in `public/sfx/`. No voiceover.

### Scene 03: The rules
Layout: three cards in a row, centered, each about 440x260, cream 1.5px outline, rounded 20px, large text inside.
- CUE: "One hundred dollars a month" -> card 1 "$100 / month" enters.
- CUE: "about three dollars a day" -> under card 1, small text "≈ $3.29 a day" appears with a simple line-icon coffee cup (inline SVG, stroke only, cream).
- CUE: "You start at twenty-five" -> card 2 "Age 25 → 65" enters.
- CUE: "No raises" , "No bonuses" , "No lucky stock picks" -> three small strike-through labels appear one by one under the cards, each with a line crossing it out.
- CUE: "four hundred and eighty times" -> card 3 "480 deposits" enters, the "480" in amber.
- Scene end: cards slide left and fade (prepares for the next scene).

### Scene 04: The mattress
Layout: a single vertical bar on the left third, label on the right.
- CUE: "You hide the money" -> a tall empty bar outline appears.
- Bar fills in 40 equal segments (one per year), each segment popping in with a 1-frame gap, timed so the fill completes exactly at the cue "forty-eight thousand dollars".
- CUE: "forty-eight thousand dollars" -> label "$48,000" (120px) and "What you put in" (40px, cream 70%) appear to the right.
- CUE: "Keep that number in mind" -> the bar fades to a 30% opacity outline and slides to a small reference position bottom-left, where it stays for scenes 05 to 06 as a "baseline" chip.

### Scene 05: Compounding
Layout: a left-to-right row of "blocks", each block a rounded square. Cream = deposit, amber = growth.
- CUE: "Imagine your money grows" -> label "7% a year" top center.
- CUE: "In year one" -> a cream block labeled "$1,200" enters.
- CUE: "About forty dollars" -> a small amber sliver attached to the block, labeled "+$39". (Use the computed year-1 growth.)
- CUE: "In year two" -> a second cream block "$1,200" enters.
- CUE: "You also earn on last year's growth" -> tiny amber slivers appear on the first block AND on the first amber sliver. A curved arrow loops from the amber sliver back onto itself.
- CUE: "Your growth starts earning its own growth" -> the arrow pulses once, label "growth earns growth" appears in amber.
- CUE: "It feels slow at first" -> blocks for years 3 to 10 enter quickly, amber parts growing visibly larger each year (sizes from the yearly series, scaled).
- CUE: "Then it doesn't" -> the row zooms out fast and the amber parts swell (years 11 to 40 compressed), ending on a large amber mass. Hard cut-like transition to next scene.

### Scene 06: Why seven percent
Layout: a wide line chart across the screen showing a stylized 100-year market path.
- The line is decorative (jagged, generally rising), NOT real index data, and must be visibly labeled as an illustration: small text bottom-right "Illustrative".
- CUE: "Over the last hundred years" -> the jagged line draws left to right over about 3s, faint cream.
- CUE: "about ten percent a year" -> label "≈10% a year" appears, cream, 72px.
- CUE: "after inflation" -> a second label slides under it "≈7% after inflation", amber, 72px. The 10% label dims to 50%.
- CUE: "every number you see in this video is in today's dollars" -> small pill "All figures in today's dollars" appears top center and stays visible.
- CUE: "Some years, the market dropped" -> two dips in the line flash amber briefly, labeled "-30%" and "-40%".
- Lower third (sources component) during the whole scene: "Source: S&P 500 returns 1926 to 2026, officialdata.org".

### Scene 07: The curve (the key scene, make it the best one)
Layout: full line chart. X axis 0 to 40 years (ticks every 10). Y axis $0 to $300K (ticks every $100K, compact format). Large chart area, left margin for labels.
- Scene start: axes draw in.
- CUE: "On the bottom, the mattress" -> mattress line (0%) draws fully, cream 50% opacity, end label "$48K".
- CUE: "A savings account at four percent" -> 4% line draws fully, teal, end label "$118K".
- CUE: "And at seven percent" -> the 7% line starts drawing in amber, 8px, and it draws progressively in sync with the narration:
  - CUE: "After ten years" -> line reaches year 10, dot + label "$17,308".
  - CUE: "Most people quit right here" -> pause the drawing; a dashed vertical line at year 10 with a small label "Most people quit here".
  - CUE: "Then the line starts to bend" -> resume drawing.
  - CUE: "Twenty years" -> reach year 20, dot + label "$52,093".
  - CUE: "Thirty years" -> reach year 30, dot + label "$121,997".
  - CUE: "And at forty years" -> draw to year 40, the end dot grows, and a big counter "$262,481" (120px, cream) counts up next to the end point, finishing exactly when the narrator finishes saying "eighty-one dollars".
- All line shapes come from `yearlySeries` (monthly precision, plotted per month for smoothness).

### Scene 08: Decade by decade
Layout: four vertical bars, evenly spaced, bottom-aligned, one shared Y scale.
- CUE: "In your first ten years" -> bar 1 grows, label "+$17K".
- CUE: "In the second decade" -> bar 2, "+$35K".
- CUE: "In the third" -> bar 3, "+$70K".
- CUE: "And in the final decade" -> bar 4 grows in amber, "+$140K".
- CUE: "That last decade alone" -> bars 1, 2 and 3 lift and stack into one combined bar placed next to bar 4. The stack is visibly shorter. Label between them: "Last 10 years > first 30 years".
- CUE: "The only thing that changed was time" -> everything except bar 4 dims to 40%.
- Bar labels use the compact formatter on the exact decade values.

### Scene 09: The tipping point
Layout: a horizontal "year" counter top-left, two horizontal bars center: cream "You deposited" and amber "Growth earned".
- Scene start: year counter at "Year 1". Cream bar at $1,200 scale, amber bar tiny ($39).
- The counter runs from year 1 upward. Speed it so it reaches "Year 11" exactly at the cue "In year eleven".
- CUE: "In year eleven" -> freeze. The amber bar ($1,290) now passes the cream bar ($1,200). A vertical marker at the crossing point, label "Year 11: your money out-earns you". Show both values.
- CUE: "From that point on" -> unfreeze, the counter runs fast to "Year 40". Cream bar stays at $1,200, amber bar grows to $17,651 (scale the bar area so it fits, the cream bar becomes visibly tiny next to it).
- CUE: "the gap gets wider" -> final label next to amber bar "$17,651 in year 40".

### Scene 10: The cost of waiting
Layout: line chart again, same axes as Scene 07 for continuity.
- Scene start: the amber 7% line from Scene 07 is already drawn (label "Start at 25").
- CUE: "you start at thirty-five" -> a second line in cream draws from year 10 to year 40 (30 years of investing), label "Start at 35".
- CUE: "You'd think you'd end up with about three quarters" -> a ghost dashed line or marker at 75% of $262,481 ($196,861) appears with label "What you'd expect", cream 50%.
- CUE: "You don't" -> ghost marker fades.
- CUE: "You end up with one hundred and twenty-two thousand" -> end label "$121,997" on the cream line.
- CUE: "Less than half" -> the vertical gap between the two end points is highlighted with an amber bracket, label "$140,484 difference".
- CUE: "To catch up" -> chart shrinks to the left, a split card appears on the right: "Start at 25: $100 / month" and "Start at 35: $215 / month". The "$215" in amber.
- CUE: "It costs you the best decade" -> the year 30 to 40 section of the amber line glows (opacity pulse, no glow effect), label "The best decade".

### Scene 11: Where the money came from
Layout: one large circle (diameter about 560px) center, labels on both sides. This scene deliberately echoes the channel logo.
- CUE: "Back to our two hundred" -> full circle appears in amber with "$262,481" in its center (cream, 72px).
- CUE: "Forty-eight thousand" -> a cream slice separates out: angle = 48,000 / 262,481 of the circle (about 18.3%). Label on the left "You: $48,000".
- CUE: "The other two hundred and fourteen thousand" -> the amber part pulls slightly outward (like the logo). Label on the right "Growth: $214,481".
- CUE: "about eighty-two percent" -> big "82%" appears on the amber part.
- CUE: "That's the sum of parts" -> the whole shape morphs smoothly into the channel logo (four slices, one amber pulled out), then holds.

### Scene 12: The fine print
Layout: line chart, same axes as Scene 07.
- CUE: "A few honest caveats" -> the smooth amber line is shown alone.
- CUE: "Real markets don't climb in a smooth line" -> the smooth line morphs into a jagged path that has two or three visible drops but ends at the same final value. Small labels at the drops: "Crash". Small text bottom-right: "Illustrative".
- CUE: "kept investing through the crashes" -> small arrow markers along the line continuing upward after each drop.
- CUE: "Fees matter too" -> chart shrinks, card appears: "1% yearly fee" and below it "$262,481 → $199,149" with "-$63,332" in amber.
- CUE: "this is education, not financial advice" -> a pill "Education, not financial advice" appears center, stays to scene end.

### Scene 13: Takeaway
Layout: a vertical recap stack, centered.
- CUE: "So, what does one hundred dollars" -> line 1 "$100 a month".
- CUE: "forty years" (first occurrence in this scene) -> line 2 "40 years".
- CUE: "At the historical average" -> line 3 "7% a year".
- CUE: "more than a quarter of a million dollars" -> a divider line draws, then "= $262,481" in amber, 120px.
- CUE: "Because of time" -> everything fades except one word "Time." in cream, 160px, center.
- CUE: "The amount matters less than you think" -> "Amount" appears small. CUE: "The start date matters more" -> "Start date" appears large in amber. (A simple visual of "small vs big".)
- CUE: "that's the next video" -> fade into the end card.

### End card
Use the existing end card component. 20 seconds. Two placeholder video slots labeled "Coming soon" (I'll replace them later in YouTube's end screen editor; this layout only reserves the space). Subscribe prompt. Logo small.

**CHECKPOINT 3 (repeat per group):** Build in this order and stop after each group, giving me the frames to preview:
1. Scenes 01 to 04
2. Scenes 05 to 07
3. Scenes 08 to 10
4. Scenes 11 to 13 and end card

For each group, render stills with `npx remotion still` at every cue frame of that group, look at them yourself, fix any overlap, clipping or misalignment BEFORE showing me, then list the stills.

---

## 5. Phase 4: Audio mix

- Voiceover at full level, normalized to about -16 LUFS integrated (measure with ffmpeg `loudnorm` in a script, adjust volume in Remotion, do not overwrite the source mp3).
- Music file: `public/music/bed.mp3` (provided by me, not generated). If it exists: loop it under the whole video at about -30 LUFS, and duck it a further 6dB whenever the voice is active (use the word timestamps to build the duck envelope). Fade music in over 1s at the start and out over 2s at the end. During Scene 02 (logo) and the end card, raise the music to about -22 LUFS.
- If no music file exists, skip music silently and tell me at the end.
- No other sounds unless files exist in `public/sfx/`.

---

## 6. Phase 5: Final QA (do all of this before telling me it's done)

1. Re-run the finance tests. All pass.
2. Search the scene code for any hardcoded number that should come from `data.ts`. There should be none (except purely visual sizes).
3. For every cue, check the event frame is within 3 frames of its timestamp in timeline.json. Print a table: cue, expected frame, actual frame, difference.
4. Render stills at every scene start and at every cue. Check: no text outside the 96px safe margin, no overlapping text, no text under 36px, every scene uses only brand colors.
5. Confirm there is no frame of pure empty background longer than 0.5s (except during intentional holds with motion).
6. Check total duration matches the audio timeline plus the end card.

Print a short QA report with the results.

---

## 7. Phase 6: Render and extras

1. Render the final video:
   - Composition: `Video01`
   - Output: `out/100-a-month-40-years.mp4`
   - Codec H.264, CRF 18, pixel format yuv420p, AAC audio at 320kbps.
2. Generate YouTube chapters from timeline.json in this format, and save to `out/100-a-month-40-years-chapters.txt` (first chapter must be 0:00):
   - 0:00 The question
   - The rules (Scene 03)
   - The mattress (Scene 04)
   - How compounding works (Scene 05)
   - Why 7% (Scene 06)
   - The curve (Scene 07)
   - Decade by decade (Scene 08)
   - The tipping point (Scene 09)
   - The cost of waiting (Scene 10)
   - Where the money comes from (Scene 11)
   - The fine print (Scene 12)
   - The takeaway (Scene 13)
3. Export an SRT subtitle file from the word timestamps (lines of max 42 characters, max 2 lines, using the ORIGINAL script wording from voiceover.txt, not Whisper's raw text, and numbers written as digits for readability: "$262,481", "7%"). Save to `out/100-a-month-40-years.srt`. Remember the Scene 02 offset.
4. Create a `Thumbnail01` still composition at 1280x720: navy grid background, small cream "$100/mo" top-left area, a thin amber line curving sharply upward from bottom-left to top-right, big cream "$262,481" right side (at least 150px), no other text. Render to `out/100-a-month-40-years-thumbnail.png`.

When everything is done, give me: the video path, the chapters text (ready to paste), the SRT path, the thumbnail path, and the QA report. Nothing else.
