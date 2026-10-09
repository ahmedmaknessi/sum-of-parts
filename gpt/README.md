# Running the Sum of Parts pipeline with GPT (Codex)

Everything GPT needs to build a video the same way Claude does.

**This folder is not a standalone kit.** It only works inside a full copy of the Sum of Parts repository: GPT builds on the project's code, the shared paper components, the scripts and the previous videos. Never open Codex on `gpt/` alone, and never copy `gpt/` out of the repo.

| File | What it is |
|---|---|
| `PROMPT.md` | The prompt to paste into Codex for a new video (fill in the "This job" lines first). |
| `AGENTS.md` | The project rules: a copy of `CLAUDE.md`, generated. Edit `CLAUDE.md`, never this file. |
| `LESSONS.md` | What the owner wants and the traps already hit in videos 01 to 03. |
| `skills/` | The Remotion notes (best practices, markup, render, captions, interactivity, studio), copied from `.claude/skills/`. |
| `sync.mjs` | Refreshes `AGENTS.md` and `skills/` from their sources: `npm run gpt:sync`. |

The repo-root `AGENTS.md` is a two-line pointer to this folder: Codex auto-loads `AGENTS.md` from the folder it is opened in, so the pointer makes it read the rules here.

## Setup on a new computer (once)

1. **Access:** the repository is public on GitHub: https://github.com/ahmedmaknessi/sum-of-parts. Anyone can download it; only collaborators can push changes back.
2. **Tools:** install Git, Node.js 22 and ffmpeg (on the PATH: `ffmpeg -version` must work in a terminal).
3. **Get the project:**
   ```
   git clone https://github.com/ahmedmaknessi/sum-of-parts.git
   cd sum-of-parts
   npm install
   ```
4. **Music:** licensed music packs are not in Git. Copy the pack you need from the owner into `public/music/<pack-folder>/` (for videos 02 and 03: `public/music/money-in-your-bank-doesnt-exist/`). The transcription model (whisper.cpp) downloads itself the first time you run `npm run transcribe`.
5. **Check it works:** `npm test` and `npm run lint` must pass, and `npm run dev` opens Remotion Studio with videos 01 to 03.

## Which tool and model

- Use **Codex** (CLI, IDE extension or desktop app), not ChatGPT chat: the job needs a shell, `npm`, Remotion renders and looking at stills.
- Model: the strongest coding model in Codex's model menu, reasoning **high**. As of October 2026 that is reported to be **GPT-6.1 Sol** (Codex's default), with **GPT-6 Astra** as the top tier for the hardest work. The names vary between sources, so check the menu. Start with Sol; switch to Astra if scene building struggles.

## How to run a new video

1. Put the video's files somewhere on the computer: `script.md`, `voiceover.txt`, the final voiceover mp3, any images, and the music pack (or decide "no music").
2. Open Codex on the **repository root** (the `sum-of-parts` folder that holds `package.json`, `src/` and `gpt/`), not on `gpt/`.
3. Copy `PROMPT.md` (everything below its line), fill in the **"This job"** lines with the real title, slug and file paths, and paste it.
4. Codex answers with the intake checklist. Answer every open item (style, motion, text treatment, exceptions, pillar, sources, end screen, music...). It builds nothing until the checklist is complete: that is on purpose.
5. At the end it reports every file, its length and the QA results. Commit only when you decide to.

## Keeping Claude and GPT in step

`CLAUDE.md` stays the single source of truth for both. After you or Claude change it, run `npm run gpt:sync`. When a new lesson comes up in a session, add it to `LESSONS.md`.
