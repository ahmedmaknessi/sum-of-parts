/**
 * Video files for the GitHub Actions runner. Rendered files live in out/
 * (git-ignored), so `publish:propose` uploads them to a draft release named
 * "media-<slug>" (drafts are visible only to the repo's owner and
 * collaborators). The runner downloads what it needs by file name, and the
 * release is deleted once every post of the video is live. Uses the gh CLI
 * (signed in locally; GH_TOKEN on Actions).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Post } from "./queue";

const root = process.cwd();
export const mediaTag = (slug: string) => `media-${slug}`;

const gh = (args: string[]) => {
  const r = spawnSync("gh", args, { encoding: "utf8", cwd: root });
  return { ok: r.status === 0, out: r.stdout.trim(), err: r.stderr.trim() };
};

/** Every local file a post needs. */
export const filesOf = (post: Post): string[] =>
  [post.file, post.thumbnail, post.captions, post.cover].filter((f): f is string => Boolean(f));

/** Uploads the files to the video's draft release (replacing files with the same name). */
export const uploadMedia = (slug: string, files: readonly string[], log: (m: string) => void = console.log) => {
  const tag = mediaTag(slug);
  if (!gh(["release", "view", tag]).ok) {
    const made = gh(["release", "create", tag, "--draft", "--title", `Media: ${slug}`, "--notes", "Video files for the posting runner (scripts/publish). Deleted once every post is live."]);
    if (!made.ok) throw new Error(`could not create the media release: ${made.err}`);
  }
  for (const f of [...new Set(files)]) {
    log(`uploading ${f}...`);
    const up = gh(["release", "upload", tag, path.join(root, f), "--clobber"]);
    if (!up.ok) throw new Error(`upload of ${f} failed: ${up.err}`);
  }
};

/** Makes sure a file is on disk, downloading it from the video's media release if needed. */
export const ensureLocal = (slug: string, file: string) => {
  const full = path.join(root, file);
  if (existsSync(full)) return;
  mkdirSync(path.dirname(full), { recursive: true });
  const r = gh(["release", "download", mediaTag(slug), "-p", path.basename(file), "-D", path.dirname(full), "--clobber"]);
  if (!r.ok || !existsSync(full)) throw new Error(`${file} is not on disk and not in the ${mediaTag(slug)} release: ${r.err}`);
};

export const deleteMedia = (slug: string) => gh(["release", "delete", mediaTag(slug), "--yes"]).ok;
