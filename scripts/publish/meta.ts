/**
 * Meta Graph API: Facebook Page videos and Reels (natively scheduled), and
 * Instagram Reels (published now: Instagram's API has no scheduling, so the
 * local runner calls publishInstagramReel at the post's time). Plain fetch.
 */
import { openAsBlob, statSync } from "node:fs";
import path from "node:path";
import { call, callJson, META_GRAPH_VERSION, need, readSecret, writeSecret } from "./config";
import type { Post } from "./queue";

const GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const GRAPH_VIDEO = `https://graph-video.facebook.com/${META_GRAPH_VERSION}`;
const TOKEN_FILE = "meta.json";

export type MetaSecrets = { pageId: string; pageName: string; pageToken: string; igUserId?: string; igUsername?: string };

const secrets = (): MetaSecrets => {
  const s = readSecret<MetaSecrets>(TOKEN_FILE);
  if (s) return s;
  // On GitHub Actions the Page token comes from the repository secrets.
  const { META_PAGE_ID, META_PAGE_TOKEN, META_IG_USER_ID } = process.env;
  if (META_PAGE_ID && META_PAGE_TOKEN) return { pageId: META_PAGE_ID, pageName: "", pageToken: META_PAGE_TOKEN, igUserId: META_IG_USER_ID || undefined };
  throw new Error("Not connected to Meta: run npm run publish:auth -- meta <user-token>");
};

/**
 * Turns a short-lived user token (from the Graph API Explorer) into a Page
 * token that does not expire, and finds the Page's Instagram account.
 */
export const authorize = async (userToken: string) => {
  const long = await callJson<{ access_token: string }>(
    `${GRAPH}/oauth/access_token?` +
      new URLSearchParams({ grant_type: "fb_exchange_token", client_id: need("META_APP_ID"), client_secret: need("META_APP_SECRET"), fb_exchange_token: userToken }),
  );
  const pages = await callJson<{ data: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[] }>(
    `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${long.access_token}`,
  );
  const byId = process.env.META_PAGE_ID;
  const byName = process.env.META_PAGE_NAME?.trim().toLowerCase();
  const page = byId
    ? pages.data.find((p) => p.id === byId)
    : byName
      ? pages.data.find((p) => p.name.trim().toLowerCase() === byName)
      : pages.data.length === 1
        ? pages.data[0]
        : undefined;
  if (!page) {
    throw new Error(`Pick the Page: set META_PAGE_NAME (or META_PAGE_ID) in .env to one of: ${pages.data.map((p) => `${p.name} (${p.id})`).join(", ") || "none found: did you allow the Page when generating the token?"}`);
  }
  writeSecret(TOKEN_FILE, {
    pageId: page.id,
    pageName: page.name,
    pageToken: page.access_token,
    igUserId: page.instagram_business_account?.id,
    igUsername: page.instagram_business_account?.username,
  } satisfies MetaSecrets);
  console.log(`Saved .secrets/meta.json: Page "${page.name}"${page.instagram_business_account ? `, Instagram @${page.instagram_business_account.username}` : ", NO Instagram account linked"}`);
};

export const whoAmI = async () => {
  const s = secrets();
  const page = await callJson<{ name: string }>(`${GRAPH}/${s.pageId}?fields=name&access_token=${s.pageToken}`);
  let ig = "no Instagram account linked";
  if (s.igUserId) {
    const u = await callJson<{ username: string }>(`${GRAPH}/${s.igUserId}?fields=username&access_token=${s.pageToken}`);
    ig = `Instagram @${u.username}`;
  }
  return `Facebook Page "${page.name}", ${ig}`;
};

const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000);

/** A Page video (any length) scheduled with Facebook's own scheduler. */
export const scheduleFacebookVideo = async (post: Post, root: string) => {
  const s = secrets();
  const file = path.join(root, post.file);
  const form = new FormData();
  form.set("access_token", s.pageToken);
  form.set("title", post.title ?? "");
  form.set("description", post.text);
  form.set("published", "false");
  form.set("scheduled_publish_time", String(unix(post.publishAt)));
  form.set("source", await openAsBlob(file, { type: "video/mp4" }), path.basename(file));
  const r = await callJson<{ id: string }>(`${GRAPH_VIDEO}/${s.pageId}/videos`, { method: "POST", body: form });
  return { id: r.id, url: `https://www.facebook.com/${s.pageId}/videos/${r.id}` };
};

/** A Page Reel (3 to 90 s) scheduled with Facebook's own scheduler. */
export const scheduleFacebookReel = async (post: Post, root: string) => {
  const s = secrets();
  const file = path.join(root, post.file);
  const size = statSync(file).size;
  const start = await callJson<{ video_id: string; upload_url: string }>(`${GRAPH}/${s.pageId}/video_reels`, {
    method: "POST",
    body: new URLSearchParams({ upload_phase: "start", access_token: s.pageToken }),
  });
  await call(start.upload_url, {
    method: "POST",
    headers: { Authorization: `OAuth ${s.pageToken}`, offset: "0", file_size: String(size) },
    body: await openAsBlob(file),
  });
  await call(`${GRAPH}/${s.pageId}/video_reels`, {
    method: "POST",
    body: new URLSearchParams({
      upload_phase: "finish",
      video_id: start.video_id,
      video_state: "SCHEDULED",
      scheduled_publish_time: String(unix(post.publishAt)),
      description: post.text,
      access_token: s.pageToken,
    }),
  });
  return { id: start.video_id, url: `https://www.facebook.com/reel/${start.video_id}` };
};

/** Comment on a published Facebook video or Instagram media (the "first comment" with the link). */
export const comment = async (objectId: string, message: string) => {
  const s = secrets();
  const r = await callJson<{ id: string }>(`${GRAPH}/${objectId}/comments`, {
    method: "POST",
    body: new URLSearchParams({ message, access_token: s.pageToken }),
  });
  return r.id;
};

/** True once Facebook has made the scheduled video public. */
export const facebookIsLive = async (videoId: string) => {
  const s = secrets();
  const r = await callJson<{ published?: boolean }>(`${GRAPH}/${videoId}?fields=published,status&access_token=${s.pageToken}`);
  return r.published === true;
};

/** Uploads and publishes an Instagram Reel now. Takes a minute or two while Instagram processes the video. */
export const publishInstagramReel = async (post: Post, root: string, log: (m: string) => void) => {
  const s = secrets();
  if (!s.igUserId) throw new Error("No Instagram professional account is linked to the Facebook Page");
  const file = path.join(root, post.file);
  const size = statSync(file).size;
  const params: Record<string, string> = {
    media_type: "REELS",
    upload_type: "resumable",
    caption: post.text,
    share_to_feed: "true",
    access_token: s.pageToken,
  };
  if (post.coverUrl) params.cover_url = post.coverUrl;
  else if (post.thumbOffsetMs !== undefined) params.thumb_offset = String(post.thumbOffsetMs);
  const container = await callJson<{ id: string; uri: string }>(`${GRAPH}/${s.igUserId}/media`, { method: "POST", body: new URLSearchParams(params) });
  log(`container ${container.id}`);
  await call(container.uri, {
    method: "POST",
    headers: { Authorization: `OAuth ${s.pageToken}`, offset: "0", file_size: String(size) },
    body: await openAsBlob(file),
  });
  // Wait for Instagram to process the upload (up to ~10 minutes).
  for (let i = 0; i < 60; i++) {
    const st = await callJson<{ status_code: string; status?: string }>(`${GRAPH}/${container.id}?fields=status_code,status&access_token=${s.pageToken}`);
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new Error(`Instagram processing ${st.status_code}: ${st.status ?? ""}`);
    if (i === 59) throw new Error("Instagram is still processing after 10 minutes");
    await new Promise((r) => setTimeout(r, 10_000));
  }
  const published = await callJson<{ id: string }>(`${GRAPH}/${s.igUserId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: container.id, access_token: s.pageToken }),
  });
  const media = await callJson<{ permalink?: string }>(`${GRAPH}/${published.id}?fields=permalink&access_token=${s.pageToken}`);
  return { id: published.id, url: media.permalink, containerId: container.id };
};
