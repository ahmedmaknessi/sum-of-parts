/**
 * Watching the posts after they are scheduled:
 * - dashboardData(): everything the dashboard shows (dashboard/index.html reads
 *   dashboard/data.json), with live stats and links.
 * - alerts(): one open GitHub issue per post that failed or is late
 *   (label "publishing-alert"), closed again once the post is fine.
 * - digest(): one GitHub issue a day listing the steps left by hand for posts
 *   that went live in the last 24 hours (label "publishing-todo").
 * Read-only towards the platforms; GitHub issues via the gh CLI (GH_TOKEN on Actions).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import * as meta from "./meta";
import { loadQueue, queuePath, type Post, type Queue } from "./queue";
import * as youtube from "./youtube";

const root = process.cwd();
const HOUR = 3_600_000;

const gh = (args: string[], input?: string) => {
  const r = spawnSync("gh", args, { encoding: "utf8", cwd: root, input });
  if (r.status !== 0) throw new Error(`gh ${args.slice(0, 2).join(" ")} failed: ${r.stderr || r.stdout}`);
  return r.stdout.trim();
};

export const allQueues = (): Queue[] =>
  readdirSync(path.join(root, "src", "videos"))
    .filter((s) => existsSync(queuePath(s)))
    .map((s) => loadQueue(s));

const isLive = (p: Post, now = Date.now()) => p.status === "posted" || (p.status === "scheduled" && Date.parse(p.publishAt) <= now);

/** Where to watch a post, and where to edit it (for the steps left by hand). */
export const links = (p: Post) => {
  const id = p.remote?.id;
  if (p.platform === "youtube" && id) {
    return { url: p.kind === "short" ? `https://youtube.com/shorts/${id}` : `https://youtu.be/${id}`, edit: `https://studio.youtube.com/video/${id}/edit` };
  }
  return { url: p.remote?.url, edit: p.remote?.url };
};

type Problem = { key: string; slug: string; post: Post; what: string; fix: string };

/** Posts that need the owner: failed, late, or stuck. */
export const problems = (queues: Queue[], now = Date.now()): Problem[] => {
  const out: Problem[] = [];
  for (const q of queues) {
    for (const p of q.posts) {
      const at = Date.parse(p.publishAt);
      const key = `${q.slug} / ${p.id}`;
      if (p.status === "failed") {
        out.push({ key, slug: q.slug, post: p, what: `failed: ${p.error ?? "no reason recorded"}`, fix: "Tell Claude: it reads the error, fixes it and re-proposes or retimes the post." });
      } else if (p.status === "queued" && now - at > HOUR) {
        out.push({ key, slug: q.slug, post: p, what: `Instagram post is ${Math.round((now - at) / 60000)} minutes overdue`, fix: "Check the Actions tab for a failed \"Publish: due posts\" run, or tell Claude." });
      } else if (p.status === "approved" && now > at) {
        out.push({ key, slug: q.slug, post: p, what: "its time passed before it could be scheduled", fix: "Tell Claude to move it (publish:retime) to the next free 19:00 New York slot." });
      } else if (p.status === "approved" && p.retryAfter && now - Date.parse(p.retryAfter) > 2 * HOUR) {
        out.push({ key, slug: q.slug, post: p, what: `still not scheduled after its retry time (${p.retryAfter})`, fix: "Check the Actions tab, or tell Claude." });
      }
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// Dashboard data
// ---------------------------------------------------------------------------

export const dashboardData = async () => {
  const queues = allQueues();
  const now = Date.now();

  // Live stats, best effort: a platform that fails just shows no numbers.
  const ytIds = queues.flatMap((q) => q.posts.filter((p) => p.platform === "youtube" && p.remote?.id).map((p) => p.remote!.id!));
  let yt: Awaited<ReturnType<typeof youtube.videoStats>> = {};
  const warnings: string[] = [];
  try {
    yt = await youtube.videoStats(ytIds);
  } catch (e) {
    warnings.push(`YouTube stats unavailable: ${(e as Error).message.split("\n")[0].slice(0, 160)}`);
  }
  const metaStats = new Map<string, { likes?: number; comments?: number; url?: string }>();
  for (const q of queues) {
    for (const p of q.posts.filter((x) => x.platform !== "youtube" && x.status === "posted" && x.remote?.id)) {
      try {
        metaStats.set(p.remote!.id!, p.platform === "instagram" ? await meta.instagramStats(p.remote!.id!) : await meta.facebookStats(p.remote!.id!));
      } catch {
        /* no numbers for this one */
      }
    }
  }

  let pending: { number: number; title: string; url: string }[] = [];
  try {
    pending = (JSON.parse(gh(["pr", "list", "--state", "open", "--json", "number,title,url,headRefName"])) as { number: number; title: string; url: string; headRefName: string }[])
      .filter((p) => p.headRefName.startsWith("posts/"))
      .map(({ number, title, url }) => ({ number, title, url }));
  } catch (e) {
    warnings.push(`Pull requests unavailable: ${(e as Error).message.slice(0, 120)}`);
  }
  let todoIssue: string | undefined;
  try {
    todoIssue = JSON.parse(gh(["issue", "list", "--label", "publishing-todo", "--state", "open", "--limit", "1", "--json", "url"]))[0]?.url;
  } catch {
    /* none */
  }

  const videos = queues.map((q) => {
    const main = q.posts.find((p) => p.id === "yt-main");
    return {
      slug: q.slug,
      title: main?.title ?? q.slug,
      posts: q.posts
        .filter((p) => p.status !== "cancelled")
        .map((p) => {
          const l = links(p);
          const s = p.platform === "youtube" ? yt[p.remote?.id ?? ""] : metaStats.get(p.remote?.id ?? "");
          return {
            id: p.id,
            platform: p.platform,
            kind: p.kind,
            publishAt: p.publishAt,
            status: isLive(p, now) && p.status === "scheduled" ? "live" : p.status === "posted" ? "live" : p.status,
            title: p.title ?? p.text.split("\n")[0],
            url: (s as { url?: string } | undefined)?.url ?? l.url,
            edit: l.edit,
            stats: s ? { views: (s as { views?: number }).views, likes: s.likes, comments: s.comments } : undefined,
            manual: isLive(p, now) ? (p.manual ?? []).filter((m) => !m.includes("locked")) : [],
            error: p.status === "failed" ? p.error : undefined,
          };
        }),
    };
  });

  return {
    generatedAt: new Date(now).toISOString(),
    timeZone: process.env.PUBLISH_TIMEZONE ?? "Africa/Tunis",
    pending,
    problems: problems(queues, now).map((x) => ({ key: x.key, what: x.what, fix: x.fix })),
    todoIssue,
    warnings,
    videos,
  };
};

// ---------------------------------------------------------------------------
// GitHub issues: alerts and the daily to-do digest
// ---------------------------------------------------------------------------

const owner = () => process.env.GITHUB_REPOSITORY_OWNER ?? gh(["repo", "view", "--json", "owner", "-q", ".owner.login"]);

const ensureLabel = (name: string, color: string, description: string) => {
  try {
    gh(["label", "create", name, "--color", color, "--description", description, "--force"]);
  } catch {
    /* exists */
  }
};

const ALERT_PREFIX = "Publishing problem: ";

export const alerts = () => {
  ensureLabel("publishing-alert", "E9684B", "A post failed or is late (opened and closed by the publisher)");
  const found = problems(allQueues());
  const open = JSON.parse(gh(["issue", "list", "--label", "publishing-alert", "--state", "open", "--limit", "100", "--json", "number,title"])) as { number: number; title: string }[];
  const openKeys = new Map(open.map((i) => [i.title.slice(ALERT_PREFIX.length), i.number]));
  for (const pr of found) {
    if (openKeys.has(pr.key)) continue;
    const l = links(pr.post);
    const body = [
      `@${owner()} **${pr.post.platform} ${pr.post.kind}**, due ${pr.post.publishAt}: ${pr.what}`,
      "",
      `**What to do:** ${pr.fix}`,
      l.url ? `\nLink: ${l.url}` : "",
      "",
      "_This issue closes itself once the post is fine._",
    ].join("\n");
    gh(["issue", "create", "--title", `${ALERT_PREFIX}${pr.key}`, "--label", "publishing-alert", "--body-file", "-"], body);
    console.log(`alert opened: ${pr.key}`);
  }
  for (const [key, number] of openKeys) {
    if (found.some((p) => p.key === key)) continue;
    gh(["issue", "close", String(number), "--comment", "Resolved: the post is fine now."]);
    console.log(`alert closed: ${key}`);
  }
};

export const digest = () => {
  ensureLabel("publishing-todo", "F2A93B", "Steps left by hand for posts that just went live");
  const now = Date.now();
  const day = new Date(now).toLocaleDateString("en-GB", { timeZone: "America/New_York", day: "2-digit", month: "short", year: "numeric" });
  const title = `To do by hand: ${day}`;
  const existing = JSON.parse(gh(["issue", "list", "--label", "publishing-todo", "--state", "all", "--search", `"${title}" in:title`, "--json", "number"])) as unknown[];
  if (existing.length) return console.log(`digest already exists for ${day}`);
  const items: string[] = [];
  for (const q of allQueues()) {
    for (const p of q.posts) {
      const at = Date.parse(p.publishAt);
      if (!isLive(p, now) || now - at > 24 * HOUR) continue;
      const l = links(p);
      for (const m of (p.manual ?? []).filter((x) => !x.includes("locked"))) {
        items.push(`- [ ] **${q.slug} / ${p.id}** (${p.platform}): ${m}${l.edit ? ` → [open](${l.edit})` : ""}`);
      }
    }
  }
  if (items.length === 0) return console.log("nothing to do by hand today");
  const body = [`@${owner()} these posts went live in the last 24 hours and need a quick finish by hand:`, "", ...items, "", "Tick each box when done, then close the issue."].join("\n");
  gh(["issue", "create", "--title", title, "--label", "publishing-todo", "--body-file", "-"], body);
  console.log(`digest opened: ${items.length} items`);
};
