import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { Resvg } from "@resvg/resvg-js";
import ffmpegPath from "ffmpeg-static";
import { NextResponse } from "next/server";

import { logAction } from "@/lib/logger";
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

export async function POST(request: Request) {
  if (!ffmpegPath) {
    return NextResponse.json(
      { error: "ffmpeg-static is not available, so video rendering cannot start." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as {
    preset?: SleepPreset;
    releasePreset?: SleepReleasePreset;
    minutes?: number;
    seed?: string;
    title?: string;
    description?: string;
    tags?: string[];
    channelName?: string;
  };

  const preset = body.preset;
  const releasePreset = body.releasePreset ?? "black-screen";
  const minutes = Number(body.minutes);
  const seed = body.seed?.trim();

  if (!preset || !["deep-drone", "brown-noise", "rain", "ocean"].includes(preset)) {
    return NextResponse.json({ error: "Pick a valid sleep preset." }, { status: 400 });
  }
  if (!["black-screen", "rain-window", "ocean-drift"].includes(releasePreset)) {
    return NextResponse.json({ error: "Pick a valid release preset." }, { status: 400 });
  }
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) {
    return NextResponse.json({ error: "Minutes must stay between 1 and 60." }, { status: 400 });
  }
  if (!seed) {
    return NextResponse.json({ error: "Seed is required." }, { status: 400 });
  }

  const metadata = buildSleepMetadata(
    {
      preset,
      minutes,
      seed
    },
    {
      releasePreset
    }
  );

  const input = {
    preset,
    releasePreset,
    minutes,
    seed,
    title: body.title?.trim() || metadata.title,
    description: body.description?.trim() || metadata.description,
    tags: normalizeTags(body.tags, metadata.tags),
    channelName: body.channelName?.trim() || "Sleep Lab"
  };

  const fileBase = buildSleepFileBase(input);
  const publicDir = path.join(process.cwd(), "public");
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
      preset,
      minutes,
      seed
    });

    const audioPath = path.join(tempDir, `${fileBase}.wav`);
    const audioBuffer = Buffer.from(await exportResult.blob.arrayBuffer());
    await writeFile(audioPath, audioBuffer);

    const thumbnailSvg = buildSleepThumbnailSvg(input);
    const thumbnailSvgPath = path.join(thumbnailDir, `${fileBase}.svg`);
    await writeFile(thumbnailSvgPath, thumbnailSvg, "utf8");

    const resvg = new Resvg(thumbnailSvg, {
      fitTo: {
        mode: "width",
        value: 1280
      }
    });
    const pngData = resvg.render();
    const thumbnailPngPath = path.join(thumbnailDir, `${fileBase}.png`);
    await writeFile(thumbnailPngPath, pngData.asPng());

    const outputVideoPath = path.join(videoDir, `${fileBase}.mp4`);
    await renderSleepVideo({
      ffmpegExecutable: ffmpegPath,
      releasePreset,
      durationSeconds: exportResult.durationSeconds,
      audioPath,
      thumbnailPngPath,
      outputVideoPath
    });

    const manifest = buildSleepRenderManifest(input);
    const manifestPath = path.join(manifestDir, `${fileBase}.json`);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    logAction("sleep-render.bundle_created", {
      fileBase,
      preset,
      releasePreset,
      minutes,
      mp4: `/api/generated-assets/generated-video/${fileBase}.mp4`,
      thumbnail: `/api/generated-assets/generated-thumbnails/${fileBase}.png`
    });

    return NextResponse.json({
      ok: true,
      videoUrl: `/api/generated-assets/generated-video/${fileBase}.mp4`,
      thumbnailUrl: `/api/generated-assets/generated-thumbnails/${fileBase}.png`,
      thumbnailSvgUrl: `/api/generated-assets/generated-thumbnails/${fileBase}.svg`,
      manifestUrl: `/api/generated-assets/generated-manifests/${fileBase}.json`,
      suggestedFilenameBase: fileBase
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sleep render failed.";
    return NextResponse.json({ error: message }, { status: 500 });
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
