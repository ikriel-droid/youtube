import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { Resvg } from "@resvg/resvg-js";
import ffmpegPath from "ffmpeg-static";

import {
  buildSleepMetadata,
  exportSleepTrackWav,
  type SleepPreset,
  type SleepReleasePreset
} from "@/lib/sleep-audio";
import {
  buildSleepFileBase,
  buildSleepRenderManifest,
  buildSleepThumbnailSvg
} from "@/lib/sleep-render";

export interface SleepRenderRequestInput {
  preset: SleepPreset;
  releasePreset: SleepReleasePreset;
  minutes: number;
  seed: string;
  audioSourceUrl?: string;
  footageSourceUrl?: string;
  title?: string;
  description?: string;
  tags?: string[];
  channelName?: string;
}

export interface SleepRenderBundleResult {
  fileBase: string;
  videoUrl: string;
  thumbnailUrl: string;
  thumbnailSvgUrl: string;
  manifestUrl: string;
  manifest: ReturnType<typeof buildSleepRenderManifest>;
  videoFilePath: string;
  thumbnailFilePath: string;
  thumbnailSvgFilePath: string;
  manifestFilePath: string;
}

export interface SleepBundleVerificationSample {
  label: string;
  startSeconds: number;
  meanVolumeDb: number | null;
  maxVolumeDb: number | null;
}

export interface SleepBundleVerificationResult {
  expectedDurationSeconds: number;
  actualDurationSeconds: number;
  samples: SleepBundleVerificationSample[];
}

interface PreparedFootageSource {
  footagePath: string;
  thumbnailBackgroundPath: string;
}

export async function generateSleepRenderBundle(
  input: SleepRenderRequestInput
): Promise<SleepRenderBundleResult> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static is not available, so video rendering cannot start.");
  }

  const metadata = buildSleepMetadata(
    {
      preset: input.preset,
      minutes: input.minutes,
      seed: input.seed
    },
    {
      releasePreset: input.releasePreset
    }
  );

  const normalized = {
    preset: input.preset,
    releasePreset: input.releasePreset,
    minutes: input.minutes,
    seed: input.seed,
    audioSourceUrl: input.audioSourceUrl?.trim() || undefined,
    footageSourceUrl: input.footageSourceUrl?.trim() || undefined,
    title: input.title?.trim() || metadata.title,
    description: input.description?.trim() || metadata.description,
    tags: normalizeTags(input.tags, metadata.tags),
    channelName: input.channelName?.trim() || "Sleep Lab"
  };

  const fileBase = buildSleepFileBase(normalized);
  const publicDir = getPublicDir();
  const videoDir = path.join(publicDir, "generated-video");
  const thumbnailDir = path.join(publicDir, "generated-thumbnails");
  const manifestDir = path.join(publicDir, "generated-manifests");

  await Promise.all([
    mkdir(videoDir, { recursive: true }),
    mkdir(thumbnailDir, { recursive: true }),
    mkdir(manifestDir, { recursive: true })
  ]);

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "localtube-sleep-render-"));

  try {
    const audioSource = normalized.audioSourceUrl
      ? await prepareImportedAudioSource({
          audioSourceUrl: normalized.audioSourceUrl,
          tempDir,
          fileBase,
          minutes: normalized.minutes
        })
      : await prepareGeneratedAudioSource({
          preset: normalized.preset,
          minutes: normalized.minutes,
          seed: normalized.seed,
          tempDir,
          fileBase
        });

    const preparedFootage = normalized.footageSourceUrl
      ? await prepareImportedFootageSource({
          footageSourceUrl: normalized.footageSourceUrl,
          tempDir,
          fileBase,
          ffmpegExecutable: ffmpegPath
        })
      : null;

    const thumbnailSvg = preparedFootage
      ? buildFrameOnlyThumbnailSvg()
      : buildSleepThumbnailSvg(normalized);
    const thumbnailSvgFilePath = path.join(thumbnailDir, `${fileBase}.svg`);
    await writeFile(thumbnailSvgFilePath, thumbnailSvg, "utf8");

    const thumbnailFilePath = path.join(thumbnailDir, `${fileBase}.png`);

    if (preparedFootage) {
      await copyFile(preparedFootage.thumbnailBackgroundPath, thumbnailFilePath);
    } else {
      const resvg = new Resvg(thumbnailSvg, {
        fitTo: {
          mode: "width",
          value: 1280
        }
      });
      const renderedThumbnailPng = resvg.render().asPng();
      await writeFile(thumbnailFilePath, renderedThumbnailPng);
    }

    const videoFilePath = path.join(videoDir, `${fileBase}.mp4`);
    await renderSleepVideo({
      ffmpegExecutable: ffmpegPath,
      releasePreset: normalized.releasePreset,
      durationSeconds: audioSource.durationSeconds,
      audioPath: audioSource.audioPath,
      thumbnailPngPath: thumbnailFilePath,
      footagePath: preparedFootage?.footagePath,
      outputVideoPath: videoFilePath
    });

    const manifest = buildSleepRenderManifest(normalized);
    const manifestFilePath = path.join(manifestDir, `${fileBase}.json`);
    await writeFile(manifestFilePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    return {
      fileBase,
      videoUrl: `/api/generated-assets/generated-video/${fileBase}.mp4`,
      thumbnailUrl: `/api/generated-assets/generated-thumbnails/${fileBase}.png`,
      thumbnailSvgUrl: `/api/generated-assets/generated-thumbnails/${fileBase}.svg`,
      manifestUrl: `/api/generated-assets/generated-manifests/${fileBase}.json`,
      manifest,
      videoFilePath,
      thumbnailFilePath,
      thumbnailSvgFilePath,
      manifestFilePath
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function prepareGeneratedAudioSource(input: {
  preset: SleepPreset;
  minutes: number;
  seed: string;
  tempDir: string;
  fileBase: string;
}) {
  const exportResult = exportSleepTrackWav({
    preset: input.preset,
    minutes: input.minutes,
    seed: input.seed
  });

  const audioPath = path.join(input.tempDir, `${input.fileBase}.wav`);
  const audioBuffer = Buffer.from(await exportResult.blob.arrayBuffer());
  await writeFile(audioPath, audioBuffer);

  return {
    audioPath,
    durationSeconds: exportResult.durationSeconds
  };
}

async function prepareImportedAudioSource(input: {
  audioSourceUrl: string;
  tempDir: string;
  fileBase: string;
  minutes: number;
}) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static is not available, so imported audio cannot be extended for video rendering.");
  }

  const filePath = resolveImportedAudioSourcePath(input.audioSourceUrl);
  const durationSeconds = input.minutes * 60;
  const audioPath = path.join(input.tempDir, `${input.fileBase}-looped.wav`);

  await runProcess(ffmpegPath, buildLoopedImportedAudioArgs(filePath, audioPath, durationSeconds));

  return {
    audioPath,
    durationSeconds
  };
}

export function buildLoopedImportedAudioArgs(inputPath: string, outputPath: string, durationSeconds: number) {
  return [
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    inputPath,
    "-t",
    String(durationSeconds),
    "-ac",
    "2",
    "-ar",
    "44100",
    "-c:a",
    "pcm_s16le",
    outputPath
  ];
}

async function prepareImportedFootageSource(input: {
  footageSourceUrl: string;
  tempDir: string;
  fileBase: string;
  ffmpegExecutable: string;
}): Promise<PreparedFootageSource> {
  const originalFootagePath = resolveImportedFootageSourcePath(input.footageSourceUrl);
  const footagePath = path.join(input.tempDir, `${input.fileBase}-footage.mp4`);
  const thumbnailBackgroundPath = path.join(input.tempDir, `${input.fileBase}-thumbnail-background.png`);

  await runProcess(input.ffmpegExecutable, [
    "-y",
    "-ss",
    "1.2",
    "-i",
    originalFootagePath,
    "-an",
    "-vf",
    "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "superfast",
    "-crf",
    "25",
    "-movflags",
    "+faststart",
    footagePath
  ]);

  await runProcess(input.ffmpegExecutable, [
    "-y",
    "-i",
    footagePath,
    "-frames:v",
    "1",
    thumbnailBackgroundPath
  ]);

  return {
    footagePath,
    thumbnailBackgroundPath
  };
}

function resolveImportedAudioSourcePath(audioSourceUrl: string) {
  const match = audioSourceUrl.match(/^\/api\/generated-assets\/([^/]+)\/([^/]+)$/);
  if (!match) {
    throw new Error("Imported audio source must come from LocalTube assets.");
  }

  const [, bucket, filename] = match;
  if (!["generated-audio", "imported-audio"].includes(bucket)) {
    throw new Error("Unsupported audio asset bucket.");
  }
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw new Error("Invalid audio asset path.");
  }

  return path.join(getPublicDir(), bucket, filename);
}

function resolveImportedFootageSourcePath(footageSourceUrl: string) {
  const match = footageSourceUrl.match(/^\/api\/generated-assets\/([^/]+)\/([^/]+)$/);
  if (!match) {
    throw new Error("Imported footage source must come from LocalTube assets.");
  }

  const [, bucket, filename] = match;
  if (!["imported-footage"].includes(bucket)) {
    throw new Error("Unsupported footage asset bucket.");
  }
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw new Error("Invalid footage asset path.");
  }

  return path.join(getPublicDir(), bucket, filename);
}

function getPublicDir() {
  const configured = process.env.LOCALTUBE_PUBLIC_DIR?.trim();
  if (!configured) {
    return path.join(process.cwd(), "public");
  }

  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export async function readSleepBundleFiles(bundle: SleepRenderBundleResult) {
  const [mp4, png, svg, manifest] = await Promise.all([
    readFile(bundle.videoFilePath),
    readFile(bundle.thumbnailFilePath),
    readFile(bundle.thumbnailSvgFilePath, "utf8"),
    readFile(bundle.manifestFilePath, "utf8")
  ]);

  return { mp4, png, svg, manifest };
}

export async function verifyRenderedSleepBundle(input: {
  bundle: SleepRenderBundleResult;
  expectedDurationSeconds: number;
}) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static is not available, so rendered bundle verification cannot run.");
  }

  const actualDurationSeconds = await probeMediaDurationSeconds(input.bundle.videoFilePath);
  if (Math.abs(actualDurationSeconds - input.expectedDurationSeconds) > 2) {
    throw new Error(
      `Rendered video duration mismatch. Expected about ${input.expectedDurationSeconds}s but got ${actualDurationSeconds.toFixed(2)}s.`
    );
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "localtube-sleep-verify-"));

  try {
    const samples: SleepBundleVerificationSample[] = [];

    for (const startSeconds of buildVerificationSampleOffsets(actualDurationSeconds)) {
      const label =
        startSeconds >= input.expectedDurationSeconds - 15
          ? "tail"
          : startSeconds >= 300
            ? "post-5min"
            : "mid";
      const samplePath = path.join(
        tempDir,
        `${path.basename(input.bundle.videoFilePath, path.extname(input.bundle.videoFilePath))}-${label}.wav`
      );

      await runProcess(ffmpegPath, [
        "-y",
        "-ss",
        String(startSeconds),
        "-t",
        "3",
        "-i",
        input.bundle.videoFilePath,
        "-map",
        "0:a:0",
        "-ac",
        "2",
        "-ar",
        "44100",
        samplePath
      ]);

      const { meanVolumeDb, maxVolumeDb } = await detectAudioVolume(samplePath);
      if (meanVolumeDb === null || meanVolumeDb <= -70) {
        throw new Error(
          `Rendered audio verification failed at ${label} sample (${startSeconds}s). Mean volume was ${meanVolumeDb ?? "n/a"} dB.`
        );
      }

      samples.push({
        label,
        startSeconds,
        meanVolumeDb,
        maxVolumeDb
      });
    }

    const result: SleepBundleVerificationResult = {
      expectedDurationSeconds: input.expectedDurationSeconds,
      actualDurationSeconds,
      samples
    };

    return result;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function renderSleepVideo(input: {
  ffmpegExecutable: string;
  releasePreset: SleepReleasePreset;
  durationSeconds: number;
  audioPath: string;
  thumbnailPngPath: string;
  footagePath?: string;
  outputVideoPath: string;
}) {
  const duration = String(input.durationSeconds);
  const args =
    input.releasePreset === "black-screen"
      ? [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `color=c=black:s=1920x1080:r=30:d=${duration}`,
          "-i",
          input.audioPath,
          "-shortest",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          input.outputVideoPath
        ]
      : input.footagePath
        ? [
            "-y",
            "-fflags",
            "+genpts",
            "-stream_loop",
            "-1",
            "-i",
            input.footagePath,
            "-i",
            input.audioPath,
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-t",
            duration,
            "-c:v",
            "libx264",
            "-preset",
            "superfast",
            "-crf",
            "27",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            input.outputVideoPath
          ]
        : [
          "-y",
          "-loop",
          "1",
          "-i",
          input.thumbnailPngPath,
          "-i",
          input.audioPath,
          "-filter:v",
          "scale=1920:1080,zoompan=z='min(zoom+0.00012,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,format=yuv420p",
          "-t",
          duration,
          "-shortest",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-movflags",
          "+faststart",
          input.outputVideoPath
        ];

  await runProcess(input.ffmpegExecutable, args);
}

export function buildVerificationSampleOffsets(actualDurationSeconds: number) {
  const latestSafeStart = Math.max(0, Math.floor(actualDurationSeconds) - 15);
  const sampleStarts = new Set<number>();

  if (actualDurationSeconds >= 315) {
    sampleStarts.add(310);
  }

  sampleStarts.add(latestSafeStart);

  return [...sampleStarts]
    .filter((value) => value <= Math.max(0, Math.floor(actualDurationSeconds) - 3))
    .sort((left, right) => left - right);
}

async function probeMediaDurationSeconds(filePath: string) {
  const output = await runProcessCapture(ffmpegPath!, ["-i", filePath, "-f", "null", "-"]);
  const match = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`Could not read media duration for ${filePath}.`);
  }

  const [, hours, minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

async function detectAudioVolume(filePath: string) {
  const output = await runProcessCapture(ffmpegPath!, [
    "-i",
    filePath,
    "-af",
    "volumedetect",
    "-f",
    "null",
    process.platform === "win32" ? "NUL" : "/dev/null"
  ]);

  return {
    meanVolumeDb: extractVolumeMetric(output, "mean_volume"),
    maxVolumeDb: extractVolumeMetric(output, "max_volume")
  };
}

function extractVolumeMetric(output: string, key: "mean_volume" | "max_volume") {
  const match = output.match(new RegExp(`${key}:\\s*(-?\\d+(?:\\.\\d+)?) dB`));
  return match ? Number(match[1]) : null;
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

function normalizeTags(tags: string[] | undefined, fallback: string[]) {
  const cleaned = (tags ?? [])
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);

  return cleaned.length > 0 ? [...new Set(cleaned)] : fallback;
}

function buildFrameOnlyThumbnailSvg() {
  return `
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="transparent"/>
</svg>`.trim();
}
