import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
    const exportResult = exportSleepTrackWav({
      preset: normalized.preset,
      minutes: normalized.minutes,
      seed: normalized.seed
    });

    const audioPath = path.join(tempDir, `${fileBase}.wav`);
    const audioBuffer = Buffer.from(await exportResult.blob.arrayBuffer());
    await writeFile(audioPath, audioBuffer);

    const thumbnailSvg = buildSleepThumbnailSvg(normalized);
    const thumbnailSvgFilePath = path.join(thumbnailDir, `${fileBase}.svg`);
    await writeFile(thumbnailSvgFilePath, thumbnailSvg, "utf8");

    const resvg = new Resvg(thumbnailSvg, {
      fitTo: {
        mode: "width",
        value: 1280
      }
    });
    const pngData = resvg.render();
    const thumbnailFilePath = path.join(thumbnailDir, `${fileBase}.png`);
    await writeFile(thumbnailFilePath, pngData.asPng());

    const videoFilePath = path.join(videoDir, `${fileBase}.mp4`);
    await renderSleepVideo({
      ffmpegExecutable: ffmpegPath,
      releasePreset: normalized.releasePreset,
      durationSeconds: exportResult.durationSeconds,
      audioPath,
      thumbnailPngPath: thumbnailFilePath,
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

async function renderSleepVideo(input: {
  ffmpegExecutable: string;
  releasePreset: SleepReleasePreset;
  durationSeconds: number;
  audioPath: string;
  thumbnailPngPath: string;
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
          input.outputVideoPath
        ];

  await runProcess(input.ffmpegExecutable, args);
}

async function runProcess(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

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

      reject(new Error(stderr || `Process exited with code ${code}.`));
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
