import { notFound } from "next/navigation";

import { VideoCard } from "@/components/video-card";
import { formatNumber } from "@/lib/format";
import { getChannelProfile, getChannelVideos } from "@/lib/library";

interface ChannelPageProps {
  params: {
    slug: string;
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const [videos, channel] = await Promise.all([
    getChannelVideos(params.slug),
    getChannelProfile(params.slug)
  ]);

  if (videos.length === 0 || !channel) {
    notFound();
  }

  const totalViews = videos.reduce((sum, video) => sum + video.views, 0);

  return (
    <>
      <section className="channelHeader">
        <span className="pill">{channel.category}</span>
        <div className="channelHead">
          <div className="channelAvatar" style={{ backgroundColor: channel.accentColor }}>
            {channel.avatarText}
          </div>
          <div className="channelBlock">
            <h1>{channel.name}</h1>
            <p className="channelLead">{channel.tagline}</p>
            <p className="sidebarText">{channel.about}</p>
          </div>
          <div className="summaryGrid">
            <article className="summaryCard">
              <h3>{videos.length}</h3>
              <p>Published videos</p>
            </article>
            <article className="summaryCard">
              <h3>{formatNumber(totalViews)}</h3>
              <p>Total views</p>
            </article>
          </div>
        </div>
      </section>

      <section className="videoGrid">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </section>
    </>
  );
}
