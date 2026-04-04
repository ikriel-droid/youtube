import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentsPanel } from "@/components/comments-panel";
import { VideoEngagement } from "@/components/video-engagement";
import { VideoCard } from "@/components/video-card";
import { VideoPlayer } from "@/components/video-player";
import { getChannelProfile, getRelatedVideos, getVideo } from "@/lib/library";

interface WatchPageProps {
  params: {
    id: string;
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const video = await getVideo(params.id, { includeDrafts: true });

  if (!video) {
    notFound();
  }

  const [related, channelProfile] = await Promise.all([
    getRelatedVideos(video),
    getChannelProfile(video.channelSlug)
  ]);

  const nextVideo = related[0]
    ? {
        id: related[0].id,
        title: related[0].title
      }
    : undefined;

  return (
    <div className="watchGrid">
      <section className="watchMain">
        <VideoPlayer video={video} nextVideo={nextVideo} />
        <VideoEngagement videoId={video.id} initialViews={video.views} initialLikes={video.likes} />

        <section className="panel">
          <div className="panelHeader">
            <h2>Channel</h2>
            <Link href={`/channel/${video.channelSlug}`} className="secondaryButton">
              Open channel
            </Link>
          </div>
          <p className="sidebarText">
            {channelProfile?.tagline ||
              `${video.channelName} focuses on ${video.category} ideas, breakdowns, and repeatable creator workflows.`}
          </p>
          <p className="sidebarText">
            {channelProfile?.about ||
              `${video.channelName} is where LocalTube keeps practical notes, sharper hooks, and reusable packaging ideas.`}
          </p>
          <div className="inlineTags">
            <span className="sourcePill">Status: {video.status}</span>
            {video.tags.map((tag) => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="tagPill">
                #{tag}
              </Link>
            ))}
          </div>
        </section>

        <CommentsPanel videoId={video.id} initialComments={video.comments} />
      </section>

      <aside className="watchSidebar">
        <section className="panel">
          <div className="panelHeader">
            <h2>Up next</h2>
            <span>{related.length}</span>
          </div>
          <div className="stack">
            {related.map((item) => (
              <VideoCard key={item.id} video={item} />
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
