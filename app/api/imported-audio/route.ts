import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { addImportedAudioRecord, listImportedAudioRecords } from "@/lib/imported-audio-library";
import { addVideo, findDuplicateVideoByUrl } from "@/lib/library";
import { logAction } from "@/lib/logger";

export async function GET() {
  const records = await listImportedAudioRecords();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const title = formData.get("title")?.toString().trim();
  const sourceName = formData.get("sourceName")?.toString().trim();
  const licenseNote = formData.get("licenseNote")?.toString().trim();
  const minutes = Number(formData.get("minutes")?.toString() ?? "");
  const tags = formData
    .get("tags")
    ?.toString()
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10) ?? [];
  const channelName = formData.get("channelName")?.toString().trim() || "Midnight Tide Sleep";
  const channelSlug = normalizeSlug(
    formData.get("channelSlug")?.toString().trim() || channelName
  );
  const status = formData.get("status")?.toString() === "draft" ? "draft" : "published";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pick an audio file first." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!sourceName) {
    return NextResponse.json({ error: "Source name is required." }, { status: 400 });
  }
  if (!licenseNote) {
    return NextResponse.json({ error: "License note is required." }, { status: 400 });
  }
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600) {
    return NextResponse.json({ error: "Minutes must stay between 1 and 600." }, { status: 400 });
  }

  const extension = getSupportedAudioExtension(file);
  if (!extension) {
    return NextResponse.json(
      { error: "Only wav, mp3, and m4a files are supported right now." },
      { status: 400 }
    );
  }

  const fileBase = `${normalizeSlug(title)}-${Date.now()}`;
  const fileName = `${fileBase}.${extension}`;
  const relativeUrl = `/api/generated-assets/imported-audio/${fileName}`;
  const duplicate = await findDuplicateVideoByUrl(relativeUrl);
  if (duplicate) {
    return NextResponse.json(
      { error: `That imported audio already exists as \"${duplicate.title}\".`, videoId: duplicate.id },
      { status: 409 }
    );
  }

  const publicDir = process.env.LOCALTUBE_PUBLIC_DIR?.trim()
    ? path.resolve(process.cwd(), process.env.LOCALTUBE_PUBLIC_DIR)
    : path.join(process.cwd(), "public");
  const audioDir = path.join(publicDir, "imported-audio");
  await mkdir(audioDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(audioDir, fileName), buffer);

  const record = await addImportedAudioRecord({
    title,
    sourceName,
    licenseNote,
    minutes,
    tags,
    fileUrl: relativeUrl,
    fileName
  });

  const video = await addVideo({
    title,
    description: `${sourceName}. ${licenseNote}`,
    channelName,
    channelSlug,
    category: "sleep",
    duration: record.durationLabel,
    videoUrl: relativeUrl,
    tags,
    status
  });

  logAction("sleep-audio.imported", {
    importedAudioId: record.id,
    videoId: video.id,
    sourceName,
    minutes,
    fileName
  });

  return NextResponse.json({
    ok: true,
    record,
    videoId: video.id
  });
}

function getSupportedAudioExtension(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".wav") || file.type === "audio/wav" || file.type === "audio/x-wav") {
    return "wav";
  }
  if (name.endsWith(".mp3") || file.type === "audio/mpeg") {
    return "mp3";
  }
  if (name.endsWith(".m4a") || file.type === "audio/mp4") {
    return "m4a";
  }
  return null;
}

function normalizeSlug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "sleep-import"
  );
}
