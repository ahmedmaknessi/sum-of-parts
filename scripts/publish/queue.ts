/**
 * The posting queue: one `posts.json` per video (src/videos/<slug>/posts.json).
 *
 * Every post goes draft -> proposed -> approved -> scheduled / queued -> posted.
 * - draft: written by Claude (or by hand), not yet sent for approval.
 * - proposed: in a "posts/<slug>" pull request, waiting for the owner. Merging
 *   that pull request is the approval (.github/workflows/publish-approve.yml).
 * - approved: the owner validated it. The approval is tied to a fingerprint of
 *   the post's content: if anything that would be published changes, the post
 *   counts as a draft again and nothing schedules it.
 * - scheduled: handed to the platform's own scheduler (YouTube, Facebook).
 * - queued: Instagram has no API scheduling: the runner (`publish:due`, every
 *   15 minutes on GitHub Actions) publishes it when its time comes.
 * - posted / failed: done, or stopped with the error kept on the post.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type Platform = "youtube" | "instagram" | "facebook";
/** youtube: video | short. instagram: reel. facebook: reel (3 to 90 s) | video (any length). */
export type Kind = "video" | "short" | "reel";
export type Status = "draft" | "proposed" | "approved" | "scheduled" | "queued" | "posted" | "failed";

export type Post = {
  /** Short, unique within the video: "yt-main", "ig-short-02"... */
  readonly id: string;
  readonly platform: Platform;
  readonly kind: Kind;
  /** Video file, relative to the repo root (usually under out/). */
  readonly file: string;
  /** When it goes live: ISO 8601 with an explicit offset, e.g. 2026-10-15T14:00:00-04:00. */
  readonly publishAt: string;
  /** YouTube title / Facebook video title. */
  readonly title?: string;
  /** YouTube description, Instagram and Facebook caption. */
  readonly text: string;
  /** YouTube only. */
  readonly tags?: readonly string[];
  /** YouTube main video: custom thumbnail (PNG/JPG under 2 MB). */
  readonly thumbnail?: string;
  /** YouTube main video: English captions (.srt). */
  readonly captions?: string;
  /** Instagram: cover image (local file). The runner hosts it at a public URL when it posts. */
  readonly cover?: string;
  /** Instagram: a public URL of the cover image, if it is already hosted. */
  readonly coverUrl?: string;
  /** Instagram: cover frame (ms into the video) when there is no coverUrl. */
  readonly thumbOffsetMs?: number;
  /**
   * Comment posted right after the post goes live (Facebook link comment).
   * In text and firstComment, {{youtube:<post id>}} becomes that post's YouTube link.
   */
  readonly firstComment?: string;
  /** Things the API cannot do, left for the owner to click (shown in the review). */
  manual?: string[];

  status: Status;
  /** Fingerprint of the content at approval time. */
  approvedHash?: string;
  approvedAt?: string;
  /** What the platform returned: ids and links. */
  remote?: { id?: string; url?: string; containerId?: string; commentId?: string };
  error?: string;
  log?: string[];
};

export type Queue = { readonly slug: string; readonly posts: Post[] };

/** The fields that end up in public: changing any of them voids an approval. */
const PUBLISHED_FIELDS = [
  "platform",
  "kind",
  "file",
  "publishAt",
  "title",
  "text",
  "tags",
  "thumbnail",
  "captions",
  "cover",
  "coverUrl",
  "thumbOffsetMs",
  "firstComment",
] as const;

export const contentHash = (post: Post): string => {
  const content = Object.fromEntries(PUBLISHED_FIELDS.map((k) => [k, post[k] ?? null]));
  return createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 16);
};

/** Approved and unchanged since: the only state the scheduler acts on. */
export const isApproved = (post: Post): boolean =>
  post.status === "approved" && post.approvedHash !== undefined && post.approvedHash === contentHash(post);

export const queuePath = (slug: string) => path.join(process.cwd(), "src", "videos", slug, "posts.json");

export const loadQueue = (slug: string): Queue => {
  const file = queuePath(slug);
  if (!existsSync(file)) throw new Error(`No posting queue for ${slug}: ${file}`);
  const queue = JSON.parse(readFileSync(file, "utf8")) as Queue;
  // An approved post whose content changed is a draft again.
  for (const p of queue.posts) {
    if (p.status === "approved" && !isApproved(p)) {
      p.status = "draft";
      delete p.approvedHash;
      delete p.approvedAt;
      note(p, "content changed after approval: back to draft");
    }
  }
  return queue;
};

export const saveQueue = (queue: Queue) => {
  writeFileSync(queuePath(queue.slug), JSON.stringify(queue, null, 2) + "\n");
};

export const note = (post: Post, message: string) => {
  post.log = [...(post.log ?? []), `${new Date().toISOString()} ${message}`];
};

export const approve = (post: Post, now = new Date()) => {
  if (post.status !== "draft" && post.status !== "proposed" && post.status !== "approved") {
    throw new Error(`${post.id} is ${post.status}: only drafts and proposed posts can be approved`);
  }
  post.status = "approved";
  post.approvedHash = contentHash(post);
  post.approvedAt = now.toISOString();
  note(post, "approved");
};

// ---------------------------------------------------------------------------
// Validation: platform limits, checked before approval and before scheduling
// ---------------------------------------------------------------------------

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Seconds of video, read with ffprobe (injected so tests need no files). */
export type DurationOf = (file: string) => number;

export const LIMITS = {
  youtubeTitle: 100,
  youtubeDescription: 5000,
  youtubeTags: 500,
  shortMaxSec: 180,
  instagramCaption: 2200,
  instagramHashtags: 30,
  instagramReelMaxSec: 900,
  facebookReelMinSec: 3,
  facebookReelMaxSec: 90,
  /** Facebook needs scheduled posts at least 10 minutes ahead; we keep a margin. */
  facebookMinLeadMs: 20 * MINUTE,
  /** Kept well inside Facebook's scheduling window. */
  facebookMaxLeadMs: 28 * DAY,
  youtubeMinLeadMs: 20 * MINUTE,
} as const;

export const validate = (post: Post, durationOf: DurationOf, now = new Date()): string[] => {
  const errors: string[] = [];
  const at = Date.parse(post.publishAt);
  if (!/([+-]\d\d:\d\d|Z)$/.test(post.publishAt) || Number.isNaN(at)) {
    errors.push(`publishAt must be ISO 8601 with an offset (got "${post.publishAt}")`);
  }
  const lead = at - now.getTime();
  const seconds = durationOf(post.file);

  if (post.platform === "youtube") {
    if (post.kind !== "video" && post.kind !== "short") errors.push(`YouTube kind must be video or short`);
    if (!post.title) errors.push("YouTube needs a title");
    if (post.title && post.title.length > LIMITS.youtubeTitle) errors.push(`title is ${post.title.length} characters (max ${LIMITS.youtubeTitle})`);
    if (/[<>]/.test(post.title ?? "") || /[<>]/.test(post.text)) errors.push("YouTube rejects < and > in titles and descriptions");
    if (post.text.length > LIMITS.youtubeDescription) errors.push(`description is ${post.text.length} characters (max ${LIMITS.youtubeDescription})`);
    const tagChars = (post.tags ?? []).reduce((s, t) => s + t.length + (t.includes(" ") ? 2 : 0), 0) + Math.max(0, (post.tags ?? []).length - 1);
    if (tagChars > LIMITS.youtubeTags) errors.push(`tags use ${tagChars} characters (max ${LIMITS.youtubeTags})`);
    if (post.kind === "short" && seconds > LIMITS.shortMaxSec) errors.push(`a Short must be ${LIMITS.shortMaxSec} s or less (file is ${seconds.toFixed(1)} s)`);
    if (lead < LIMITS.youtubeMinLeadMs) errors.push("publishAt must be at least 20 minutes in the future");
  }

  if (post.platform === "instagram") {
    if (post.kind !== "reel") errors.push("Instagram kind must be reel");
    if (post.text.length > LIMITS.instagramCaption) errors.push(`caption is ${post.text.length} characters (max ${LIMITS.instagramCaption})`);
    const tags = (post.text.match(/#\w+/g) ?? []).length;
    if (tags > LIMITS.instagramHashtags) errors.push(`caption has ${tags} hashtags (max ${LIMITS.instagramHashtags})`);
    if (seconds > LIMITS.instagramReelMaxSec) errors.push(`Reel is ${seconds.toFixed(1)} s (max ${LIMITS.instagramReelMaxSec} s)`);
    if (lead < 0) errors.push("publishAt is in the past");
  }

  if (post.platform === "facebook") {
    if (post.kind !== "reel" && post.kind !== "video") errors.push("Facebook kind must be reel or video");
    if (post.kind === "reel" && (seconds < LIMITS.facebookReelMinSec || seconds > LIMITS.facebookReelMaxSec)) {
      errors.push(`a Facebook Reel must be ${LIMITS.facebookReelMinSec} to ${LIMITS.facebookReelMaxSec} s (file is ${seconds.toFixed(1)} s): use kind "video"`);
    }
    if (lead < LIMITS.facebookMinLeadMs) errors.push("publishAt must be at least 20 minutes in the future");
    if (lead > LIMITS.facebookMaxLeadMs) errors.push("publishAt must be within 28 days");
  }
  return errors;
};

// ---------------------------------------------------------------------------
// Links between posts
// ---------------------------------------------------------------------------

const LINK = /\{\{youtube:([\w-]+)\}\}/g;

/** Replaces {{youtube:<id>}} with that post's YouTube link; throws if it isn't uploaded yet. */
export const resolveLinks = (queue: Queue, text: string): string =>
  text.replace(LINK, (_, id: string) => {
    const target = queue.posts.find((p) => p.id === id);
    if (!target) throw new Error(`{{youtube:${id}}}: no post with that id`);
    if (!target.remote?.url) throw new Error(`{{youtube:${id}}}: ${id} is not uploaded yet, schedule it first`);
    return target.remote.url;
  });

export const linkTargets = (text: string): string[] => [...text.matchAll(LINK)].map((m) => m[1]);
