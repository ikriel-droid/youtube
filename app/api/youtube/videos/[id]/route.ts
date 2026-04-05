import { NextResponse } from "next/server";

import { getAuthorizedOAuthClient, syncStoredUploadMetadata } from "@/lib/youtube-auth";
import { updateYouTubeVideoMetadata } from "@/lib/youtube-upload";

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: Params) {
  const authClient = await getAuthorizedOAuthClient();
  if (!authClient) {
    return NextResponse.json({ error: "Connect YouTube first." }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    tags?: string[];
    privacyStatus?: "private" | "unlisted" | "public";
  };

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  try {
    const result = await updateYouTubeVideoMetadata(authClient, {
      videoId: params.id,
      title,
      description: body.description,
      tags: body.tags,
      privacyStatus: body.privacyStatus
    });

    await syncStoredUploadMetadata({
      videoId: params.id,
      title: result.title,
      privacyStatus: result.privacyStatus
    });

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube metadata update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
