import { NextResponse } from "next/server";

import { suggestMetadata } from "@/lib/creator-ai";
import { getCategories } from "@/lib/library";
import type { Category } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const idea = body.idea?.trim();
  const channelName = body.channelName?.trim();
  const category = body.category?.trim() as Category | undefined;

  if (!idea) {
    return NextResponse.json({ error: "Add a video idea first." }, { status: 400 });
  }
  if (category && !getCategories().includes(category)) {
    return NextResponse.json({ error: "Choose a valid category before generating metadata." }, { status: 400 });
  }

  const suggestion = suggestMetadata({
    idea,
    category,
    channelName
  });

  return NextResponse.json({ ok: true, suggestion });
}
