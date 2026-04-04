import { NextResponse } from "next/server";

import {
  deleteVideo,
  findDuplicateVideoByUrl,
  getCategories,
  getPublishStates,
  updateVideo
} from "@/lib/library";
import { logAction } from "@/lib/logger";
import type { Category, PublishState } from "@/lib/types";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const body = (await request.json()) as Record<string, string>;
  const categories = new Set(getCategories());
  const publishStates = new Set(getPublishStates());

  const title = body.title?.trim();
  const description = body.description?.trim();
  const channelName = body.channelName?.trim();
  const channelSlug = body.channelSlug?.trim().toLowerCase();
  const category = body.category?.trim() as Category | undefined;
  const duration = body.duration?.trim();
  const videoUrl = body.videoUrl?.trim();
  const thumbnailUrl = body.thumbnailUrl?.trim();
  const status = body.status?.trim() as PublishState | undefined;
  const tags = body.tags
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  }
  if (!channelName) {
    return NextResponse.json({ error: "Channel name is required." }, { status: 400 });
  }
  if (!channelSlug) {
    return NextResponse.json({ error: "Channel slug is required." }, { status: 400 });
  }
  if (!category || !categories.has(category)) {
    return NextResponse.json({ error: "Pick a valid category." }, { status: 400 });
  }
  if (!duration) {
    return NextResponse.json({ error: "Duration is required." }, { status: 400 });
  }
  if (!videoUrl) {
    return NextResponse.json({ error: "A public video URL is required." }, { status: 400 });
  }
  if (status && !publishStates.has(status)) {
    return NextResponse.json({ error: "Status must be draft or published." }, { status: 400 });
  }

  const duplicate = await findDuplicateVideoByUrl(videoUrl, { excludeVideoId: params.id });
  if (duplicate) {
    return NextResponse.json(
      { error: `That video link is already used by "${duplicate.title}".` },
      { status: 409 }
    );
  }

  const video = await updateVideo(params.id, {
    title,
    description,
    channelName,
    channelSlug,
    category,
    duration,
    videoUrl,
    thumbnailUrl: thumbnailUrl || undefined,
    tags,
    status
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  logAction("video.updated", {
    videoId: video.id,
    status: video.status,
    channelSlug: video.channelSlug
  });

  return NextResponse.json({ ok: true, video });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const deleted = await deleteVideo(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  logAction("video.deleted", { videoId: params.id });

  return NextResponse.json({ ok: true });
}
