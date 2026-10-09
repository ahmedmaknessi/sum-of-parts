# Lessons from videos 01 to 03

What the owner has asked for, and the traps already hit. Read this before starting a video. Rules in `AGENTS.md` still come first.

## What the owner wants

- **Intake is a hard gate.** Send the checklist first, marking what is provided and what is missing. Build nothing until every required item is in. Ask about gaps; never guess numbers, sources, wording or timestamps.
- **Style is chosen per video:** dark paper, light paper or mixed (reference clips in Studio "Style-Tests" and `out/style-tests/`). Never mix two styles in one video. Video 01 stays in the old flat style.
- **Shorts are 1.5 to 2 minutes:** 4 per video, 3 or 4 consecutive scenes each, in the vertical `ShortFrame` (title, burned-in captions, the scenes' own voice and sound).
- **`socials.md` always includes the YouTube Shorts** (title, description, Related video setting per Short), next to Instagram Reels (caption, hashtags, alt text, cover) and Facebook (Reels + the landscape teaser). `youtube.md` only points to it for Shorts.
- **Per-video deliverables:** full video, 3 thumbnails (the script's design + 2 colourful), 4 Shorts, 4 Instagram covers, a Facebook landscape teaser that asks the question and keeps the answer for YouTube, `youtube.md`, `socials.md`.
- **Never commit or push unless asked.** Only render when asked (the full deliverable request counts as asking).
- The voice is an ElevenLabs **library** voice, not a clone: no synthetic-content disclosure. Music: Envato Elements pack, the whole channel is registered.

## Timing traps

- The transcriber mishears some words ("brake" as "break", "sportsbooks" as "sports books", "U.S." vs "US"). Cue on the words just before the misheard one instead of hacking the normalizer.
- If you change `scripts/lib/words.ts`, prove videos 01 to 03 produce identical `timeline.json`.
- Long holds look frozen: add beat cues (a phrase in `timeline-spec.ts`) so something changes at least every 4 seconds.
- Static QA wants each cue's **first** event within 3 frames of the spoken word. Start the first visible change exactly at the cue (`enter(frame, cue.x, ...)`), and put later follow-ups at `cue.x + N`.
- Frame QA compares the frame before a cue with cue + 3: the first change must be visible within 2 frames (on twos). A slow fade or a piece still off-frame at that point fails.

## Layout traps

- Every resting piece, its shadow and any scenery card must stay inside the safe area. Full-bleed sea, hills or a sun setting "below the horizon" fail the margin check: keep scenery as a card inside the frame, shrink a setting sun instead of dropping it out.
- Pieces sliding in from off-frame will be caught mid-move at sampled frames. That is accepted; list those frames in `BUILD_NOTES.md`.
- Labels near the top: a 64 px label centred at y = 140 already pokes into the 96 px margin. Centre top labels at y >= 170.
- On the cream board, cream pieces vanish: use a coloured or navy backing.
- Outfit has no `→` or `≈`: draw the arrow (`ArrowLabel`) or reword ("About $30").
- `ExampleTag` takes a `text` prop ("Simplified example").
- Empty board: the video check fails any stretch over 0.5 s with nothing on screen. Rhetorical questions in the voice ("So is printing money always bad?") are the usual gap: fill them with a question card.
- Look at a contact sheet of stills for every scene. Most layout bugs (overlaps, clipped digits, things off the edge) are only visible there.

## Data and copy traps

- Every on-screen number comes from `data.ts` and is asserted in `data.test.ts`; follow the script's accuracy rules exactly (e.g. show "79,600,000,000%" and "24.7 hours"; the 40% was the money supply, never prices).
- Thumbnails and covers never reproduce a real banknote, logo or brand design unless `BUILD_NOTES.md` says so.
- Captions and SRT: spoken years like "two thousand nine" must print as 2009. The exporter handles it now; still read the SRT.
- Facebook may refuse Reels over 90 seconds: say so in `socials.md` and offer posting as a normal Page video.

## Machine quirks (this Windows setup)

- `out/shorts/covers/` came up broken and unwritable: covers go to `out/covers/`. Don't delete the broken folder; report it.
- Writing regexes through shell heredocs mangled `\b` into a backspace character once. Edit files directly, or write helper scripts to the scratch folder.
- A full render takes about 25 to 40 minutes. Run it in the background and do other work meanwhile.
- The stills/contact-sheet helper used for video 03: bundle once with `@remotion/bundler`, `renderStill` at chosen frames with `scale: 0.5`, then tile with `ffmpeg ... xstack`. Run it with `NODE_PATH` pointing at the project's `node_modules` when it lives outside the repo.
