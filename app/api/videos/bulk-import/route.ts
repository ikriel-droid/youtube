import { NextResponse } from "next/server";

import { bulkImportVideos, getCategories, getPublishStates } from "@/lib/library";
import { logAction } from "@/lib/logger";
import type { Category, PublishState } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const categories = new Set(getCategories());
  const publishStates = new Set(getPublishStates());

  const channelName = body.channelName?.trim();
  const channelSlug = body.channelSlug?.trim().toLowerCase();
  const category = body.category?.trim() as Category | undefined;
  const duration = body.duration?.trim() || "04:00";
  const status = body.status?.trim() as PublishState | undefined;
  const tags = body.tags
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const urls = (body.urls ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!channelName || !channelSlug) {
    return NextResponse.json(
      { error: "Channel name and slug are required for bulk import." },
      { status: 400 }
    );
  }
  if (!category || !categories.has(category)) {
    return NextResponse.json({ error: "Pick a valid category first." }, { status: 400 });
  }
  if (status && !publishStates.has(status)) {
    return NextResponse.json({ error: "Status must be draft or published." }, { status: 400 });
  }
  if (urls.length === 0) {
    return NextResponse.json({ error: "Paste at least one video URL to import." }, { status: 400 });
  }

  const result = await bulkImportVideos({
    channelName,
    channelSlug,
    category,
    duration,
    status,
    tags,
    urls
  });

  logAction("video.bulk_imported", {
    channelSlug,
    imported: result.imported.length,
    duplicates: result.duplicates.length
  });

  return NextResponse.json({
    ok: true,
    importedCount: result.imported.length,
    duplicateCount: result.duplicates.length,
    duplicates: result.duplicates,
    videos: result.imported
  });
}
