import Link from "next/link";

import { formatDate, formatNumber } from "@/lib/format";
import { listVideos } from "@/lib/library";
import { getVideoSource } from "@/lib/video-source";

export default async function ShortsPage() {
  const videos = (await listVideos())
    .filter((video) => isShortCandidate(video.duration))
    .slice(0, 12);

  return (
    <>
      <section className="hero">
        <span className="pill">shorts mode</span>
        <h1>Quick-turn shorts feed for sports and creator-story packaging.</h1>
        <p>
          This view pulls shorter videos first, stacks them vertically, and keeps a fast watch-one,
          move-to-the-next rhythm.
        </p>
      </section>

      {videos.length === 0 ? (
        <section className="emptyState">No short-form videos are available yet.</section>
      ) : (
        <section className="shortsRail">
          {videos.map((video) => {
            const source = getVideoSource(video.videoUrl, video.thumbnailUrl);

            return (
              <article key={video.id} className="shortCard">
                <div className="shortMedia">
                  {source.kind === "youtube" ? (
                    <iframe
                      className="shortSurface"
                      src={source.playbackUrl}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <video className="shortSurface" controls preload="metadata" src={source.playbackUrl} />
                  )}
                </div>

                <div className="shortMeta">
                  <div className="metaPills">
                    <span className="pill">{video.category}</span>
                    <span className="sourcePill">{source.label}</span>
                    <span className="sourcePill">{video.duration}</span>
                  </div>
                  <h2>{video.title}</h2>
                  <p className="metaLine">
                    {video.channelName} | {formatNumber(video.views)} views | {formatNumber(video.likes)} likes
                  </p>
                  <p className="description">{video.description}</p>
                  <div className="inlineTags">
                    {video.tags.slice(0, 4).map((tag) => (
                      <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="tagPill">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                  <div className="inlineActions">
                    <Link href={`/watch/${video.id}`} className="primaryButton">
                      Open Full Watch Page
                    </Link>
                    <Link href={`/channel/${video.channelSlug}`} className="secondaryButton">
                      Channel
                    </Link>
                    <span className="statusText">{formatDate(video.publishedAt)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

function isShortCandidate(duration: string) {
  const [minutesText = "0", secondsText = "0"] = duration.split(":");
  const minutes = Number.parseInt(minutesText, 10);
  const seconds = Number.parseInt(secondsText, 10);
  const totalSeconds = minutes * 60 + seconds;
  return Number.isFinite(totalSeconds) && totalSeconds <= 330;
}
