import Link from "next/link";

import { VideoCard } from "@/components/video-card";
import { filterVideos, getAllTags, listVideos } from "@/lib/library";

interface SleepLibraryPageProps {
  searchParams?: {
    q?: string;
    tag?: string;
    status?: string;
  };
}

export default async function SleepLibraryPage({ searchParams }: SleepLibraryPageProps) {
  const search = searchParams?.q ?? "";
  const tag = searchParams?.tag ?? "";
  const status = searchParams?.status ?? "";
  const allSleepVideos = (await listVideos({ includeDrafts: true })).filter(
    (video) => video.category === "sleep"
  );
  const filteredBySearch = filterVideos(allSleepVideos, search, "sleep", tag);
  const videos =
    status.length === 0 ? filteredBySearch : filteredBySearch.filter((video) => video.status === status);
  const tags = getAllTags(allSleepVideos);
  const draftCount = allSleepVideos.filter((video) => video.status === "draft").length;
  const publishedCount = allSleepVideos.filter((video) => video.status === "published").length;

  return (
    <>
      <section className="hero">
        <span className="pill">sleep library</span>
        <h1>Reuse the sleep tracks we already generated instead of rebuilding them from scratch.</h1>
        <p>
          This page is the persistent shelf for saved sleep-audio posts. Use it to reopen published
          tracks, review drafts, and filter by the tags we plan to ship to YouTube.
        </p>
        <div className="inlineActions">
          <Link className="secondaryButton" href="/studio/sleep-lab">
            Back To Sleep Lab
          </Link>
          <Link className="primaryButton" href="/studio/upload">
            Open Studio
          </Link>
        </div>
      </section>

      <section className="summaryGrid">
        <article className="summaryCard">
          <h2>{allSleepVideos.length}</h2>
          <p>Total saved sleep tracks</p>
        </article>
        <article className="summaryCard">
          <h2>{publishedCount}</h2>
          <p>Published sleep posts</p>
        </article>
        <article className="summaryCard">
          <h2>{draftCount}</h2>
          <p>Draft sleep posts</p>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2>Library Filters</h2>
          <span>saved tracks</span>
        </div>
        <form className="filterRow" action="/studio/sleep-library">
          <label>
            Search
            <input defaultValue={search} name="q" placeholder="Search titles or channels" />
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
          <label>
            Status
            <select defaultValue={status} name="status">
              <option value="">All states</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <div className="inlineActions">
            <button className="primaryButton" type="submit">
              Apply
            </button>
            <Link className="secondaryButton" href="/studio/sleep-library">
              Clear
            </Link>
          </div>
        </form>
      </section>

      {videos.length === 0 ? (
        <section className="emptyState">
          No saved sleep tracks matched that filter yet. Save one from Sleep Lab and it will appear here.
        </section>
      ) : (
        <section className="videoGrid">
          {videos.map((video) => (
            <div key={video.id} className="stack">
              <VideoCard video={video} />
              <div className="inlineTags">
                <span className="tagPill">{video.status}</span>
                <span className="tagPill">{video.channelName}</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
