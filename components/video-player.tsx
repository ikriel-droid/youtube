"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDate, formatNumber } from "@/lib/format";
import type { VideoRecord } from "@/lib/types";
import { getVideoSource } from "@/lib/video-source";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => unknown;
      PlayerState?: {
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface VideoPlayerProps {
  video: VideoRecord;
  nextVideo?: {
    id: string;
    title: string;
  };
}

export function VideoPlayer({ video, nextVideo }: VideoPlayerProps) {
  const source = getVideoSource(video.videoUrl, video.thumbnailUrl);
  const router = useRouter();
  const [autoplayNext, setAutoplayNext] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const playerId = useMemo(() => `yt-player-${video.id}`, [video.id]);

  useEffect(() => {
    const stored = window.localStorage.getItem("localtube:autoplay-next");
    setAutoplayNext(stored === "1");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("localtube:autoplay-next", autoplayNext ? "1" : "0");
  }, [autoplayNext]);

  useEffect(() => {
    if (countdown === null) {
      return;
    }

    if (countdown <= 0) {
      if (nextVideo) {
        router.push(`/watch/${nextVideo.id}`);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, nextVideo, router]);

  useEffect(() => {
    setCountdown(null);
  }, [video.id]);

  useEffect(() => {
    if (source.kind !== "youtube") {
      return;
    }

    const youtubeId = extractEmbedVideoId(source.playbackUrl);
    if (!youtubeId) {
      return;
    }

    let cancelled = false;
    let initialized = false;

    const handleEnded = () => {
      if (!autoplayNext || !nextVideo) {
        return;
      }
      setCountdown(5);
    };

    const initPlayer = () => {
      if (cancelled || initialized || !window.YT?.Player) {
        return;
      }

      initialized = true;
      new window.YT.Player(playerId, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          playsinline: 1
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState?.ENDED) {
              handleEnded();
            }
          }
        }
      });
    };

    if (window.YT?.Player) {
      initPlayer();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      initPlayer();
    };

    return () => {
      cancelled = true;
    };
  }, [autoplayNext, nextVideo, playerId, source.kind, source.playbackUrl]);

  function handleNativeEnded() {
    if (!autoplayNext || !nextVideo) {
      return;
    }

    setCountdown(5);
  }

  return (
    <section className="playerCard">
      {source.kind === "youtube" ? (
        <div className="videoSurface youtubeFrameWrap">
          <div id={playerId} className="youtubeSurface" />
        </div>
      ) : source.kind === "audio" ? (
        <div className="audioPlayerSurface">
          <div className="audioBackdrop" aria-hidden="true" />
          <div className="audioPlayerInner">
            <span className="pill">sleep audio</span>
            <h2>{video.title}</h2>
            <p className="description">
              This LocalTube entry is an audio-first track. Use it as a sleep-music bed or export source.
            </p>
            <audio className="audioSurface" controls preload="metadata" src={source.playbackUrl} onEnded={handleNativeEnded} />
          </div>
        </div>
      ) : (
        <video
          className="videoSurface"
          controls
          preload="metadata"
          src={source.playbackUrl}
          onEnded={handleNativeEnded}
        />
      )}
      <div className="playerMeta">
        <div className="metaPills">
          <span className="pill">{video.category}</span>
          <span className="sourcePill">{source.label}</span>
          <span className="sourcePill">{video.status}</span>
        </div>
        <h1>{video.title}</h1>
        <p className="metaLine">
          {video.channelName} | {formatNumber(video.views)} views | {formatDate(video.publishedAt)}
        </p>
        <p className="description">{video.description}</p>

        {nextVideo ? (
          <div className="autoplayPanel">
            <label className="autoplayToggle">
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(event) => setAutoplayNext(event.target.checked)}
              />
              <span>Autoplay next video</span>
            </label>
            <p className="statusText">
              Next up: {nextVideo.title}
              {countdown !== null ? ` | moving in ${countdown}s` : ""}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function extractEmbedVideoId(url: string) {
  const parts = url.split("/embed/");
  if (parts.length < 2) {
    return null;
  }

  return parts[1]?.split("?")[0] ?? null;
}
