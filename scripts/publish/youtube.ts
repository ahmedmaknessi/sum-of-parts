/**
 * YouTube Data API v3: OAuth (installed-app flow with a refresh token),
 * resumable upload with a scheduled publish time, custom thumbnail, captions.
 * Plain fetch, no SDK.
 *
 * Note: until the Google Cloud project passes YouTube's API audit, videos
 * uploaded through the API are locked to private. They still upload with
 * everything set; the owner then switches them to "Schedule" in YouTube Studio.
 */
import { createServer } from "node:http";
import { openAsBlob, statSync } from "node:fs";
import path from "node:path";
import { call, callJson, need, readSecret, writeSecret } from "./config";
import type { Post } from "./queue";

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.force-ssl"];
const TOKEN_FILE = "youtube.json";
const API = "https://www.googleapis.com/youtube/v3";
const UPLOAD = "https://www.googleapis.com/upload/youtube/v3";
/** Education. */
const CATEGORY_ID = "27";

type Tokens = { refresh_token: string; access_token?: string; expires_at?: number };

/** One-time sign-in in the browser; stores a refresh token in .secrets/youtube.json. */
export const authorize = async () => {
  const clientId = need("GOOGLE_CLIENT_ID");
  const clientSecret = need("GOOGLE_CLIENT_SECRET");
  const server = createServer();
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const redirect = `http://127.0.0.1:${port}`;
  const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
    });
  console.log(`Open this link, sign in with the channel's Google account and allow access:\n\n${url}\n`);
  const code = await new Promise<string>((resolve, reject) => {
    server.on("request", (req, res) => {
      const q = new URL(req.url ?? "/", redirect).searchParams;
      res.end(q.get("code") ? "Sum of Parts: YouTube access granted. You can close this tab." : "No code received.");
      if (q.get("code")) resolve(q.get("code")!);
      else reject(new Error(q.get("error") ?? "no code"));
    });
  });
  server.close();
  const tokens = await callJson<{ refresh_token?: string; access_token: string; expires_in: number }>("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect, grant_type: "authorization_code" }),
  });
  if (!tokens.refresh_token) throw new Error("Google returned no refresh token: remove the app's access at myaccount.google.com/permissions and run again.");
  writeSecret(TOKEN_FILE, { refresh_token: tokens.refresh_token });
  console.log("Saved .secrets/youtube.json");
};

const accessToken = async (): Promise<string> => {
  // On GitHub Actions the refresh token comes from the repository secrets.
  const fromEnv: Tokens | null = process.env.YOUTUBE_REFRESH_TOKEN ? { refresh_token: process.env.YOUTUBE_REFRESH_TOKEN } : null;
  const t = readSecret<Tokens>(TOKEN_FILE) ?? fromEnv;
  if (!t) throw new Error("Not signed in to YouTube: run npm run publish:auth -- youtube");
  if (t.access_token && t.expires_at && t.expires_at > Date.now() + 60_000) return t.access_token;
  const r = await callJson<{ access_token: string; expires_in: number }>("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: need("GOOGLE_CLIENT_ID"),
      client_secret: need("GOOGLE_CLIENT_SECRET"),
      refresh_token: t.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  writeSecret(TOKEN_FILE, { ...t, access_token: r.access_token, expires_at: Date.now() + r.expires_in * 1000 });
  return r.access_token;
};

const auth = async () => ({ Authorization: `Bearer ${await accessToken()}` });

/** The channel this account posts to (read-only, for publish:check). */
export const whoAmI = async () => {
  const r = await callJson<{ items: { id: string; snippet: { title: string } }[] }>(`${API}/channels?part=snippet&mine=true`, { headers: await auth() });
  const ch = r.items?.[0];
  return ch ? `${ch.snippet.title} (${ch.id})` : "no channel on this account";
};

/** Uploads the video private with publishAt (YouTube flips it to public at that time). Returns the video id. */
export const uploadScheduled = async (post: Post, root: string): Promise<{ id: string; url: string; locked: boolean }> => {
  const file = path.join(root, post.file);
  const size = statSync(file).size;
  const title = post.kind === "short" && !/#shorts/i.test(post.title ?? "") ? `${post.title} #shorts` : post.title!;
  const meta = {
    snippet: { title, description: post.text, tags: post.tags ?? [], categoryId: CATEGORY_ID, defaultLanguage: "en", defaultAudioLanguage: "en" },
    status: {
      privacyStatus: "private",
      publishAt: new Date(post.publishAt).toISOString(),
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: false,
      license: "youtube",
      embeddable: true,
    },
  };
  const start = await call(`${UPLOAD}/videos?uploadType=resumable&part=snippet,status`, {
    method: "POST",
    headers: { ...(await auth()), "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": String(size) },
    body: JSON.stringify(meta),
  });
  const location = start.headers.get("location");
  if (!location) throw new Error("YouTube gave no upload URL");
  const video = await callJson<{ id: string; status: { privacyStatus: string; publishAt?: string } }>(location, {
    method: "PUT",
    headers: { ...(await auth()), "Content-Type": "video/mp4", "Content-Length": String(size) },
    body: await openAsBlob(file),
  });
  // An unaudited API project gets its uploads locked private: publishAt is dropped.
  const locked = !video.status.publishAt;
  return { id: video.id, url: `https://youtu.be/${video.id}`, locked };
};

export const setThumbnail = async (videoId: string, image: string) => {
  const type = image.endsWith(".png") ? "image/png" : "image/jpeg";
  await call(`${UPLOAD}/thumbnails/set?videoId=${videoId}&uploadType=media`, {
    method: "POST",
    headers: { ...(await auth()), "Content-Type": type },
    body: await openAsBlob(image),
  });
};

export const uploadCaptions = async (videoId: string, srt: string) => {
  const boundary = `sop${Date.now()}`;
  const meta = JSON.stringify({ snippet: { videoId, language: "en", name: "English", isDraft: false } });
  const blob = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`,
    await openAsBlob(srt),
    `\r\n--${boundary}--`,
  ]);
  await call(`${UPLOAD}/captions?part=snippet&uploadType=multipart`, {
    method: "POST",
    headers: { ...(await auth()), "Content-Type": `multipart/related; boundary=${boundary}` },
    body: blob,
  });
};

type VideoStatus = { privacyStatus: string; publishAt?: string; [k: string]: unknown };

const getStatus = async (videoId: string): Promise<VideoStatus> => {
  const r = await callJson<{ items: { status: VideoStatus }[] }>(`${API}/videos?part=status&id=${videoId}`, { headers: await auth() });
  if (!r.items?.length) throw new Error(`YouTube video ${videoId} not found`);
  return r.items[0].status;
};

const putStatus = async (videoId: string, status: VideoStatus) => {
  // videos.update replaces the whole status part: send back every writable field.
  const { privacyStatus, publishAt, embeddable, license, publicStatsViewable, selfDeclaredMadeForKids, containsSyntheticMedia } = status;
  await call(`${API}/videos?part=status`, {
    method: "PUT",
    headers: { ...(await auth()), "Content-Type": "application/json" },
    body: JSON.stringify({ id: videoId, status: { privacyStatus, publishAt, embeddable, license, publicStatsViewable, selfDeclaredMadeForKids, containsSyntheticMedia } }),
  });
};

/** Moves a scheduled (private + publishAt) video to a new publish time. */
export const reschedule = async (videoId: string, publishAt: string) => {
  const status = await getStatus(videoId);
  if (status.privacyStatus !== "private") throw new Error(`${videoId} is already ${status.privacyStatus}: nothing to reschedule`);
  await putStatus(videoId, { ...status, privacyStatus: "private", publishAt: new Date(publishAt).toISOString() });
};

/** Removes a video's publish time: it stays private and never goes public on its own. */
export const unschedule = async (videoId: string) => {
  const status = await getStatus(videoId);
  await putStatus(videoId, { ...status, privacyStatus: "private", publishAt: undefined });
};
