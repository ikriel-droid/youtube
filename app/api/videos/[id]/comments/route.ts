import { NextResponse } from "next/server";

import { addComment } from "@/lib/library";
import { logAction } from "@/lib/logger";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  const body = (await request.json()) as Record<string, string>;
  const author = body.author?.trim();
  const text = body.body?.trim();

  if (!author) {
    return NextResponse.json({ error: "Author name is required." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Comment text is required." }, { status: 400 });
  }
  if (text.length > 300) {
    return NextResponse.json({ error: "Comments must stay under 300 characters." }, { status: 400 });
  }

  const comment = await addComment(params.id, {
    author,
    body: text
  });

  if (!comment) {
    return NextResponse.json({ error: "That video no longer exists." }, { status: 404 });
  }

  logAction("comment.created", { videoId: params.id, author });

  return NextResponse.json({ ok: true, comment });
}
