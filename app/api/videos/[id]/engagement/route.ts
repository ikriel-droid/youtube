import { NextResponse } from "next/server";

import { incrementVideoLikes, incrementVideoViews } from "@/lib/library";
import { logAction } from "@/lib/logger";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  const body = (await request.json()) as { action?: string };

  if (body.action === "view") {
    const video = await incrementVideoViews(params.id);
    if (!video) {
      return NextResponse.json({ error: "That video could not be found." }, { status: 404 });
    }

    logAction("engagement.view", { videoId: params.id, views: video.views });

    return NextResponse.json({ ok: true, views: video.views });
  }

  if (body.action === "like") {
    const video = await incrementVideoLikes(params.id);
    if (!video) {
      return NextResponse.json({ error: "That video could not be found." }, { status: 404 });
    }

    logAction("engagement.like", { videoId: params.id, likes: video.likes });

    return NextResponse.json({ ok: true, likes: video.likes });
  }

  return NextResponse.json(
    { error: "Unknown engagement action. Use view or like." },
    { status: 400 }
  );
}
