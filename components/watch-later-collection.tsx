"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatDate, formatNumber } from "@/lib/format";
import type { VideoRecord } from "@/lib/types";
import { getVideoSource } from "@/lib/video-source";

interface WatchLaterCollectionProps {
  videos: VideoRecord[];
  title?: string;
  variant?: "rail" | "grid";
  emptyMessage?: string;
}

export function WatchLaterCollection({
  videos,
  title = "Watch later",
  variant = "rail",
  emptyMessage = "You have not saved any videos yet."
}: WatchLaterCollectionProps) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const videosById = useMemo(() => {
    return new Map(videos.map((video) => [video.id, video] as const));
  }, [videos]);

  useEffect(() => {
    const stored = JSON.parse(
      window.localStorage.getItem("localtube:watch-later") ?? "[]"
    ) as string[];
    setSavedIds(stored);
  }, []);

  const savedVideos = savedIds
    .map((id) => videosById.get(id))
    .filter((video): video is VideoRecord => Boolean(video));

  if (savedVideos.length === 0) {
    return variant === "rail" ? null : <section className="emptyState">{emptyMessage}</section>;
  }

  const containerClass = variant === "grid" ? "videoGrid" : "historyRail";

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>{title}</h2>
        <span>{savedVideos.length}</span>
      </div>
      <div className={containerClass}>
        {savedVideos.map((video) => {
          const source = getVideoSource(video.videoUrl, video.thumbnailUrl);

          return (
            <Link key={video.id} href={`/watch/${video.id}`} className="historyCard">
              <div className="historyThumb">
                {source.thumbnailUrl ? (
                  <div
                    className="videoThumbImage"
                    style={{ backgroundImage: `url(${source.thumbnailUrl})` }}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="videoThumbTop">
                  <span>{video.category}</span>
                  <span className="thumbSource">{source.label}</span>
                </div>
                <strong>{video.duration}</strong>
              </div>
              <div className="videoMeta">
                <h3>{video.title}</h3>
                <p>{video.channelName}</p>
                <small>
                  {formatNumber(video.views)} views | {formatDate(video.publishedAt)} |{" "}
                  {formatNumber(video.likes)} likes
                </small>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
