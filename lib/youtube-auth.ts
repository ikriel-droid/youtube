import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { google } from "googleapis";

const dataDir = path.join(process.cwd(), "data");
const tokenFile = path.join(dataDir, "youtube-oauth.json");
const stateFile = path.join(dataDir, "youtube-oauth-state.json");
const uploadHistoryFile = path.join(dataDir, "youtube-upload-history.json");
export const YOUTUBE_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/yt-analytics.readonly";
export const YOUTUBE_METADATA_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";
export const DEFAULT_YOUTUBE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  YOUTUBE_METADATA_SCOPE,
  YOUTUBE_ANALYTICS_SCOPE
] as const;

export interface YouTubeTokenStore {
  tokens: Record<string, unknown>;
  connectedAt?: string;
  channelId?: string;
  channelTitle?: string;
  lastUpload?: {
    videoId: string;
    title: string;
    uploadedAt: string;
    privacyStatus: string;
  };
}

export function getYouTubeOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const baseUrl = (process.env.LOCALTUBE_BASE_URL?.trim() || "http://127.0.0.1:3000").replace(/\/$/, "");
  const redirectUri =
    process.env.YOUTUBE_OAUTH_REDIRECT_URI?.trim() || `${baseUrl}/api/youtube/oauth/callback`;

  return {
    clientId,
    clientSecret,
    baseUrl,
    redirectUri,
    configured: clientId.length > 0 && clientSecret.length > 0
  };
}

export function createOAuthClient() {
  const config = getYouTubeOAuthConfig();
  if (!config.configured) {
    throw new Error("Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

export async function createAuthUrl() {
  const oauth2Client = createOAuthClient();
  const state = crypto.randomBytes(24).toString("hex");
  await writeJson(stateFile, {
    state,
    createdAt: new Date().toISOString()
  });

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...DEFAULT_YOUTUBE_OAUTH_SCOPES],
    state
  });

  return url;
}

export async function exchangeCodeForToken(code: string, state?: string) {
  const oauth2Client = createOAuthClient();
  await validateState(state);

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client
  });
  const channelResponse = await youtube.channels.list({
    part: ["snippet"],
    mine: true
  });

  const channel = channelResponse.data.items?.[0];
  const stored = await readTokenStore();
  const nextStore: YouTubeTokenStore = {
    ...stored,
    tokens: sanitizeTokens(tokens as Record<string, unknown>),
    connectedAt: new Date().toISOString(),
    channelId: channel?.id ?? stored?.channelId,
    channelTitle: channel?.snippet?.title ?? stored?.channelTitle
  };

  await writeJson(tokenFile, nextStore);
  return nextStore;
}

export async function getAuthorizedOAuthClient() {
  const oauth2Client = createOAuthClient();
  const tokenStore = await readTokenStore();
  if (!tokenStore?.tokens) {
    return null;
  }

  oauth2Client.setCredentials(tokenStore.tokens as Record<string, unknown>);
  return oauth2Client;
}

export async function getYouTubeStatus() {
  const config = getYouTubeOAuthConfig();
  const tokenStore = await readTokenStore();
  const grantedScopes = parseGrantedScopes(tokenStore?.tokens.scope);
  return {
    configured: config.configured,
    connected: Boolean(tokenStore?.tokens),
    grantedScopes,
    analyticsScopeGranted: grantedScopes.includes(YOUTUBE_ANALYTICS_SCOPE),
    redirectUri: config.redirectUri,
    channelId: tokenStore?.channelId ?? null,
    channelTitle: tokenStore?.channelTitle ?? null,
    connectedAt: tokenStore?.connectedAt ?? null,
    lastUpload: tokenStore?.lastUpload ?? null
  };
}

export async function recordLastUpload(input: {
  videoId: string;
  title: string;
  privacyStatus: string;
}) {
  const store = (await readTokenStore()) ?? { tokens: {} };
  const nextStore: YouTubeTokenStore = {
    ...store,
    lastUpload: {
      ...input,
      uploadedAt: new Date().toISOString()
    }
  };
  await writeJson(tokenFile, nextStore);

  const existingHistory = await readJson<Array<Record<string, unknown>>>(uploadHistoryFile, []);
  existingHistory.unshift({
    ...nextStore.lastUpload,
    channelTitle: nextStore.channelTitle ?? null
  });
  await writeJson(uploadHistoryFile, existingHistory.slice(0, 20));

  return nextStore.lastUpload;
}

export async function readUploadHistory() {
  return readJson<Array<Record<string, unknown>>>(uploadHistoryFile, []);
}

export async function syncStoredUploadMetadata(input: {
  videoId: string;
  title: string;
  privacyStatus?: string;
}) {
  const store = await readTokenStore();
  if (store?.lastUpload?.videoId === input.videoId) {
    store.lastUpload = {
      ...store.lastUpload,
      title: input.title,
      privacyStatus: input.privacyStatus ?? store.lastUpload.privacyStatus
    };
    await writeJson(tokenFile, store);
  }

  const history = await readJson<Array<Record<string, unknown>>>(uploadHistoryFile, []);
  let touched = false;
  const nextHistory = history.map((item) => {
    if (item.videoId !== input.videoId) {
      return item;
    }

    touched = true;
    return {
      ...item,
      title: input.title,
      privacyStatus: input.privacyStatus ?? item.privacyStatus
    };
  });

  if (touched) {
    await writeJson(uploadHistoryFile, nextHistory);
  }
}

async function validateState(state?: string) {
  const stored = await readJson<{ state?: string } | null>(stateFile, null);
  await rm(stateFile, { force: true });
  if (!state || !stored?.state || state !== stored.state) {
    throw new Error("OAuth state validation failed.");
  }
}

async function readTokenStore() {
  return readJson<YouTubeTokenStore | null>(tokenFile, null);
}

async function readJson<T>(filePath: string, fallback: T) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sanitizeTokens(tokens: Record<string, unknown>) {
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date
  };
}

function parseGrantedScopes(scopeValue: unknown) {
  if (typeof scopeValue !== "string") {
    return [] as string[];
  }

  return scopeValue
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}
