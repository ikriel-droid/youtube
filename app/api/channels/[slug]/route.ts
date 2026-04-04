import { NextResponse } from "next/server";

import { getCategories, getChannelProfile, updateChannelProfile } from "@/lib/library";
import { logAction } from "@/lib/logger";
import type { Category } from "@/lib/types";

interface RouteContext {
  params: {
    slug: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const channel = await getChannelProfile(params.slug);
  if (!channel) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
  }

  return NextResponse.json({ channel });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const body = (await request.json()) as Record<string, string>;
  const categories = new Set(getCategories());

  const name = body.name?.trim();
  const category = body.category?.trim() as Category | undefined;
  const tagline = body.tagline?.trim();
  const about = body.about?.trim();
  const avatarText = body.avatarText?.trim().toUpperCase();
  const accentColor = body.accentColor?.trim();

  if (!name) {
    return NextResponse.json({ error: "Channel name is required." }, { status: 400 });
  }
  if (!category || !categories.has(category)) {
    return NextResponse.json({ error: "Pick a valid channel category." }, { status: 400 });
  }
  if (!tagline) {
    return NextResponse.json({ error: "Tagline is required." }, { status: 400 });
  }
  if (!about) {
    return NextResponse.json({ error: "About text is required." }, { status: 400 });
  }
  if (!avatarText) {
    return NextResponse.json({ error: "Avatar text is required." }, { status: 400 });
  }
  if (!accentColor || !/^#?[0-9a-fA-F]{6}$/.test(accentColor)) {
    return NextResponse.json({ error: "Accent color must be a 6-digit hex value." }, { status: 400 });
  }

  const channel = await updateChannelProfile(params.slug, {
    name,
    category,
    tagline,
    about,
    avatarText: avatarText.slice(0, 2),
    accentColor: accentColor.startsWith("#") ? accentColor : `#${accentColor}`
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
  }

  logAction("channel.updated", { slug: channel.slug, category: channel.category });

  return NextResponse.json({ ok: true, channel });
}
