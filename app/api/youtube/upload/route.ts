import { NextResponse } from "next/server";

import { getAuthorizedOAuthClient } from "@/lib/youtube-auth";
import { firstSleepVideoConcepts } from "@/lib/sleep-launch-plan";
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
    firstSleepVideoConcepts.find((item) => item.id === body.conceptId) ?? firstSleepVideoConcepts[0];

  try {
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

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
