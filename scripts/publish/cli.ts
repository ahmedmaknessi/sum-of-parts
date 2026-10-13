/**
 * Posting automation. Claude prepares the posts, the owner approves them by
 * merging a pull request, GitHub Actions schedules and publishes them.
 *
 *   npm run publish:review   -- <slug> [--full]      the posts, their checks, what is still manual
 *   npm run publish:propose  -- <slug>               upload the files, open the "posts/<slug>" pull request
 *   npm run publish:approve  -- <slug> <id...|all>   approve by hand instead (local runs only)
 *   npm run publish:schedule -- <slug> [--dry-run]   hand approved posts to YouTube / Facebook, queue Instagram
 *   npm run publish:due                              publish due Instagram posts, first comments, done markers
 *   npm run publish:auth     -- youtube | meta <user-token>
 *   npm run publish:check                            which accounts the tokens post to (read-only)
 *   npm run publish:secrets                          copy the local keys into the GitHub repo's Actions secrets
 *
 * Run by GitHub Actions (.github/workflows/publish-*.yml):
 *   approve-merged <slug>   after the owner merges posts/<slug>: proposed -> approved
 *   remind                  daily nudge on posts pull requests left open
 *
 * Setup and the full workflow: docs/publishing.md
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { readSecret } from "./config";
import { deleteMedia, ensureLocal, filesOf, mediaTag, uploadMedia } from "./media";
import * as meta from "./meta";
import { approve, isApproved, linkTargets, loadQueue, note, queuePath, resolveLinks, saveQueue, validate, type Post, type Queue } from "./queue";
import * as youtube from "./youtube";

const root = process.cwd();
const [command, ...args] = process.argv.slice(2);
const CI = Boolean(process.env.GITHUB_ACTIONS);
const SUMMARY = path.join(root, "out", "publish-summary.md");

/** A line for the pull request comment the workflow posts (and the console). */
const report = (line: string) => {
  console.log(line);
  mkdirSync(path.dirname(SUMMARY), { recursive: true });
  appendFileSync(SUMMARY, `${line}\n`);
};

const run = (cmd: string, a: string[], opts: { cwd?: string; input?: string } = {}) => {
  const r = spawnSync(cmd, a, { encoding: "utf8", cwd: opts.cwd ?? root, input: opts.input });
  if (r.status !== 0) throw new Error(`${cmd} ${a.slice(0, 3).join(" ")} failed: ${r.stderr || r.stdout}`);
  return r.stdout.trim();
};

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
  for (const f of filesOf(post)) {
    if (!existsSync(path.join(root, f))) errors.push(`missing file ${f}`);
  }
  if (errors.length) return errors;
  if (post.thumbnail && statSync(path.join(root, post.thumbnail)).size > 2 * 1024 * 1024) errors.push("thumbnail is over 2 MB");
  return [...errors, ...validate(post, durationOf)];
};

const fmtTime = (iso: string, tz: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: tz, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const OWNER_TZ = process.env.PUBLISH_TIMEZONE ?? "Africa/Tunis";
const when = (iso: string) => `${fmtTime(iso, "America/New_York")} New York | ${fmtTime(iso, OWNER_TZ)} your time`;
const byTime = (a: Post, b: Post) => Date.parse(a.publishAt) - Date.parse(b.publishAt);

const slugArg = () => {
  const slug = args.find((a) => !a.startsWith("--"));
  if (!slug) throw new Error("Give the video slug, e.g. why-cant-countries-print-money");
  return slug;
};

// ---------------------------------------------------------------------------
// Review and propose
// ---------------------------------------------------------------------------

const review = (queue: Queue, full: boolean) => {
  console.log(`\nPosting queue: ${queue.slug} (${path.relative(root, queuePath(queue.slug))})\n`);
  for (const p of [...queue.posts].sort(byTime)) {
    const errors = ["draft", "proposed", "approved"].includes(p.status) ? checks(p, queue) : [];
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

const PLATFORM = { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook" } as const;
const KIND = { video: "video", short: "Short", reel: "Reel" } as const;
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

/** The pull request description: what will go out, when, and what stays manual. */
const proposalBody = (queue: Queue, posts: Post[], releaseUrl: string) => {
  const rows = posts
    .sort(byTime)
    .map((p) => `| ${fmtTime(p.publishAt, OWNER_TZ)} | ${PLATFORM[p.platform]} ${KIND[p.kind]} | ${cell(p.title ?? p.text.split("\n")[0]).slice(0, 90)} | \`${path.basename(p.file)}\` |`);
  const details = posts.map((p) => {
    const lines = [`<details><summary><b>${p.id}</b>: ${PLATFORM[p.platform]} ${KIND[p.kind]}, ${when(p.publishAt)}</summary>`, ""];
    if (p.title) lines.push(`**Title:** ${p.title}`, "");
    lines.push("```", p.text, "```");
    if (p.tags?.length) lines.push(`**Tags:** ${p.tags.join(", ")}`);
    if (p.firstComment) lines.push(`**First comment:** ${p.firstComment}`);
    if (p.thumbnail) lines.push(`**Thumbnail:** \`${path.basename(p.thumbnail)}\``);
    if (p.cover) lines.push(`**Cover:** \`${path.basename(p.cover)}\``);
    if (p.manual?.length) lines.push("", "**By hand after it's live:**", ...p.manual.map((m) => `- ${m}`));
    lines.push("", "</details>");
    return lines.join("\n");
  });
  return [
    `## ${posts.length} posts for \`${queue.slug}\``,
    "",
    `**Merge this pull request to approve them.** GitHub then schedules every post below exactly as written. Want a change? Comment here (or tell Claude) and the pull request gets updated; merging always approves the latest version.`,
    "",
    `Watch the files before you merge: [media release](${releaseUrl}) (only you can see it).`,
    "",
    `| Your time (${OWNER_TZ}) | Where | Title / first line | File |`,
    "|---|---|---|---|",
    ...rows,
    "",
    "`{{youtube:yt-main}}` becomes the main video's link once it is uploaded.",
    "",
    "### Every post in full",
    "",
    ...details,
  ].join("\n");
};

const propose = (slug: string) => {
  const queue = loadQueue(slug);
  const posts = queue.posts.filter((p) => p.status === "draft" || p.status === "proposed");
  if (posts.length === 0) throw new Error("No draft posts to propose.");
  const problems = posts.flatMap((p) => checks(p, queue).map((e) => `${p.id}: ${e}`));
  if (problems.length) throw new Error(`Fix these first:\n${problems.join("\n")}`);

  uploadMedia(slug, posts.flatMap(filesOf));
  const releaseUrl = run("gh", ["release", "view", mediaTag(slug), "--json", "url", "-q", ".url"]);

  // The proposal lives only on the posts/<slug> branch: the local queue keeps its drafts.
  for (const p of posts) {
    p.status = "proposed";
    note(p, "proposed for approval");
  }
  const branch = `posts/${slug}`;
  const rel = path.relative(root, queuePath(slug));
  const tmp = mkdtempSync(path.join(os.tmpdir(), "sop-posts-"));
  const wt = path.join(tmp, "wt");
  run("git", ["fetch", "origin", "main"]);
  run("git", ["worktree", "add", "-B", branch, wt, "origin/main"]);
  try {
    mkdirSync(path.dirname(path.join(wt, rel)), { recursive: true });
    writeFileSync(path.join(wt, rel), JSON.stringify(queue, null, 2) + "\n");
    run("git", ["add", rel], { cwd: wt });
    run("git", ["commit", "-m", `Posts for ${slug}: ${posts.length} posts awaiting approval`], { cwd: wt });
    run("git", ["push", "--force", "origin", branch], { cwd: wt });
  } finally {
    run("git", ["worktree", "remove", "--force", wt]);
    rmSync(tmp, { recursive: true, force: true });
  }
  const bodyFile = path.join(os.tmpdir(), `sop-pr-${slug}.md`);
  writeFileSync(bodyFile, proposalBody(queue, posts, releaseUrl));
  const open = run("gh", ["pr", "list", "--head", branch, "--state", "open", "--json", "number", "-q", ".[0].number"]);
  if (open) {
    run("gh", ["pr", "edit", open, "--body-file", bodyFile]);
    console.log(`Updated pull request #${open}`);
  } else {
    console.log(run("gh", ["pr", "create", "--base", "main", "--head", branch, "--title", `Posts for ${slug}: approve to schedule`, "--body-file", bodyFile]));
  }
};

// ---------------------------------------------------------------------------
// Approve (on merge) and schedule
// ---------------------------------------------------------------------------

const approveMerged = (slug: string) => {
  const queue = loadQueue(slug);
  const posts = queue.posts.filter((p) => p.status === "proposed");
  report(`### Approval: ${slug}`);
  for (const p of posts) {
    try {
      filesOf(p).forEach((f) => ensureLocal(slug, f));
      const errors = checks(p, queue);
      if (errors.length) {
        p.status = "draft";
        p.error = errors.join("; ");
        note(p, `not approved: ${p.error}`);
        report(`- :warning: **${p.id}** not approved: ${p.error}`);
        continue;
      }
      approve(p);
      report(`- ${p.id} approved`);
    } catch (e) {
      p.status = "draft";
      p.error = (e as Error).message;
      report(`- :warning: **${p.id}**: ${p.error}`);
    }
  }
  saveQueue(queue);
};

const schedule = async (queue: Queue, dryRun: boolean) => {
  // YouTube first: other posts link to its videos.
  const order = { youtube: 0, facebook: 1, instagram: 2 } as const;
  const todo = queue.posts.filter(isApproved).sort((a, b) => order[a.platform] - order[b.platform]);
  report(`### Scheduling: ${queue.slug}`);
  if (todo.length === 0) return report("Nothing approved to schedule.");

  // Accounts must be connected before anything is touched; otherwise posts stay approved for a re-run.
  if (!dryRun) {
    const needed = new Set(todo.map((p) => (p.platform === "youtube" ? "youtube" : "meta")));
    for (const acct of needed) {
      try {
        await (acct === "youtube" ? youtube.whoAmI() : meta.whoAmI());
      } catch (e) {
        report(`:warning: ${acct === "youtube" ? "YouTube" : "Facebook/Instagram"} is not connected yet (${(e as Error).message.split("\n")[0]}).`);
        report("The posts stay approved. Finish the setup in docs/publishing.md, then run Actions > Publish: schedule (or `npm run publish:schedule -- " + queue.slug + "`).");
        return;
      }
    }
  }

  for (const p of todo) {
    try {
      filesOf(p).forEach((f) => ensureLocal(queue.slug, f));
    } catch (e) {
      report(`- :warning: **${p.id}** skipped: ${(e as Error).message}`);
      continue;
    }
    const errors = checks(p, queue);
    if (errors.length) {
      report(`- :warning: **${p.id}** skipped: ${errors.join("; ")}`);
      continue;
    }
    if (dryRun) {
      report(`- would ${p.platform === "instagram" ? "queue" : "schedule"} ${p.id} (${p.platform} ${p.kind}) for ${when(p.publishAt)}`);
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
        note(p, "queued: the runner publishes it at its time");
      }
      delete p.error;
      report(`- ${p.id}: ${p.status}, ${when(p.publishAt)}${p.remote?.url ? `: ${p.remote.url}` : ""}`);
      for (const m of p.manual ?? []) report(`  - by hand: ${m}`);
    } catch (e) {
      p.status = "failed";
      p.error = (e as Error).message;
      note(p, `failed: ${p.error}`);
      report(`- :x: **${p.id}** failed: ${p.error}`);
    }
    saveQueue(queue);
  }
};

// ---------------------------------------------------------------------------
// The runner (every 15 minutes on GitHub Actions)
// ---------------------------------------------------------------------------

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

const due = async () => {
  const lockDir = path.join(root, ".secrets");
  mkdirSync(lockDir, { recursive: true });
  const lock = path.join(lockDir, "due.lock");
  if (existsSync(lock) && Date.now() - statSync(lock).mtimeMs < 30 * 60_000) return console.log("another run is in progress");
  writeFileSync(lock, String(process.pid));
  try {
    const videos = readdirSync(path.join(root, "src", "videos")).filter((s) => existsSync(queuePath(s)));
    for (const slug of videos) {
      const queue = loadQueue(slug);
      const now = Date.now();
      for (const p of queue.posts) {
        if (Date.parse(p.publishAt) > now) continue;
        try {
          if (p.platform === "instagram" && p.status === "queued") {
            const late = Math.round((now - Date.parse(p.publishAt)) / 60_000);
            console.log(`${slug}/${p.id}: publishing Instagram Reel${late > 20 ? ` (${late} min late)` : ""}...`);
            filesOf(p).forEach((f) => ensureLocal(slug, f));
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
            note(p, `posted${late > 20 ? ` ${late} min late` : ""}: ${r.url ?? r.id}`);
          }
          if (p.status === "scheduled" && p.platform === "facebook" && p.remote?.id) {
            if (!(await meta.facebookIsLive(p.remote.id))) continue;
            p.status = "posted";
            note(p, "live on Facebook");
          }
          if (p.status === "scheduled" && p.platform === "youtube") {
            const locked = (p.manual ?? []).some((m) => m.includes("locked"));
            p.status = "posted";
            note(p, locked ? "publish time passed: it was locked private, check it is public in YouTube Studio" : "publish time passed (YouTube published it)");
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
      // Every post live (and every first comment made): the media release is no longer needed.
      const done = queue.posts.every((p) => p.status === "posted" && (!p.firstComment || p.platform === "youtube" || p.remote?.commentId));
      if (done && queue.posts.length > 0 && CI && deleteMedia(slug)) console.log(`${slug}: all posts live, deleted ${mediaTag(slug)}`);
    }
  } finally {
    rmSync(lock, { force: true });
  }
};

// ---------------------------------------------------------------------------
// Reminders and secrets
// ---------------------------------------------------------------------------

/** Daily: nudge the owner on posts pull requests that have waited more than two days. */
const remind = () => {
  const owner = process.env.GITHUB_REPOSITORY_OWNER ?? run("gh", ["repo", "view", "--json", "owner", "-q", ".owner.login"]);
  const prs = JSON.parse(run("gh", ["pr", "list", "--state", "open", "--json", "number,headRefName,createdAt"])) as { number: number; headRefName: string; createdAt: string }[];
  for (const pr of prs.filter((p) => p.headRefName.startsWith("posts/"))) {
    const days = (Date.now() - Date.parse(pr.createdAt)) / 86_400_000;
    if (days < 2) continue;
    const slug = pr.headRefName.slice("posts/".length);
    let first = "";
    try {
      run("git", ["fetch", "origin", pr.headRefName]);
      const q = JSON.parse(run("git", ["show", `origin/${pr.headRefName}:${path.relative(root, queuePath(slug)).replace(/\\/g, "/")}`])) as Queue;
      const next = q.posts.filter((p) => p.status === "proposed").sort(byTime)[0];
      if (next) {
        const hours = (Date.parse(next.publishAt) - Date.now()) / 3_600_000;
        first =
          hours < 1
            ? ` The first post was due ${fmtTime(next.publishAt, OWNER_TZ)}: ask Claude to move the dates, then merge.`
            : ` The first one goes out ${fmtTime(next.publishAt, OWNER_TZ)} (your time) once you merge.`;
      }
    } catch {
      /* the reminder still goes out without the date */
    }
    run("gh", ["pr", "comment", String(pr.number), "--body", `@${owner} reminder: these posts have waited ${Math.floor(days)} days for your approval. Merge this pull request to schedule them.${first}`]);
    console.log(`reminded on #${pr.number}`);
  }
};

/** Copies the local keys into the repo's Actions secrets (values go through stdin, never printed). */
const pushSecrets = () => {
  const yt = readSecret<{ refresh_token: string }>("youtube.json");
  const mt = readSecret<meta.MetaSecrets>("meta.json");
  const values: Record<string, string | undefined> = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    YOUTUBE_REFRESH_TOKEN: yt?.refresh_token,
    META_PAGE_ID: mt?.pageId,
    META_PAGE_TOKEN: mt?.pageToken,
    META_IG_USER_ID: mt?.igUserId,
  };
  for (const [name, value] of Object.entries(values)) {
    if (!value) {
      console.log(`skipped ${name}: not set up locally yet`);
      continue;
    }
    run("gh", ["secret", "set", name], { input: value });
    console.log(`set ${name}`);
  }
};

const main = async () => {
  if (existsSync(SUMMARY) && command !== "due") rmSync(SUMMARY);
  switch (command) {
    case "review":
      return review(loadQueue(slugArg()), args.includes("--full"));
    case "propose":
      return propose(slugArg());
    case "approve": {
      if (CI) throw new Error("On GitHub Actions, approval comes from merging the posts pull request.");
      const queue = loadQueue(slugArg());
      const ids = args.slice(1);
      const picked = ids.includes("all") ? queue.posts.filter((p) => p.status === "draft" || p.status === "proposed") : queue.posts.filter((p) => ids.includes(p.id));
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
    case "approve-merged":
      return approveMerged(slugArg());
    case "schedule":
      return schedule(loadQueue(slugArg()), args.includes("--dry-run"));
    case "due":
      return due();
    case "remind":
      return remind();
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
    case "secrets":
      return pushSecrets();
    default:
      throw new Error("Commands: review, propose, approve, schedule, due, remind, auth, check, secrets (see docs/publishing.md)");
  }
};

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
