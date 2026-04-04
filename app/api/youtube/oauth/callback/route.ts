import { NextResponse } from "next/server";

import { exchangeCodeForToken, getYouTubeOAuthConfig } from "@/lib/youtube-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? undefined;
  const error = url.searchParams.get("error");
  const baseUrl = getYouTubeOAuthConfig().baseUrl;

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/studio/youtube?status=oauth_error&message=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/studio/youtube?status=oauth_error&message=${encodeURIComponent("Missing authorization code.")}`
    );
  }

  try {
    await exchangeCodeForToken(code, state);
    return NextResponse.redirect(`${baseUrl}/studio/youtube?status=connected`);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Google OAuth callback failed.";
    return NextResponse.redirect(
      `${baseUrl}/studio/youtube?status=oauth_error&message=${encodeURIComponent(message)}`
    );
  }
}
