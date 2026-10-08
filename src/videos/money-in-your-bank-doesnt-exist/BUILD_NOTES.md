# Video 02 build notes

Intake completed 2026-10-08. These decisions override `script.md` where they differ; everything else in `script.md` (scenes, cues, facts, accuracy notes) applies as written.

## Decisions

| Topic | Decision |
|---|---|
| Style | **Light paper**: cream board, paper objects from the vivid `PAPER_COLORS` palette, navy as a paper colour (cards, ground, banners, text). |
| Palette | Vivid paper palette for objects and scenery. No new hex values: the script's `#1B2440` becomes `COLORS.background` / `COLORS.muted`. The 1930s sepia flashback uses the `kraft` tones with cream. |
| Text | **Everything is cut paper** (titles, words and numbers: paper pieces with rim and shadow). Only source lower thirds stay flat and unshadowed. |
| Figures | Faceless paper figures allowed **for this video only**. Sarah: cream body, small amber scarf. "Example" tag whenever she is on screen. |
| Motion | Animate on twos (poses update every 2 frames); camera drifts and parallax stay smooth at 30fps. Pieces may overshoot very slightly and settle with a 1 to 3 degree wobble; idle jitter under 0.5 degrees, seeded per piece. **Exception for this video.** |
| Shadows | Tokens updated permanently: depth 1 = 6px offset / 12px blur, up to about 14px / 28px for lifted pieces; black at 28% on cream. 1px cream rim at 15% on every cut edge. |
| Transitions | Paper only: a sheet sliding across, layers lifting off, or a page turn. No cross-dissolves. |
| Music | Envato Elements, "Pizzicato Polka" by Strauss (pack in `public/music/money-in-your-bank-doesnt-exist/`, git-ignored). Full arrangement on light moments, thinned to stems under dense explanations, near-silent with a tension pulse for the SVB bank run (Scene 11), back at deposit insurance. Ducked under the voice. The user registers the project on Envato before publishing. |
| SFX | Synthesized paper kit (slide, tap, rip, page turn, flip digit, stamp, typewriter, shredder, paper plane, pop, tension pulse). Sparse: key placements only. |
| Voice | ElevenLabs library voice, not a clone: no synthetic-content disclosure. |
| Cash figure | CURRCIR (currency in circulation), $2,472.3B, July 2026. Shown as "about 9 in 10" / the 100-square grid, never as a precise percentage. |
| End screen | Video 01 on the left, a playlist on the right. |

## Translating the script to light paper

The script was written for a navy surface. In light paper:

- "Navy paper desk / surface / table" becomes the cream board; depth comes from paper layers and shadows.
- "A large navy paper sheet sliding across the frame" (transitions, end card) stays navy: it is a paper piece, not the board.
- Cream pieces that would vanish on cream (cards, the phone, the ledger) sit on a navy or coloured backing card, or get a darker tone of the paper palette.
- Amber text on cream is too faint: amber stays a paper *shape* (strips, banners, highlighted pieces) with navy text on it.
