"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatDate, formatNumber } from "@/lib/format";
import type { VideoRecord } from "@/lib/types";
import { getVideoSource } from "@/lib/video-source";

export function WatchHistoryStrip({ videos }: { videos: VideoRecord[] }) {
  const [historyIds, setHistoryIds] = useState<string[]>([]);

  const videosById = useMemo(() => {
    return new Map(videos.map((video) => [video.id, video] as const));
  }, [videos]);

  useEffect(() => {
    const stored = JSON.parse(
      window.localStorage.getItem("localtube:watch-history") ?? "[]"
    ) as string[];
    setHistoryIds(stored);
  }, []);

  const recentVideos = historyIds
    .map((id) => videosById.get(id))
    .filter((video): video is VideoRecord => Boolean(video));

  if (recentVideos.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Recently watched</h2>
        <span>{recentVideos.length}</span>
      </div>
      <div className="historyRail">
        {recentVideos.map((video) => {
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
                  {formatNumber(video.views)} views | {formatDate(video.publishedAt)}
                </small>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
