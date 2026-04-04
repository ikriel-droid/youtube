import Link from "next/link";

import { VideoCard } from "@/components/video-card";
import { WatchHistoryStrip } from "@/components/watch-history-strip";
import { WatchLaterCollection } from "@/components/watch-later-collection";
import { filterVideos, getAllTags, getCategories, listVideos } from "@/lib/library";

interface HomePageProps {
  searchParams?: {
    q?: string;
    category?: string;
    sort?: string;
    tag?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const search = searchParams?.q ?? "";
  const category = searchParams?.category ?? "";
  const sort = searchParams?.sort ?? "latest";
  const tag = searchParams?.tag ?? "";
  const allVideos = await listVideos();
  const videos = sortVideos(filterVideos(allVideos, search, category, tag), sort);
  const categories = getCategories();
  const tags = getAllTags(allVideos);
  const totalViews = allVideos.reduce((sum, video) => sum + video.views, 0);
  const totalLikes = allVideos.reduce((sum, video) => sum + video.likes, 0);

  return (
    <>
      <section className="hero">
        <span className="pill">creator-tool product for sports channels</span>
        <h1>Plan, package, and test sports-video ideas in a local YouTube-style workspace.</h1>
        <p>
          LocalTube is now aimed at sports creators first. Use it to test titles, tags, shorts ideas,
          and upload workflows around baseball and football breakdown content without a real backend.
        </p>

        <form className="filterRow" action="/">
          <label>
            Search
            <input defaultValue={search} name="q" placeholder="Search titles, channels, or ideas" />
          </label>
          <label>
            Category
            <select defaultValue={category} name="category">
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort
            <select defaultValue={sort} name="sort">
              <option value="latest">Latest</option>
              <option value="trending">Trending</option>
              <option value="likes">Most liked</option>
            </select>
          </label>
          <label>
            Tag
            <select defaultValue={tag} name="tag">
              <option value="">All tags</option>
              {tags.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="inlineActions">
            <button className="primaryButton" type="submit">
              Apply
            </button>
            <Link href="/studio/upload" className="secondaryButton">
              Upload video
            </Link>
          </div>
        </form>
      </section>

      <section className="summaryGrid">
        <article className="summaryCard">
          <h2>{videos.length}</h2>
          <p>Videos in the current feed</p>
        </article>
        <article className="summaryCard">
          <h2>{totalViews.toLocaleString("en-US")}</h2>
          <p>Total stored views across the local library</p>
        </article>
        <article className="summaryCard">
          <h2>{totalLikes.toLocaleString("en-US")}</h2>
          <p>Total likes tracked in LocalTube</p>
        </article>
        <article className="summaryCard">
          <h2>{categories.length}</h2>
          <p>Interest lanes ready to adapt into creator tools</p>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2>Current direction</h2>
          <span>sports creators</span>
        </div>
        <p className="sidebarText">
          The primary use case is now sports channels that need faster title ideas, shorts packaging,
          and link-based upload testing before they wire in real YouTube APIs.
        </p>
      </section>

      <WatchHistoryStrip videos={allVideos} />
      <WatchLaterCollection videos={allVideos} title="Watch later" />

      {videos.length === 0 ? (
        <section className="emptyState">No videos matched that search yet. Try another keyword.</section>
      ) : (
        <section className="videoGrid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </section>
      )}
    </>
  );
}

function sortVideos(videos: Awaited<ReturnType<typeof listVideos>>, sort: string) {
  if (sort === "trending") {
    return [...videos].sort(
      (left, right) => right.views + right.likes * 3 - (left.views + left.likes * 3)
    );
  }

  if (sort === "likes") {
    return [...videos].sort((left, right) => right.likes - left.likes);
  }

  return videos;
}
