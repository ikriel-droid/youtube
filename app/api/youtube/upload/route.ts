import { NextResponse } from "next/server";

import { getAuthorizedOAuthClient } from "@/lib/youtube-auth";
import { firstSleepVideoConcepts, getQuickPrivateTestConcept } from "@/lib/sleep-launch-plan";
import { writeYouTubeUploadLog } from "@/lib/youtube-upload-log";
import { uploadSleepBundleToYouTube } from "@/lib/youtube-upload";

export async function POST(request: Request) {
  const authClient = await getAuthorizedOAuthClient();
  if (!authClient) {
    return NextResponse.json({ error: "Connect YouTube first." }, { status: 401 });
  }

  const body = (await request.json()) as {
    conceptId?: string;
    privacyStatus?: "private" | "unlisted" | "public";
  };

  const concept =
    body.conceptId === "launch-01-quick"
      ? getQuickPrivateTestConcept()
      : firstSleepVideoConcepts.find((item) => item.id === body.conceptId) ?? firstSleepVideoConcepts[0];

  try {
    await writeYouTubeUploadLog("upload_attempt", {
      conceptId: concept.id,
      title: concept.title,
      privacyStatus: body.privacyStatus ?? "private"
    });

    const result = await uploadSleepBundleToYouTube(authClient, {
      preset: concept.preset,
      releasePreset: concept.releasePreset,
      minutes: concept.minutes,
      seed: concept.seed,
      title: concept.title,
      description: concept.hook,
      tags: concept.tags,
      channelName: "Midnight Tide Sleep",
      privacyStatus: body.privacyStatus ?? "private"
    });

    await writeYouTubeUploadLog("upload_success", {
      conceptId: concept.id,
      title: result.lastUpload?.title ?? concept.title,
      videoId: result.videoId,
      privacyStatus: result.lastUpload?.privacyStatus ?? (body.privacyStatus ?? "private"),
      youtubeWatchUrl: result.youtubeWatchUrl
    });

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube upload failed.";
    await writeYouTubeUploadLog("upload_error", {
      conceptId: concept.id,
      title: concept.title,
      privacyStatus: body.privacyStatus ?? "private",
      error: message
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
