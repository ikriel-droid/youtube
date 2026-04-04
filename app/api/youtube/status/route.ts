import { NextResponse } from "next/server";

import { getYouTubeStatus, readUploadHistory } from "@/lib/youtube-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [status, uploadHistory] = await Promise.all([getYouTubeStatus(), readUploadHistory()]);
  return NextResponse.json({
    ...status,
    uploadHistory
  });
}
