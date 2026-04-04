import { createReadStream } from "node:fs";

import { google } from "googleapis";

import { recordLastUpload } from "@/lib/youtube-auth";
import {
  generateSleepRenderBundle,
  type SleepRenderRequestInput
} from "@/lib/sleep-render-bundle";

export async function uploadSleepBundleToYouTube(
  authClient: InstanceType<typeof google.auth.OAuth2>,
  input: SleepRenderRequestInput & { privacyStatus?: "private" | "unlisted" | "public" }
) {
  const bundle = await generateSleepRenderBundle(input);
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

  await youtube.thumbnails.set({
    videoId,
    media: {
      body: createReadStream(bundle.thumbnailFilePath)
    }
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
    lastUpload
  };
}
