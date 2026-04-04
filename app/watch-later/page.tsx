import { WatchLaterCollection } from "@/components/watch-later-collection";
import { listVideos } from "@/lib/library";

export default async function WatchLaterPage() {
  const videos = await listVideos();

  return (
    <>
      <section className="hero">
        <span className="pill">watch later</span>
        <h1>Keep a small queue of videos you want to come back to.</h1>
        <p>
          Save interesting uploads from the watch page, then use this page as a clean catch-up queue.
        </p>
      </section>

      <WatchLaterCollection
        videos={videos}
        variant="grid"
        title="Saved videos"
        emptyMessage="Save a few videos from the watch page and they will appear here."
      />
    </>
  );
}
