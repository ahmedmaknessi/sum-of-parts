/**
 * Posting automation. Claude prepares the posts, the owner approves them, this
 * schedules only what was approved.
 *
 *   npm run publish:review   -- <slug> [--full]      table of posts, checks, what is still manual
 *   npm run publish:approve  -- <slug> <id...|all>   approve drafts (ties the approval to their content)
 *   npm run publish:schedule -- <slug> [--dry-run]   hand approved posts to YouTube / Facebook, queue Instagram
 *   npm run publish:due                              publish Instagram posts that are due, add first comments
 *   npm run publish:auth     -- youtube | meta <user-token>
 *   npm run publish:check                            which accounts the saved tokens post to (read-only)
 *
 * Setup and the full workflow: docs/publishing.md
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as meta from "./meta";
import { approve, isApproved, linkTargets, loadQueue, note, queuePath, resolveLinks, saveQueue, validate, type Post, type Queue } from "./queue";
import * as youtube from "./youtube";

const root = process.cwd();
const [command, ...args] = process.argv.slice(2);

const durations = new Map<string, number>();
const durationOf = (file: string): number => {
  const full = path.join(root, file);
  if (!existsSync(full)) return NaN;
  if (!durations.has(full)) {
    const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", full], { encoding: "utf8" });
    durations.set(full, Number(r.stdout.trim()));
  }
  return durations.get(full)!;
};

const checks = (post: Post, queue: Queue): string[] => {
  const errors: string[] = [];
  for (const id of linkTargets(`${post.text} ${post.firstComment ?? ""}`)) {
    const target = queue.posts.find((p) => p.id === id);
    if (!target || target.platform !== "youtube") errors.push(`{{youtube:${id}}} points to no YouTube post`);
    else if (Date.parse(target.publishAt) > Date.parse(post.publishAt)) errors.push(`links to ${id}, which goes live later`);
  }
  for (const f of [post.file, post.thumbnail, post.captions, post.cover].filter(Boolean) as string[]) {
    if (!existsSync(path.join(root, f))) errors.push(`missing file ${f}`);
  }
  if (errors.length) return errors;
  if (post.thumbnail && statSync(path.join(root, post.thumbnail)).size > 2 * 1024 * 1024) errors.push("thumbnail is over 2 MB");
  return [...errors, ...validate(post, durationOf)];
};

const when = (iso: string) => {
  const d = new Date(iso);
  const fmt = (tz: string) => d.toLocaleString("en-GB", { timeZone: tz, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return `${fmt("America/New_York")} New York | ${fmt(Intl.DateTimeFormat().resolvedOptions().timeZone)} here`;
};

const slugArg = () => {
  const slug = args.find((a) => !a.startsWith("--"));
  if (!slug) throw new Error("Give the video slug, e.g. why-cant-countries-print-money");
  return slug;
};

const review = (queue: Queue, full: boolean) => {
  console.log(`\nPosting queue: ${queue.slug} (${path.relative(root, queuePath(queue.slug))})\n`);
  for (const p of [...queue.posts].sort((a, b) => Date.parse(a.publishAt) - Date.parse(b.publishAt))) {
    const errors = p.status === "draft" || p.status === "approved" ? checks(p, queue) : [];
    const sec = durationOf(p.file);
    console.log(`[${p.status.toUpperCase()}] ${p.id}  ${p.platform} ${p.kind}  ${Number.isNaN(sec) ? "" : `${sec.toFixed(0)} s`}`);
    console.log(`   when: ${when(p.publishAt)}`);
    console.log(`   file: ${p.file}`);
    if (p.title) console.log(`   title: ${p.title}`);
    console.log(`   text: ${full ? `\n${p.text.replace(/^/gm, "      ")}` : p.text.split("\n")[0].slice(0, 110) + (p.text.length > 110 ? "..." : "")}`);
    if (p.firstComment) console.log(`   first comment: ${p.firstComment}`);
    if (p.remote?.url) console.log(`   link: ${p.remote.url}`);
    for (const e of errors) console.log(`   ! ${e}`);
    if (p.error) console.log(`   ! last error: ${p.error}`);
    for (const m of p.manual ?? []) console.log(`   (by hand) ${m}`);
    console.log("");
  }
  const counts = queue.posts.reduce<Record<string, number>>((c, p) => ({ ...c, [p.status]: (c[p.status] ?? 0) + 1 }), {});
  console.log(Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", "));
};

const schedule = async (queue: Queue, dryRun: boolean) => {
  // YouTube first: other posts link to its videos.
  const order = { youtube: 0, facebook: 1, instagram: 2 } as const;
  const todo = queue.posts.filter(isApproved).sort((a, b) => order[a.platform] - order[b.platform]);
  if (todo.length === 0) console.log("Nothing approved to schedule.");
  for (const p of todo) {
    const errors = checks(p, queue);
    if (errors.length) {
      console.log(`SKIP ${p.id}: ${errors.join("; ")}`);
      continue;
    }
    if (dryRun) {
      console.log(`would ${p.platform === "instagram" ? "queue" : "schedule"} ${p.id} (${p.platform} ${p.kind}) for ${when(p.publishAt)}`);
      continue;
    }
    try {
      console.log(`${p.id}: uploading to ${p.platform}...`);
      if (p.platform === "youtube") {
        const v = await youtube.uploadScheduled(p, root);
        p.remote = { id: v.id, url: v.url };
        if (p.thumbnail) await youtube.setThumbnail(v.id, path.join(root, p.thumbnail));
        if (p.captions) await youtube.uploadCaptions(v.id, path.join(root, p.captions));
        p.status = "scheduled";
        if (v.locked) {
          p.manual = [...(p.manual ?? []), "YouTube locked this API upload to private (API project not audited yet): in YouTube Studio set Visibility > Schedule to the same time"];
          note(p, "uploaded, but locked private by YouTube (unaudited API project)");
        } else note(p, `scheduled on YouTube: ${v.url}`);
      } else if (p.platform === "facebook") {
        const resolved = { ...p, text: resolveLinks(queue, p.text) };
        const v = p.kind === "reel" ? await meta.scheduleFacebookReel(resolved, root) : await meta.scheduleFacebookVideo(resolved, root);
        p.remote = { id: v.id, url: v.url };
        p.status = "scheduled";
        note(p, `scheduled on Facebook: ${v.url}`);
      } else {
        p.status = "queued";
        note(p, "queued: npm run publish:due publishes it at its time");
      }
      delete p.error;
      console.log(`  ${p.status}${p.remote?.url ? `: ${p.remote.url}` : ""}`);
    } catch (e) {
      p.status = "failed";
      p.error = (e as Error).message;
      note(p, `failed: ${p.error}`);
      console.log(`  FAILED: ${p.error}`);
    }
    saveQueue(queue);
  }
};

/**
 * Instagram only takes covers as public URLs: upload the cover to the repo's
 * "publish-assets" GitHub release (the repo is public) and return its URL.
 */
const hostCover = (cover: string): string => {
  const gh = (a: string[]) => spawnSync("gh", a, { encoding: "utf8", cwd: root });
  const repo = gh(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]).stdout.trim();
  if (!repo) throw new Error("gh CLI not signed in: cannot host the Instagram cover");
  if (gh(["release", "view", "publish-assets"]).status !== 0) {
    gh(["release", "create", "publish-assets", "--title", "Publishing assets", "--notes", "Instagram covers, hosted for the Graph API (scripts/publish)."]);
  }
  const up = gh(["release", "upload", "publish-assets", path.join(root, cover), "--clobber"]);
  if (up.status !== 0) throw new Error(`cover upload failed: ${up.stderr}`);
  return `https://github.com/${repo}/releases/download/publish-assets/${path.basename(cover)}`;
};

/** Runs every few minutes (Task Scheduler): Instagram posts that are due, first comments, done markers. */
const due = async () => {
  const lock = path.join(root, ".secrets", "due.lock");
  if (existsSync(lock) && Date.now() - statSync(lock).mtimeMs < 30 * 60_000) return console.log("another run is in progress");
  writeFileSync(lock, String(process.pid));
  try {
    const videos = readdirSync(path.join(root, "src", "videos")).filter((s) => existsSync(queuePath(s)));
    for (const slug of videos) {
      const queue = loadQueue(slug);
      const now = Date.now();
      for (const p of queue.posts) {
        const isDue = Date.parse(p.publishAt) <= now;
        if (!isDue) continue;
        try {
          if (p.platform === "instagram" && p.status === "queued") {
            const late = Math.round((now - Date.parse(p.publishAt)) / 60_000);
            console.log(`${slug}/${p.id}: publishing Instagram Reel${late > 20 ? ` (${late} min late)` : ""}...`);
            const resolved = { ...p, text: resolveLinks(queue, p.text), coverUrl: p.coverUrl ?? (p.cover ? hostCover(p.cover) : undefined) };
            let r;
            try {
              r = await meta.publishInstagramReel(resolved, root, (m) => note(p, m));
            } catch (e) {
              if (!resolved.coverUrl || !/cover/i.test((e as Error).message)) throw e;
              note(p, `cover refused (${(e as Error).message}): posting with a video frame as cover`);
              r = await meta.publishInstagramReel({ ...resolved, coverUrl: undefined }, root, (m) => note(p, m));
            }
            p.remote = { id: r.id, url: r.url, containerId: r.containerId };
            p.status = "posted";
            note(p, `posted: ${r.url ?? r.id}`);
          }
          if (p.status === "scheduled" && p.platform === "facebook" && p.remote?.id) {
            if (!(await meta.facebookIsLive(p.remote.id))) continue;
            p.status = "posted";
            note(p, "live on Facebook");
          }
          if (p.status === "scheduled" && p.platform === "youtube" && !(p.manual ?? []).some((m) => m.includes("locked"))) {
            p.status = "posted";
            note(p, "publish time passed (YouTube published it)");
          }
          if (p.status === "posted" && p.firstComment && p.remote?.id && !p.remote.commentId && p.platform !== "youtube") {
            p.remote.commentId = await meta.comment(p.remote.id, resolveLinks(queue, p.firstComment));
            note(p, "first comment posted");
          }
          delete p.error;
        } catch (e) {
          p.error = (e as Error).message;
          if (p.platform === "instagram") p.status = "failed";
          note(p, `failed: ${p.error}`);
          console.log(`${slug}/${p.id}: FAILED ${p.error}`);
        }
        saveQueue(queue);
      }
    }
  } finally {
    rmSync(lock, { force: true });
  }
};

const main = async () => {
  switch (command) {
    case "review":
      return review(loadQueue(slugArg()), args.includes("--full"));
    case "approve": {
      const queue = loadQueue(slugArg());
      const ids = args.slice(1);
      const picked = ids.includes("all") ? queue.posts.filter((p) => p.status === "draft") : queue.posts.filter((p) => ids.includes(p.id));
      if (picked.length === 0) throw new Error(`No matching posts: ${ids.join(" ")}`);
      for (const p of picked) {
        const errors = checks(p, queue);
        if (errors.length) {
          console.log(`NOT approved ${p.id}: ${errors.join("; ")}`);
          continue;
        }
        approve(p);
        console.log(`approved ${p.id}`);
      }
      return saveQueue(queue);
    }
    case "schedule":
      return schedule(loadQueue(slugArg()), args.includes("--dry-run"));
    case "due":
      return due();
    case "auth":
      if (args[0] === "youtube") return youtube.authorize();
      if (args[0] === "meta" && args[1]) return meta.authorize(args[1]);
      throw new Error("Usage: npm run publish:auth -- youtube | meta <user-token>");
    case "check":
      for (const [name, fn] of [["YouTube", youtube.whoAmI], ["Meta", meta.whoAmI]] as const) {
        try {
          console.log(`${name}: ${await fn()}`);
        } catch (e) {
          console.log(`${name}: NOT READY: ${(e as Error).message}`);
        }
      }
      return;
    default:
      throw new Error("Commands: review, approve, schedule, due, auth, check (see docs/publishing.md)");
  }
};

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
