# Video 03 build notes

Intake completed 2026-10-08. These decisions override `script.md` where they differ; everything else in `script.md` (scenes, cues, facts, accuracy rules) applies as written.

## Decisions

| Topic | Decision |
|---|---|
| Style | **Light paper**, same as video 02: cream board, vivid `PAPER_COLORS` objects, navy as a paper colour. The script's "navy surface" becomes the cream board. |
| Banknote | The hook uses the **real photo of the Zimbabwe 100 trillion note** (user's call; the script said to draw a generic note), via `PaperPhoto`: posterized, slightly desaturated and warmed, cut with a paper edge, grain and shadow. Thumbnails still use a generic paper note, never the real design. |
| Figures | Faceless paper figures allowed for this video. |
| Motion | On twos, slight overshoot and settle wobble, as in video 02. |
| Maps | Simplified Zimbabwe and contiguous-US outlines traced from Natural Earth 110m (`parts/outlines.ts`). No flags. |
| Text | Cut paper titles and numbers; source lower thirds flat. Outfit has no arrow glyph: "Money: $10 -> $20" uses a drawn paper arrow (`ArrowLabel`). |
| Accuracy | "79,600,000,000%" and "24.7 hours" shown exactly; the 40% is the money supply (shown as +40.6%), never prices. The island is tagged "Simplified example". "About $30" stands in for the script's "≈ $30". |
| Music | The same "Pizzicato Polka" pack as video 02 (`public/music/money-in-your-bank-doesnt-exist/`); the whole channel is registered on Envato. |
| Voice | A different ElevenLabs library voice, not a clone: no synthetic-content disclosure. |
| End screen | Video 02 on the left, a playlist on the right. |
| Shorts | Four multi-scene Shorts of 1.5 to 2 minutes, Instagram covers, a Facebook landscape teaser. |

## Shared code

The paper kit moved from video 02 to `src/components/paper/` (`kit.tsx`, `machine.tsx`, `theme.ts`, plus new `PaperPhoto` and `PaperSceneRoot`); video 02 re-exports it, its output unchanged. Video 03's logo intro and end card are video 02's scenes. Scene order lives in `scene-list.ts` (used by `Video03.tsx` and `Root.tsx`).

## QA notes

- Static QA: all checks pass (98 cues within 3 frames).
- Frame QA: remaining safe-margin flags are pieces caught mid-slide entering from off-frame at the sampled cue frames, and the intentional full-screen note flood on "stories like Zimbabwe" (scene 09). Pieces at rest sit inside the safe area.
