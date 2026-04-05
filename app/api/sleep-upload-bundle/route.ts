import JSZip from "jszip";
import { NextResponse } from "next/server";

import { logAction } from "@/lib/logger";
import {
  generateSleepRenderBundle,
  readSleepBundleFiles,
  type SleepRenderRequestInput
} from "@/lib/sleep-render-bundle";

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
      audioSourceUrl: body.audioSourceUrl,
      footageSourceUrl: body.footageSourceUrl,
      title: body.title,
      description: body.description,
      tags: body.tags,
      channelName: body.channelName
    });

    const files = await readSleepBundleFiles(bundle);
    const zip = new JSZip();

    zip.file(`${bundle.fileBase}.mp4`, files.mp4);
    zip.file(`${bundle.fileBase}.png`, files.png);
    zip.file(`${bundle.fileBase}.svg`, files.svg);
    zip.file(`${bundle.fileBase}.json`, files.manifest);
    zip.file("UPLOAD_CHECKLIST.txt", buildUploadChecklistText(bundle.fileBase, bundle.manifest));

    const archive = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    logAction("sleep-render.upload_bundle_created", {
      fileBase: bundle.fileBase,
      preset: body.preset,
      releasePreset: body.releasePreset,
      minutes: body.minutes
    });

    return new NextResponse(archive, {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename=\"${bundle.fileBase}-upload-bundle.zip\"`,
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload bundle creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildUploadChecklistText(
  fileBase: string,
  manifest: {
    title: string;
    description: string;
    tags: string[];
    pinnedComment: string;
    renderModeLabel: string;
    channelName: string;
  }
) {
  return [
    "LocalTube Sleep Upload Bundle",
    "============================",
    "",
    `Channel: ${manifest.channelName}`,
    `Render preset: ${manifest.renderModeLabel}`,
    `Filename base: ${fileBase}`,
    "",
    "Files included:",
    `- ${fileBase}.mp4`,
    `- ${fileBase}.png`,
    `- ${fileBase}.svg`,
    `- ${fileBase}.json`,
    "",
    "Manual upload steps:",
    "1. Upload the MP4 to YouTube as private or unlisted.",
    "2. Apply the PNG thumbnail.",
    "3. Copy title, description, tags, and pinned comment from the JSON manifest.",
    "4. Review playback on desktop and mobile before publishing.",
    "",
    `Title: ${manifest.title}`,
    "",
    "Description:",
    manifest.description,
    "",
    `Tags: ${manifest.tags.join(", ")}`,
    "",
    "Pinned comment:",
    manifest.pinnedComment,
    ""
  ].join("\n");
}
