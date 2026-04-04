import { NextResponse } from "next/server";

import { createAuthUrl, getYouTubeOAuthConfig } from "@/lib/youtube-auth";

export async function GET() {
  try {
    const url = await createAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth could not start.";
    const baseUrl = getYouTubeOAuthConfig().baseUrl;
    return NextResponse.redirect(`${baseUrl}/studio/youtube?status=oauth_error&message=${encodeURIComponent(message)}`);
  }
}
