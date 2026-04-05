import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { google } from "googleapis";

import { YOUTUBE_ANALYTICS_SCOPE, getYouTubeStatus, readUploadHistory } from "@/lib/youtube-auth";

const dataDir = path.join(process.cwd(), "data");
const metricsHistoryFile = path.join(dataDir, "youtube-metrics-history.json");

export interface YouTubeMetricsSnapshot {
  videoId: string;
  title: string;
  privacyStatus: string;
  uploadedAt: string;
  snapshotAt: string;
  views: number | null;
  clickThroughRate: number | null;
  averageViewDurationSeconds: number | null;
  averageViewPercentage: number | null;
  analyticsStatus: "complete" | "partial" | "analytics_scope_missing" | "analytics_api_disabled" | "analytics_error";
  analyticsNote: string;
}

export async function getPrimaryPublicUpload() {
  const history = await readUploadHistory();
  return history.find((item) => item.privacyStatus === "public" && item.videoId && item.uploadedAt) as
    | {
        videoId: string;
        title?: string;
        privacyStatus?: string;
        uploadedAt: string;
      }
    | undefined;
}

export async function captureCurrentMetricsSnapshot(
  authClient: InstanceType<typeof google.auth.OAuth2>,
  input: {
    videoId: string;
    title: string;
    privacyStatus: string;
    uploadedAt: string;
  }
) {
  const youtube = google.youtube({
    version: "v3",
    auth: authClient
  });

  const status = await getYouTubeStatus();
  const statisticsResponse = await youtube.videos.list({
    part: ["statistics"],
    id: [input.videoId]
  });

  const statistics = statisticsResponse.data.items?.[0]?.statistics;
  const views = statistics?.viewCount ? Number(statistics.viewCount) : null;

  let clickThroughRate: number | null = null;
  let averageViewDurationSeconds: number | null = null;
  let averageViewPercentage: number | null = null;
  let analyticsStatus: YouTubeMetricsSnapshot["analyticsStatus"] = "partial";
  let analyticsNote = "Views captured from YouTube Data API.";

  if (!status.analyticsScopeGranted) {
    analyticsStatus = "analytics_scope_missing";
    analyticsNote =
      "Reconnect YouTube after adding yt-analytics.readonly scope so CTR and average view duration can be fetched.";
  } else {
    try {
      const analytics = google.youtubeAnalytics({
        version: "v2",
        auth: authClient
      });

      const startDate = input.uploadedAt.slice(0, 10);
      const endDate = new Date().toISOString().slice(0, 10);

      const response = await analytics.reports.query({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics:
          "views,averageViewDuration,averageViewPercentage,videoThumbnailImpressionsClickRate",
        filters: `video==${input.videoId}`
      });

      const row = response.data.rows?.[0];
      if (row) {
        const [, avgDuration, avgPercentage, ctr] = row;
        averageViewDurationSeconds = toNumber(avgDuration);
        averageViewPercentage = toNumber(avgPercentage);
        clickThroughRate = toNumber(ctr);
        analyticsStatus = "complete";
        analyticsNote = "Views, CTR, and average view duration captured successfully.";
      } else {
        analyticsStatus = "partial";
        analyticsNote = "Analytics query returned no rows yet. Views are available, but retention/CTR data may lag.";
      }
    } catch (error) {
      const message = extractAnalyticsErrorMessage(error);
      if (message.includes("youtubeanalytics.googleapis.com") || message.includes("SERVICE_DISABLED")) {
        analyticsStatus = "analytics_api_disabled";
        analyticsNote =
          "Enable YouTube Analytics API in Google Cloud, then reconnect YouTube to capture CTR and average view duration.";
      } else {
        analyticsStatus = "analytics_error";
        analyticsNote = message;
      }
    }
  }

  const snapshot: YouTubeMetricsSnapshot = {
    videoId: input.videoId,
    title: input.title,
    privacyStatus: input.privacyStatus,
    uploadedAt: input.uploadedAt,
    snapshotAt: new Date().toISOString(),
    views,
    clickThroughRate,
    averageViewDurationSeconds,
    averageViewPercentage,
    analyticsStatus,
    analyticsNote
  };

  await recordMetricsSnapshot(snapshot);
  return snapshot;
}

export async function readMetricsHistory() {
  return readJson<YouTubeMetricsSnapshot[]>(metricsHistoryFile, []);
}

async function recordMetricsSnapshot(snapshot: YouTubeMetricsSnapshot) {
  const history = await readMetricsHistory();
  history.unshift(snapshot);
  await writeJson(metricsHistoryFile, history.slice(0, 50));
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

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractAnalyticsErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "YouTube analytics query failed.";
}
