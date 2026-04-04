export interface VideoSource {
  kind: "file" | "youtube" | "audio";
  playbackUrl: string;
  thumbnailUrl?: string;
  label: string;
}

export function getVideoSource(url: string, thumbnailOverride?: string): VideoSource {
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return {
      kind: "youtube",
      playbackUrl: `https://www.youtube.com/embed/${youtubeId}`,
      thumbnailUrl: thumbnailOverride?.trim() || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      label: "YouTube"
    };
  }

  if (isAudioFile(url)) {
    return {
      kind: "audio",
      playbackUrl: url,
      thumbnailUrl: thumbnailOverride?.trim() || undefined,
      label: "WAV"
    };
  }

  return {
    kind: "file",
    playbackUrl: url,
    thumbnailUrl: thumbnailOverride?.trim() || undefined,
    label: "MP4"
  };
}

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const candidate = parsed.pathname.split("/").filter(Boolean)[0];
      return normalizeVideoId(candidate);
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return normalizeVideoId(parsed.searchParams.get("v"));
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        return normalizeVideoId(parsed.pathname.split("/")[2] ?? null);
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return normalizeVideoId(parsed.pathname.split("/")[2] ?? null);
      }
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeVideoId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function isAudioFile(url: string) {
  return /\.wav($|\?)/i.test(url) || /\.mp3($|\?)/i.test(url) || url.includes("/generated-audio/");
}
