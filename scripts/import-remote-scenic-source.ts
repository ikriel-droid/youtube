import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";

import { addImportedAudioRecord } from "../lib/imported-audio-library";
import { addImportedFootageRecord } from "../lib/imported-footage-library";

async function main() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static is required to extract audio from scenic footage.");
  }

  const args = parseArgs(process.argv.slice(2));
  if (!args.sourceUrl || !args.audioTitle || !args.footageTitle || !args.sourceName || !args.licenseNote) {
    throw new Error("Missing required args. Need --source-url, --audio-title, --footage-title, --source-name, --license-note.");
  }

  const publicDir = path.join(process.cwd(), "public");
  const footageDir = path.join(publicDir, "imported-footage");
  const audioDir = path.join(publicDir, "imported-audio");
  await Promise.all([mkdir(footageDir, { recursive: true }), mkdir(audioDir, { recursive: true })]);

  const response = await fetch(args.sourceUrl);
  if (!response.ok) {
    throw new Error(`Could not download remote source: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const remoteBuffer = Buffer.from(await response.arrayBuffer());

  const timestamp = Date.now();
  const sourceExtension = inferVideoExtension(args.sourceUrl, contentType);
  const footageFileName = `${slugify(args.footageTitle)}-${timestamp}.${sourceExtension}`;
  const footagePath = path.join(footageDir, footageFileName);
  await writeFile(footagePath, remoteBuffer);

  const audioFileName = `${slugify(args.audioTitle)}-${timestamp}.mp3`;
  const audioPath = path.join(audioDir, audioFileName);
  await extractAudioToMp3(footagePath, audioPath);

  const audioRecord = await addImportedAudioRecord({
    title: args.audioTitle,
    sourceName: args.sourceName,
    licenseNote: args.licenseNote,
    minutes: args.minutes ?? 60,
    tags: parseTags(args.audioTags),
    fileUrl: `/api/generated-assets/imported-audio/${audioFileName}`,
    fileName: audioFileName
  });

  const footageRecord = await addImportedFootageRecord({
    title: args.footageTitle,
    sourceName: args.sourceName,
    licenseNote: args.licenseNote,
    tags: parseTags(args.footageTags),
    fileUrl: `/api/generated-assets/imported-footage/${footageFileName}`,
    fileName: footageFileName
  });

  console.log(
    JSON.stringify(
      {
        sourceUrl: args.sourceUrl,
        audioRecord,
        footageRecord
      },
      null,
      2
    )
  );
}

function parseArgs(argv: string[]) {
  const parsed: {
    sourceUrl?: string;
    audioTitle?: string;
    footageTitle?: string;
    sourceName?: string;
    licenseNote?: string;
    audioTags?: string;
    footageTags?: string;
    minutes?: number;
  } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--")) {
      continue;
    }

    switch (key) {
      case "--source-url":
        parsed.sourceUrl = value;
        index += 1;
        break;
      case "--audio-title":
        parsed.audioTitle = value;
        index += 1;
        break;
      case "--footage-title":
        parsed.footageTitle = value;
        index += 1;
        break;
      case "--source-name":
        parsed.sourceName = value;
        index += 1;
        break;
      case "--license-note":
        parsed.licenseNote = value;
        index += 1;
        break;
      case "--audio-tags":
        parsed.audioTags = value;
        index += 1;
        break;
      case "--footage-tags":
        parsed.footageTags = value;
        index += 1;
        break;
      case "--minutes":
        parsed.minutes = Number(value);
        index += 1;
        break;
      default:
        break;
    }
  }

  return parsed;
}

function parseTags(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
}

function inferVideoExtension(sourceUrl: string, contentType: string) {
  const loweredUrl = sourceUrl.toLowerCase();
  if (loweredUrl.endsWith(".mp4") || contentType.includes("video/mp4")) {
    return "mp4";
  }
  if (loweredUrl.endsWith(".mov") || contentType.includes("video/quicktime")) {
    return "mov";
  }
  return "webm";
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "imported-scenic"
  );
}

async function extractAudioToMp3(inputPath: string, outputPath: string) {
  const { spawn } = await import("node:child_process");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath!, [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "2",
      "-ar",
      "44100",
      "-b:a",
      "192k",
      outputPath
    ]);

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `ffmpeg audio extraction failed with code ${code}.`));
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
