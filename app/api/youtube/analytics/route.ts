import { NextResponse } from "next/server";

import { getAuthorizedOAuthClient, getYouTubeStatus } from "@/lib/youtube-auth";
import {
  captureCurrentMetricsSnapshot,
  getPrimaryPublicUpload,
  readMetricsHistory
} from "@/lib/youtube-analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [status, history, publicUpload] = await Promise.all([
    getYouTubeStatus(),
    readMetricsHistory(),
    getPrimaryPublicUpload()
  ]);

  return NextResponse.json({
    configured: status.configured,
    connected: status.connected,
    analyticsScopeGranted: status.analyticsScopeGranted,
    targetVideo: publicUpload
      ? {
          videoId: publicUpload.videoId,
          title: publicUpload.title ?? "Untitled public upload",
          privacyStatus: publicUpload.privacyStatus ?? "public",
          uploadedAt: publicUpload.uploadedAt
        }
      : null,
    latestSnapshot: history[0] ?? null,
    history
  });
}

export async function POST() {
  const authClient = await getAuthorizedOAuthClient();
  if (!authClient) {
    return NextResponse.json({ error: "Connect YouTube first." }, { status: 401 });
  }

  const publicUpload = await getPrimaryPublicUpload();
  if (!publicUpload?.videoId || !publicUpload.uploadedAt) {
    return NextResponse.json({ error: "No public YouTube upload found to measure yet." }, { status: 400 });
  }

  const snapshot = await captureCurrentMetricsSnapshot(authClient, {
    videoId: publicUpload.videoId,
    title: publicUpload.title ?? "Untitled public upload",
    privacyStatus: publicUpload.privacyStatus ?? "public",
    uploadedAt: publicUpload.uploadedAt
  });

  return NextResponse.json({
    ok: true,
    snapshot
  });
}
