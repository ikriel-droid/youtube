import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { addVideo, findDuplicateVideoByUrl } from "@/lib/library";
import { logAction } from "@/lib/logger";
import {
  buildSleepMetadata,
  exportSleepTrackWav,
  type SleepPreset,
  type SleepReleasePreset
} from "@/lib/sleep-audio";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    preset?: SleepPreset;
    minutes?: number;
    seed?: string;
    releasePreset?: SleepReleasePreset;
    title?: string;
    description?: string;
    tags?: string[];
    channelName?: string;
    channelSlug?: string;
    status?: "draft" | "published";
  };

  const preset = body.preset;
  const minutes = Number(body.minutes);
  const seed = body.seed?.trim();
  const releasePreset = body.releasePreset;
  const channelName = body.channelName?.trim() || "Sleep Lab";
  const channelSlug = normalizeChannelSlug(body.channelSlug?.trim() || channelName);
  const status = body.status === "draft" ? "draft" : "published";

  if (!preset || !["deep-drone", "brown-noise", "rain", "ocean"].includes(preset)) {
    return NextResponse.json({ error: "Pick a valid sleep preset." }, { status: 400 });
  }
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) {
    return NextResponse.json({ error: "Minutes must stay between 1 and 60." }, { status: 400 });
  }
  if (!seed) {
    return NextResponse.json({ error: "Seed is required." }, { status: 400 });
  }

  const filename = `${preset}-${minutes}min-${slugify(seed)}.wav`;
  const relativeUrl = `/api/generated-assets/generated-audio/${filename}`;
  const duplicate = await findDuplicateVideoByUrl(relativeUrl);
  if (duplicate) {
    return NextResponse.json(
      { error: `That generated track already exists as "${duplicate.title}".`, videoId: duplicate.id },
      { status: 409 }
    );
  }

  const exportResult = exportSleepTrackWav({
    preset,
    minutes,
    seed
  });
  const metadata = buildSleepMetadata({
    preset,
    minutes,
    seed
  }, {
    releasePreset
  });
  const title = body.title?.trim() || metadata.title;
  const description = body.description?.trim() || metadata.description;
  const tags = normalizeTags(body.tags, metadata.tags);

  const publicDir = process.env.LOCALTUBE_PUBLIC_DIR?.trim()
    ? path.resolve(process.cwd(), process.env.LOCALTUBE_PUBLIC_DIR)
    : path.join(process.cwd(), "public");
  const audioDir = path.join(publicDir, "generated-audio");
  await mkdir(audioDir, { recursive: true });

  const fileBuffer = Buffer.from(await exportResult.blob.arrayBuffer());
  await writeFile(path.join(audioDir, filename), fileBuffer);

  const video = await addVideo({
    title,
    description: `${description} Saved from Sleep Lab with ${exportResult.qualityLabel}.`,
    channelName,
    channelSlug,
    category: "sleep",
    duration: formatDuration(minutes),
    videoUrl: relativeUrl,
    tags,
    status
  });

  logAction("sleep-track.saved", {
    videoId: video.id,
    preset,
    releasePreset: releasePreset ?? "black-screen",
    minutes,
    status,
    path: relativeUrl,
    channelSlug
  });

  return NextResponse.json({
    ok: true,
    videoId: video.id,
    fileUrl: relativeUrl
  });
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function formatDuration(minutes: number) {
  return `${String(minutes).padStart(2, "0")}:00`;
}

function normalizeTags(tags: string[] | undefined, fallback: string[]) {
  const cleaned = (tags ?? [])
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);

  return cleaned.length > 0 ? [...new Set(cleaned)] : fallback;
}

function normalizeChannelSlug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "sleep-lab"
  );
}
