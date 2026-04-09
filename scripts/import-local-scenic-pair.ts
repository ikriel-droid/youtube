import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

import { addImportedAudioRecord } from "../lib/imported-audio-library";
import { addImportedFootageRecord } from "../lib/imported-footage-library";

async function main() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static is required to import local scenic audio.");
  }

  const args = parseArgs(process.argv.slice(2));
  if (
    !args.audioFile ||
    !args.footageFile ||
    !args.audioTitle ||
    !args.footageTitle ||
    !args.audioSourceName ||
    !args.footageSourceName ||
    !args.audioLicenseNote ||
    !args.footageLicenseNote
  ) {
    throw new Error(
      "Missing required args. Need --audio-file, --footage-file, --audio-title, --footage-title, --audio-source-name, --footage-source-name, --audio-license-note, and --footage-license-note."
    );
  }

  const publicDir = path.join(process.cwd(), "public");
  const audioDir = path.join(publicDir, "imported-audio");
  const footageDir = path.join(publicDir, "imported-footage");
  await Promise.all([mkdir(audioDir, { recursive: true }), mkdir(footageDir, { recursive: true })]);

  const timestamp = Date.now();
  const audioFileName = `${slugify(args.audioTitle)}-${timestamp}.mp3`;
  const footageExtension = normalizeExtension(path.extname(args.footageFile));
  const footageFileName = `${slugify(args.footageTitle)}-${timestamp}.${footageExtension}`;

  const audioOutputPath = path.join(audioDir, audioFileName);
  const footageOutputPath = path.join(footageDir, footageFileName);

  await convertAudioToMp3(path.resolve(args.audioFile), audioOutputPath);
  await copyFile(path.resolve(args.footageFile), footageOutputPath);
  await assertAudioIsAudible(audioOutputPath);

  const audioRecord = await addImportedAudioRecord({
    title: args.audioTitle,
    sourceName: args.audioSourceName,
    licenseNote: args.audioLicenseNote,
    minutes: args.minutes ?? 60,
    tags: parseTags(args.audioTags),
    fileUrl: `/api/generated-assets/imported-audio/${audioFileName}`,
    fileName: audioFileName
  });

  const footageRecord = await addImportedFootageRecord({
    title: args.footageTitle,
    sourceName: args.footageSourceName,
    licenseNote: args.footageLicenseNote,
    tags: parseTags(args.footageTags),
    fileUrl: `/api/generated-assets/imported-footage/${footageFileName}`,
    fileName: footageFileName
  });

  console.log(
    JSON.stringify(
      {
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
    audioFile?: string;
    footageFile?: string;
    audioTitle?: string;
    footageTitle?: string;
    audioSourceName?: string;
    footageSourceName?: string;
    audioLicenseNote?: string;
    footageLicenseNote?: string;
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
      case "--audio-file":
        parsed.audioFile = value;
        index += 1;
        break;
      case "--footage-file":
        parsed.footageFile = value;
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
      case "--audio-source-name":
        parsed.audioSourceName = value;
        index += 1;
        break;
      case "--footage-source-name":
        parsed.footageSourceName = value;
        index += 1;
        break;
      case "--audio-license-note":
        parsed.audioLicenseNote = value;
        index += 1;
        break;
      case "--footage-license-note":
        parsed.footageLicenseNote = value;
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

function normalizeExtension(extension: string) {
  const clean = extension.replace(/^\./, "").toLowerCase();
  return ["mp4", "mov", "webm", "ogv"].includes(clean) ? clean : "webm";
}

async function convertAudioToMp3(inputPath: string, outputPath: string) {
  await runProcess(ffmpegPath!, [
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
}

async function assertAudioIsAudible(audioPath: string) {
  const output = await runProcessCapture(ffmpegPath!, [
    "-i",
    audioPath,
    "-af",
    "volumedetect",
    "-f",
    "null",
    process.platform === "win32" ? "NUL" : "/dev/null"
  ]);

  const match = output.match(/mean_volume:\s*(-?[0-9.]+)\s*dB/i);
  const meanVolume = match ? Number(match[1]) : null;
  if (meanVolume === null || meanVolume <= -70) {
    throw new Error(
      `Imported scenic source audio is effectively silent (mean volume ${meanVolume ?? "n/a"} dB). Use a source with real audible ambience.`
    );
  }
}

async function runProcess(command: string, args: string[]) {
  await runProcessCapture(command, args);
}

async function runProcessCapture(command: string, args: string[]) {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(`${stdout}\n${stderr}`);
        return;
      }

      reject(new Error(stderr || stdout || `Process exited with code ${code}.`));
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
