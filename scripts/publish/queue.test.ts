import assert from "node:assert/strict";
import { test } from "node:test";
import { approve, contentHash, isApproved, resolveLinks, validate, type Post } from "./queue";

const NOW = new Date("2026-10-13T12:00:00Z");
const dur = (s: number) => () => s;

const post = (over: Partial<Post> = {}): Post => ({
  id: "yt-main",
  platform: "youtube",
  kind: "video",
  file: "out/x.mp4",
  publishAt: "2026-10-15T14:00:00-04:00",
  title: "Why Can't Countries Just Print More Money?",
  text: "Description",
  status: "draft",
  ...over,
});

test("approval is tied to the content", () => {
  const p = post();
  approve(p, NOW);
  assert.ok(isApproved(p));
  const edited: Post = { ...p, text: "Changed" };
  assert.equal(isApproved(edited), false);
  // Bookkeeping fields don't void an approval.
  const logged: Post = { ...p, log: ["x"], error: "y" };
  assert.equal(contentHash(logged), contentHash(p));
});

test("only drafts can be approved", () => {
  assert.throws(() => approve(post({ status: "scheduled" }), NOW));
});

test("a valid YouTube video passes", () => {
  assert.deepEqual(validate(post(), dur(324), NOW), []);
});

test("YouTube limits", () => {
  assert.ok(validate(post({ title: "x".repeat(101) }), dur(10), NOW).some((e) => e.includes("title")));
  assert.ok(validate(post({ kind: "short" }), dur(200), NOW).some((e) => e.includes("Short")));
  assert.ok(validate(post({ publishAt: "2026-10-13T12:05:00Z" }), dur(10), NOW).some((e) => e.includes("20 minutes")));
  assert.ok(validate(post({ publishAt: "2026-10-15T14:00:00" }), dur(10), NOW).some((e) => e.includes("offset")));
  assert.ok(validate(post({ text: "a <b>" }), dur(10), NOW).some((e) => e.includes("<")));
});

test("Facebook Reels are 3 to 90 s; longer clips post as videos", () => {
  const fb = post({ id: "fb", platform: "facebook", kind: "reel", title: undefined });
  assert.ok(validate(fb, dur(97), NOW).some((e) => e.includes('kind "video"')));
  assert.deepEqual(validate({ ...fb, kind: "video" }, dur(97), NOW), []);
  assert.ok(validate({ ...fb, publishAt: "2026-12-01T12:00:00Z" }, dur(60), NOW).some((e) => e.includes("28 days")));
});

test("Instagram caption limits", () => {
  const ig = post({ id: "ig", platform: "instagram", kind: "reel", title: undefined });
  assert.deepEqual(validate(ig, dur(97), NOW), []);
  const tags = Array.from({ length: 31 }, (_, i) => `#t${i}`).join(" ");
  assert.ok(validate({ ...ig, text: tags }, dur(97), NOW).some((e) => e.includes("hashtags")));
});

test("{{youtube:id}} links resolve once the target is uploaded", () => {
  const main = post();
  const fb = post({ id: "fb", platform: "facebook", kind: "video", text: "Watch: {{youtube:yt-main}}" });
  const queue = { slug: "x", posts: [main, fb] };
  assert.throws(() => resolveLinks(queue, fb.text), /not uploaded/);
  main.remote = { id: "abc", url: "https://youtu.be/abc" };
  assert.equal(resolveLinks(queue, fb.text), "Watch: https://youtu.be/abc");
  assert.throws(() => resolveLinks(queue, "{{youtube:nope}}"), /no post/);
});
