import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  addImportedFootageRecord,
  listImportedFootageRecords
} from "@/lib/imported-footage-library";
import { logAction } from "@/lib/logger";

export async function GET() {
  const records = await listImportedFootageRecords();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const title = formData.get("title")?.toString().trim();
  const sourceName = formData.get("sourceName")?.toString().trim();
  const licenseNote = formData.get("licenseNote")?.toString().trim();
  const tags = formData
    .get("tags")
    ?.toString()
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10) ?? [];

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pick a footage file first." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!sourceName) {
    return NextResponse.json({ error: "Source name is required." }, { status: 400 });
  }
  if (!licenseNote) {
    return NextResponse.json({ error: "License note is required." }, { status: 400 });
  }

  const extension = getSupportedFootageExtension(file);
  if (!extension) {
    return NextResponse.json(
      { error: "Only webm, mp4, and mov footage files are supported right now." },
      { status: 400 }
    );
  }

  const fileBase = `${normalizeSlug(title)}-${Date.now()}`;
  const fileName = `${fileBase}.${extension}`;
  const relativeUrl = `/api/generated-assets/imported-footage/${fileName}`;
  const publicDir = process.env.LOCALTUBE_PUBLIC_DIR?.trim()
    ? path.resolve(process.cwd(), process.env.LOCALTUBE_PUBLIC_DIR)
    : path.join(process.cwd(), "public");
  const footageDir = path.join(publicDir, "imported-footage");
  await mkdir(footageDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(footageDir, fileName), buffer);

  const record = await addImportedFootageRecord({
    title,
    sourceName,
    licenseNote,
    tags,
    fileUrl: relativeUrl,
    fileName
  });

  logAction("sleep-footage.imported", {
    importedFootageId: record.id,
    sourceName,
    fileName
  });

  return NextResponse.json({
    ok: true,
    record
  });
}

function getSupportedFootageExtension(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".webm") || file.type === "video/webm") {
    return "webm";
  }
  if (name.endsWith(".mp4") || file.type === "video/mp4") {
    return "mp4";
  }
  if (name.endsWith(".mov") || file.type === "video/quicktime") {
    return "mov";
  }
  return null;
}

function normalizeSlug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "sleep-footage"
  );
}
