import Link from "next/link";

import { formatDate, formatNumber } from "@/lib/format";
import type { VideoRecord } from "@/lib/types";
import { getVideoSource } from "@/lib/video-source";

const accentByCategory: Record<VideoRecord["category"], string> = {
  finance: "linear-gradient(135deg, #1d4ed8, #60a5fa)",
  ai: "linear-gradient(135deg, #0f766e, #2dd4bf)",
  vision: "linear-gradient(135deg, #7c3aed, #c084fc)",
  baseball: "linear-gradient(135deg, #b91c1c, #fb923c)",
  football: "linear-gradient(135deg, #15803d, #86efac)",
  creator: "linear-gradient(135deg, #be185d, #f9a8d4)",
  sleep: "linear-gradient(135deg, #4338ca, #93c5fd)"
};

export function VideoCard({ video }: { video: VideoRecord }) {
  const source = getVideoSource(video.videoUrl, video.thumbnailUrl);

  return (
    <Link href={`/watch/${video.id}`} className="videoCard">
      <div className="videoThumb" style={{ background: accentByCategory[video.category] }}>
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
        {video.tags.length > 0 ? <small>#{video.tags.slice(0, 3).join(" #")}</small> : null}
      </div>
    </Link>
  );
}
