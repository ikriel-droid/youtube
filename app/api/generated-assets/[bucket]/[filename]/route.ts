import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const allowedBuckets = new Set(["generated-audio", "generated-video", "generated-thumbnails", "generated-manifests"]);

export async function GET(
  _request: Request,
  { params }: { params: { bucket: string; filename: string } }
) {
  const bucket = params.bucket;
  const filename = params.filename;

  if (!allowedBuckets.has(bucket) || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", bucket, filename);

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "content-type": getContentType(filename),
        "cache-control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }
}

function getContentType(filename: string) {
  if (filename.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (filename.endsWith(".wav")) {
    return "audio/wav";
  }
  if (filename.endsWith(".png")) {
    return "image/png";
  }
  if (filename.endsWith(".svg")) {
    return "image/svg+xml";
  }
  if (filename.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  return "application/octet-stream";
}
