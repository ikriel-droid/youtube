import { NextResponse } from "next/server";

import { logAction } from "@/lib/logger";
import { generateSleepRenderBundle, type SleepRenderRequestInput } from "@/lib/sleep-render-bundle";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SleepRenderRequestInput>;

  if (!body.preset || !["deep-drone", "brown-noise", "rain", "ocean"].includes(body.preset)) {
    return NextResponse.json({ error: "Pick a valid sleep preset." }, { status: 400 });
  }
  if (!body.releasePreset || !["black-screen", "rain-window", "ocean-drift"].includes(body.releasePreset)) {
    return NextResponse.json({ error: "Pick a valid release preset." }, { status: 400 });
  }
  if (!Number.isFinite(body.minutes) || Number(body.minutes) < 1 || Number(body.minutes) > 60) {
    return NextResponse.json({ error: "Minutes must stay between 1 and 60." }, { status: 400 });
  }
  if (!body.seed?.trim()) {
    return NextResponse.json({ error: "Seed is required." }, { status: 400 });
  }

  try {
    const bundle = await generateSleepRenderBundle({
      preset: body.preset,
      releasePreset: body.releasePreset,
      minutes: Number(body.minutes),
      seed: body.seed.trim(),
      title: body.title,
      description: body.description,
      tags: body.tags,
      channelName: body.channelName
    });

    logAction("sleep-render.bundle_created", {
      fileBase: bundle.fileBase,
      preset: body.preset,
      releasePreset: body.releasePreset,
      minutes: body.minutes,
      mp4: bundle.videoUrl,
      thumbnail: bundle.thumbnailUrl
    });

    return NextResponse.json({
      ok: true,
      videoUrl: bundle.videoUrl,
      thumbnailUrl: bundle.thumbnailUrl,
      thumbnailSvgUrl: bundle.thumbnailSvgUrl,
      manifestUrl: bundle.manifestUrl,
      suggestedFilenameBase: bundle.fileBase
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sleep render failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
