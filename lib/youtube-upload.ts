import { createReadStream } from "node:fs";
import { mkdtemp, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { google } from "googleapis";
import ffmpegPath from "ffmpeg-static";

import { recordLastUpload } from "@/lib/youtube-auth";
import {
  generateSleepRenderBundle,
  verifyRenderedSleepBundle,
  type SleepRenderRequestInput
} from "@/lib/sleep-render-bundle";

export async function uploadSleepBundleToYouTube(
  authClient: InstanceType<typeof google.auth.OAuth2>,
  input: SleepRenderRequestInput & { privacyStatus?: "private" | "unlisted" | "public" }
) {
  const bundle = await generateSleepRenderBundle(input);
  const verification = await verifyRenderedSleepBundle({
    bundle,
    expectedDurationSeconds: input.minutes * 60
  });
  const youtube = google.youtube({
    version: "v3",
    auth: authClient
  });

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    notifySubscribers: false,
    requestBody: {
      snippet: {
        title: bundle.manifest.title,
        description: bundle.manifest.description,
        tags: bundle.manifest.tags,
        categoryId: "10"
      },
      status: {
        privacyStatus: input.privacyStatus ?? "private"
      }
    },
    media: {
      body: createReadStream(bundle.videoFilePath)
    }
  });

  const videoId = response.data.id;
  if (!videoId) {
    throw new Error("YouTube upload did not return a video id.");
  }

  await setYouTubeThumbnailFromPath(authClient, {
    videoId,
    thumbnailFilePath: bundle.thumbnailFilePath
  });

  const lastUpload = await recordLastUpload({
    videoId,
    title: bundle.manifest.title,
    privacyStatus: input.privacyStatus ?? "private"
  });

  return {
    videoId,
    youtubeWatchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    youtubeStudioUrl: `https://studio.youtube.com/video/${videoId}/edit`,
    thumbnailUrl: bundle.thumbnailUrl,
    manifestUrl: bundle.manifestUrl,
    lastUpload,
    verification
  };
}

export async function setYouTubeThumbnailFromPath(
  authClient: InstanceType<typeof google.auth.OAuth2>,
  input: {
    videoId: string;
    thumbnailFilePath: string;
  }
) {
  const youtube = google.youtube({
    version: "v3",
    auth: authClient
  });

  const thumbnailPathForUpload = await prepareThumbnailForYouTubeUpload(input.thumbnailFilePath);
  await youtube.thumbnails.set({
    videoId: input.videoId,
    media: {
      body: createReadStream(thumbnailPathForUpload)
    }
  });

  return {
    videoId: input.videoId,
    thumbnailFilePath: input.thumbnailFilePath
  };
}

async function prepareThumbnailForYouTubeUpload(thumbnailFilePath: string) {
  const thumbnailStat = await stat(thumbnailFilePath);
  if (thumbnailStat.size <= 2_000_000) {
    return thumbnailFilePath;
  }

  if (!ffmpegPath) {
    throw new Error("Thumbnail is too large for YouTube and ffmpeg-static is unavailable for compression.");
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "localtube-youtube-thumb-"));
  const outputPath = path.join(tempDir, `${path.parse(thumbnailFilePath).name}-youtube.jpg`);

  await runProcess(ffmpegPath, [
    "-y",
    "-i",
    thumbnailFilePath,
    "-vf",
    "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
    "-q:v",
    "4",
    outputPath
  ]);

  const outputStat = await stat(outputPath);
  if (outputStat.size > 2_000_000) {
    throw new Error("Compressed thumbnail is still too large for YouTube.");
  }

  return outputPath;
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

export async function updateYouTubeVideoMetadata(
  authClient: InstanceType<typeof google.auth.OAuth2>,
  input: {
    videoId: string;
    title: string;
    description?: string;
    tags?: string[];
    privacyStatus?: "private" | "unlisted" | "public";
  }
) {
  const youtube = google.youtube({
    version: "v3",
    auth: authClient
  });

  const detail = await youtube.videos.list({
    part: ["snippet", "status"],
    id: [input.videoId]
  });

  const item = detail.data.items?.[0];
  if (!item?.snippet) {
    throw new Error("Target YouTube video could not be found.");
  }

  const response = await youtube.videos.update({
    part: ["snippet", "status"],
    requestBody: {
      id: input.videoId,
      snippet: {
        title: input.title,
        description: input.description ?? item.snippet.description ?? "",
        tags: input.tags ?? item.snippet.tags ?? [],
        categoryId: item.snippet.categoryId ?? "10"
      },
      status: {
        privacyStatus: input.privacyStatus ?? item.status?.privacyStatus ?? "public"
      }
    }
  });

  return {
    videoId: input.videoId,
    title: response.data.snippet?.title ?? input.title,
    privacyStatus: response.data.status?.privacyStatus ?? item.status?.privacyStatus ?? "unknown",
    youtubeWatchUrl: `https://www.youtube.com/watch?v=${input.videoId}`,
    youtubeStudioUrl: `https://studio.youtube.com/video/${input.videoId}/edit`
  };
}
