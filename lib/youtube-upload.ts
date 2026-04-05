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
