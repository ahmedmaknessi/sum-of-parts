/**
 * Settings and secrets for publishing, read from `.env` at the repo root
 * (git-ignored) and `.secrets/` (git-ignored, written by the auth helpers).
 * See docs/publishing.md for how to get each value.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const envFile = path.join(root, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const SECRETS = path.join(root, ".secrets");

/**
 * The Google OAuth client as downloaded from Google Cloud ("Download JSON"),
 * saved as .secrets/google-client.json: fills GOOGLE_CLIENT_ID / _SECRET.
 */
const googleClient = path.join(SECRETS, "google-client.json");
if (existsSync(googleClient)) {
  const c = JSON.parse(readFileSync(googleClient, "utf8")) as { installed?: { client_id: string; client_secret: string } };
  process.env.GOOGLE_CLIENT_ID ??= c.installed?.client_id;
  process.env.GOOGLE_CLIENT_SECRET ??= c.installed?.client_secret;
}

export const need = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env (see docs/publishing.md)`);
  return v;
};

export const readSecret = <T>(name: string): T | null => {
  const f = path.join(SECRETS, name);
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as T) : null;
};

export const writeSecret = (name: string, value: unknown) => {
  mkdirSync(SECRETS, { recursive: true });
  writeFileSync(path.join(SECRETS, name), JSON.stringify(value, null, 2));
};

export const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v25.0";

/** fetch that throws with the response body on any non-2xx, so API errors are readable. */
export const call = async (url: string, init: RequestInit & { duplex?: "half" } = {}): Promise<Response> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init.method ?? "GET"} ${url.split("?")[0]} -> ${res.status}: ${body.slice(0, 800)}`);
  }
  return res;
};

export const callJson = async <T>(url: string, init: RequestInit & { duplex?: "half" } = {}): Promise<T> =>
  (await call(url, init)).json() as Promise<T>;
