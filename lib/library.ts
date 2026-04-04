import { promises as fs } from "fs";
import path from "path";

import type {
  Category,
  ChannelProfile,
  CommentRecord,
  LibraryRecord,
  PublishState,
  VideoRecord
} from "./types";

const defaultDataFile = path.join(process.cwd(), "data", "library.json");
const seedDataFile = path.join(process.cwd(), "data", "library.seed.json");

const accentByCategory: Record<Category, string> = {
  finance: "#2563eb",
  ai: "#0f766e",
  vision: "#7c3aed",
  baseball: "#b91c1c",
  football: "#15803d",
  creator: "#be185d",
  sleep: "#4f46e5"
};

export function getDataFilePath() {
  const configured = process.env.LOCALTUBE_DATA_FILE?.trim();
  if (!configured) {
    return defaultDataFile;
  }

  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export async function readLibrary(): Promise<LibraryRecord> {
  await ensureLibraryFileExists();
  const raw = await fs.readFile(getDataFilePath(), "utf8");
  const parsed = JSON.parse(raw) as Partial<LibraryRecord>;
  return normalizeLibrary(parsed);
}

export async function writeLibrary(library: LibraryRecord): Promise<void> {
  const normalized = normalizeLibrary(library);
  await fs.writeFile(getDataFilePath(), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

export async function resetLibraryFromSeed(): Promise<LibraryRecord> {
  const seedRaw = await fs.readFile(seedDataFile, "utf8");
  await fs.writeFile(getDataFilePath(), seedRaw, "utf8");
  return readLibrary();
}

export async function listVideos(options?: { includeDrafts?: boolean }): Promise<VideoRecord[]> {
  const library = await readLibrary();
  const includeDrafts = options?.includeDrafts ?? false;

  return [...library.videos]
    .filter((video) => includeDrafts || video.status === "published")
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}

export async function getVideo(
  videoId: string,
  options?: { includeDrafts?: boolean }
): Promise<VideoRecord | undefined> {
  const videos = await listVideos({ includeDrafts: options?.includeDrafts ?? true });
  return videos.find((video) => video.id === videoId);
}

export async function getRelatedVideos(video: VideoRecord): Promise<VideoRecord[]> {
  const videos = await listVideos();
  return videos
    .filter((candidate) => candidate.id !== video.id)
    .sort((left, right) => scoreRelatedVideo(right, video) - scoreRelatedVideo(left, video))
    .slice(0, 4);
}

export async function getChannelVideos(
  channelSlug: string,
  options?: { includeDrafts?: boolean }
): Promise<VideoRecord[]> {
  const videos = await listVideos({ includeDrafts: options?.includeDrafts ?? false });
  return videos.filter((video) => video.channelSlug === channelSlug);
}

export async function listChannelProfiles(): Promise<ChannelProfile[]> {
  const library = await readLibrary();
  return [...library.channels].sort((left, right) => left.name.localeCompare(right.name));
}

export async function getChannelProfile(channelSlug: string): Promise<ChannelProfile | undefined> {
  const profiles = await listChannelProfiles();
  return profiles.find((profile) => profile.slug === channelSlug);
}

export async function updateChannelProfile(
  channelSlug: string,
  input: Pick<ChannelProfile, "name" | "category" | "tagline" | "about" | "avatarText" | "accentColor">
): Promise<ChannelProfile | undefined> {
  const library = await readLibrary();
  const channel = library.channels.find((profile) => profile.slug === channelSlug);
  if (!channel) {
    return undefined;
  }

  channel.name = input.name;
  channel.category = input.category;
  channel.tagline = input.tagline;
  channel.about = input.about;
  channel.avatarText = input.avatarText;
  channel.accentColor = input.accentColor;

  for (const video of library.videos) {
    if (video.channelSlug === channelSlug) {
      video.channelName = input.name;
    }
  }

  await writeLibrary(library);
  return library.channels.find((profile) => profile.slug === channelSlug);
}

export async function incrementVideoViews(videoId: string): Promise<VideoRecord | undefined> {
  const library = await readLibrary();
  const video = library.videos.find((candidate) => candidate.id === videoId);
  if (!video) {
    return undefined;
  }

  video.views += 1;
  await writeLibrary(library);
  return video;
}

export async function incrementVideoLikes(videoId: string): Promise<VideoRecord | undefined> {
  const library = await readLibrary();
  const video = library.videos.find((candidate) => candidate.id === videoId);
  if (!video) {
    return undefined;
  }

  video.likes += 1;
  await writeLibrary(library);
  return video;
}

export function getCategories(): Category[] {
  return ["finance", "ai", "vision", "baseball", "football", "creator", "sleep"];
}

export function getPublishStates(): PublishState[] {
  return ["draft", "published"];
}

export function filterVideos(
  videos: VideoRecord[],
  search: string,
  category: string,
  tag = ""
): VideoRecord[] {
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedTag = tag.trim().toLowerCase();

  return videos.filter((video) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${video.title} ${video.description} ${video.channelName} ${video.tags.join(" ")}`.toLowerCase().includes(
        normalizedSearch
      );
    const matchesCategory = category.length === 0 || video.category === category;
    const matchesTag =
      normalizedTag.length === 0 ||
      video.tags.some((item) => item.toLowerCase().includes(normalizedTag));

    return matchesSearch && matchesCategory && matchesTag;
  });
}

export function getAllTags(videos: VideoRecord[]) {
  return [...new Set(videos.flatMap((video) => video.tags))].sort((left, right) =>
    left.localeCompare(right)
  );
}

export async function findDuplicateVideoByUrl(
  videoUrl: string,
  options?: { excludeVideoId?: string }
): Promise<VideoRecord | undefined> {
  const library = await readLibrary();
  const normalizedUrl = normalizeVideoUrl(videoUrl);

  return library.videos.find((video) => {
    if (options?.excludeVideoId && video.id === options.excludeVideoId) {
      return false;
    }

    return normalizeVideoUrl(video.videoUrl) === normalizedUrl;
  });
}

export async function addVideo(input: {
  title: string;
  description: string;
  channelName: string;
  channelSlug: string;
  category: Category;
  duration: string;
  videoUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  status?: PublishState;
}): Promise<VideoRecord> {
  const library = await readLibrary();
  const video = buildVideoRecord(input);
  library.videos.unshift(video);
  syncChannelProfileForVideo(library, video);
  await writeLibrary(library);
  return video;
}

export async function bulkImportVideos(input: {
  channelName: string;
  channelSlug: string;
  category: Category;
  duration: string;
  urls: string[];
  tags?: string[];
  status?: PublishState;
}): Promise<{ imported: VideoRecord[]; duplicates: string[] }> {
  const library = await readLibrary();
  const imported: VideoRecord[] = [];
  const duplicates: string[] = [];
  const knownUrls = new Set(library.videos.map((video) => normalizeVideoUrl(video.videoUrl)));

  input.urls.forEach((url, index) => {
    const normalizedUrl = normalizeVideoUrl(url);
    if (!normalizedUrl || knownUrls.has(normalizedUrl)) {
      duplicates.push(url);
      return;
    }

    knownUrls.add(normalizedUrl);
    const title = buildImportedTitle(url, index + 1, input.category);
    const video = buildVideoRecord({
      title,
      description: `Imported into LocalTube from an external video link for ${input.channelName}.`,
      channelName: input.channelName,
      channelSlug: input.channelSlug,
      category: input.category,
      duration: input.duration,
      videoUrl: url,
      tags: input.tags,
      status: input.status
    });

    imported.push(video);
    library.videos.unshift(video);
    syncChannelProfileForVideo(library, video);
  });

  await writeLibrary(library);
  return { imported, duplicates };
}

export async function addComment(
  videoId: string,
  input: { author: string; body: string }
): Promise<CommentRecord | undefined> {
  const library = await readLibrary();
  const video = library.videos.find((candidate) => candidate.id === videoId);
  if (!video) {
    return undefined;
  }

  const comment: CommentRecord = {
    id: `comment-${Date.now()}`,
    author: input.author,
    body: input.body,
    createdAt: new Date().toISOString()
  };

  video.comments.unshift(comment);
  await writeLibrary(library);
  return comment;
}

export async function updateVideo(
  videoId: string,
  input: {
    title: string;
    description: string;
    channelName: string;
    channelSlug: string;
    category: Category;
    duration: string;
    videoUrl: string;
    thumbnailUrl?: string;
    tags?: string[];
    status?: PublishState;
  }
): Promise<VideoRecord | undefined> {
  const library = await readLibrary();
  const video = library.videos.find((candidate) => candidate.id === videoId);
  if (!video) {
    return undefined;
  }

  video.title = input.title;
  video.description = input.description;
  video.channelName = input.channelName;
  video.channelSlug = input.channelSlug;
  video.category = input.category;
  video.duration = input.duration;
  video.videoUrl = input.videoUrl;
  video.thumbnailUrl = input.thumbnailUrl;
  video.tags = normalizeTags(input.tags);
  video.status = input.status ?? "published";

  syncChannelProfileForVideo(library, video);
  await writeLibrary(library);
  return video;
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  const library = await readLibrary();
  const originalLength = library.videos.length;
  library.videos = library.videos.filter((candidate) => candidate.id !== videoId);
  if (library.videos.length === originalLength) {
    return false;
  }

  library.channels = buildChannelProfiles(library.videos, library.channels);
  await writeLibrary(library);
  return true;
}

function normalizeLibrary(library: Partial<LibraryRecord>): LibraryRecord {
  const rawVideos = Array.isArray(library.videos) ? library.videos : [];
  const videos = rawVideos.map((video) => normalizeVideo(video));
  const channels = buildChannelProfiles(videos, Array.isArray(library.channels) ? library.channels : []);

  return {
    videos,
    channels
  };
}

function normalizeVideo(video: Partial<VideoRecord>): VideoRecord {
  const category = getCategories().includes(video.category as Category)
    ? (video.category as Category)
    : "creator";
  const status = getPublishStates().includes(video.status as PublishState)
    ? (video.status as PublishState)
    : "published";
  const title = video.title?.trim() || "Untitled video";
  const description = video.description?.trim() || "No description yet.";
  const channelName = video.channelName?.trim() || "LocalTube Channel";
  const channelSlug = normalizeChannelSlug(video.channelSlug || channelName);
  const normalized: VideoRecord = {
    id: video.id?.trim() || `vid-${Date.now()}`,
    title,
    description,
    channelSlug,
    channelName,
    category,
    views: Number.isFinite(video.views) ? Number(video.views) : 0,
    likes: Number.isFinite(video.likes) ? Number(video.likes) : 0,
    duration: video.duration?.trim() || "05:00",
    publishedAt: video.publishedAt || new Date().toISOString(),
    videoUrl: video.videoUrl?.trim() || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: video.thumbnailUrl?.trim() || undefined,
    tags: normalizeTags(video.tags, { fallbackVideo: { title, description, category, channelName } }),
    status,
    comments: Array.isArray(video.comments)
      ? video.comments.map((comment) => ({
          id: comment.id?.trim() || `comment-${Date.now()}`,
          author: comment.author?.trim() || "Anonymous",
          body: comment.body?.trim() || "",
          createdAt: comment.createdAt || new Date().toISOString()
        }))
      : []
  };

  return normalized;
}

function buildChannelProfiles(
  videos: VideoRecord[],
  existingProfiles: ChannelProfile[]
): ChannelProfile[] {
  const profileMap = new Map(existingProfiles.map((profile) => [profile.slug, profile]));
  const grouped = new Map<string, VideoRecord[]>();

  for (const video of videos) {
    const current = grouped.get(video.channelSlug) ?? [];
    current.push(video);
    grouped.set(video.channelSlug, current);
  }

  return [...grouped.entries()]
    .map(([slug, channelVideos]) => {
      const latestVideo = [...channelVideos].sort(
        (left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt)
      )[0];
      const existing = profileMap.get(slug);

      return {
        slug,
        name: existing?.name || latestVideo.channelName,
        category: existing?.category || latestVideo.category,
        tagline: existing?.tagline || defaultChannelTagline(latestVideo),
        about: existing?.about || defaultChannelAbout(latestVideo, channelVideos.length),
        avatarText: existing?.avatarText || buildAvatarText(latestVideo.channelName),
        accentColor: existing?.accentColor || accentByCategory[latestVideo.category]
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function syncChannelProfileForVideo(library: LibraryRecord, video: VideoRecord) {
  library.channels = buildChannelProfiles(library.videos, library.channels);
  const profile = library.channels.find((item) => item.slug === video.channelSlug);
  if (profile) {
    video.channelName = profile.name;
  }
}

function buildVideoRecord(input: {
  title: string;
  description: string;
  channelName: string;
  channelSlug: string;
  category: Category;
  duration: string;
  videoUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  status?: PublishState;
}): VideoRecord {
  return {
    id: `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: input.title,
    description: input.description,
    channelName: input.channelName,
    channelSlug: normalizeChannelSlug(input.channelSlug),
    category: input.category,
    duration: input.duration,
    videoUrl: input.videoUrl,
    thumbnailUrl: input.thumbnailUrl,
    tags: normalizeTags(input.tags, {
      fallbackVideo: {
        title: input.title,
        description: input.description,
        category: input.category,
        channelName: input.channelName
      }
    }),
    status: input.status ?? "published",
    views: 0,
    likes: 0,
    publishedAt: new Date().toISOString(),
    comments: []
  };
}

function normalizeTags(
  value: string[] | undefined,
  options?: {
    fallbackVideo?: Pick<VideoRecord, "title" | "description" | "category" | "channelName">;
  }
) {
  const tags = (value ?? [])
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  if (tags.length > 0) {
    return [...new Set(tags)];
  }

  if (!options?.fallbackVideo) {
    return [];
  }

  return deriveDefaultTags(options.fallbackVideo);
}

function deriveDefaultTags(video: Pick<VideoRecord, "title" | "description" | "category" | "channelName">) {
  const tokens = `${video.category} ${video.channelName} ${video.title} ${video.description}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);

  return [...new Set([video.category, ...tokens.slice(0, 4)])].slice(0, 6);
}

function defaultChannelTagline(video: VideoRecord) {
  return `${capitalize(video.category)} ideas, smarter packaging, and repeatable publishing.`;
}

function defaultChannelAbout(video: VideoRecord, count: number) {
  return `${video.channelName} is a LocalTube channel focused on ${video.category} analysis, creator workflows, and publishable ideas. ${count} videos are currently live in the local library.`;
}

function buildAvatarText(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function scoreRelatedVideo(candidate: VideoRecord, base: VideoRecord) {
  const sameCategoryScore = candidate.category === base.category ? 10 : 0;
  const sameChannelScore = candidate.channelSlug === base.channelSlug ? 4 : 0;
  const sharedTagScore = overlapCount(candidate.tags, base.tags) * 6;
  const keywordScore = overlapCount(buildSearchTokens(candidate), buildSearchTokens(base)) * 2;
  const popularityScore = Math.log10(candidate.views + candidate.likes * 3 + 10);

  return sameCategoryScore + sameChannelScore + sharedTagScore + keywordScore + popularityScore;
}

function buildSearchTokens(video: Pick<VideoRecord, "title" | "description" | "channelName" | "tags">) {
  return `${video.title} ${video.description} ${video.channelName} ${video.tags.join(" ")}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);
}

function overlapCount(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

function normalizeChannelSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "") || "localtube-channel";
}

function capitalize(value: string) {
  return value[0]?.toUpperCase() + value.slice(1);
}

function buildImportedTitle(url: string, index: number, category: Category) {
  const titleSeed = normalizeVideoUrl(url).split("/").pop()?.replace(/[-_]/g, " ") || `clip ${index}`;
  return `${capitalize(category)} import: ${titleSeed.slice(0, 48)}`;
}

export function normalizeVideoUrl(value: string) {
  const raw = value.trim();
  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    url.hash = "";

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/watch")) {
        const videoId = url.searchParams.get("v");
        return videoId ? `youtube:${videoId}` : url.toString();
      }

      if (url.pathname.startsWith("/shorts/")) {
        return `youtube:${url.pathname.split("/shorts/")[1]?.split("/")[0] ?? ""}`;
      }
    }

    if (url.hostname === "youtu.be") {
      return `youtube:${url.pathname.replace("/", "")}`;
    }

    return url.toString();
  } catch {
    return raw.toLowerCase();
  }
}

async function ensureLibraryFileExists() {
  const dataFile = getDataFilePath();
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    const seedRaw = await fs.readFile(seedDataFile, "utf8");
    await fs.writeFile(dataFile, seedRaw, "utf8");
  }
}
