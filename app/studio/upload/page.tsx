import Link from "next/link";

import { ChannelProfileManager } from "@/components/channel-profile-manager";
import { StudioVideoManager } from "@/components/studio-video-manager";
import { UploadForm } from "@/components/upload-form";
import { listChannelProfiles, listVideos } from "@/lib/library";

export default async function UploadPage() {
  const videos = await listVideos({ includeDrafts: true });
  const channels = await listChannelProfiles();

  return (
    <>
      <section className="hero">
        <span className="pill">creator studio</span>
        <h1>Manage videos, drafts, bulk imports, and channel profiles.</h1>
        <p>
          This MVP stores everything in a JSON file inside the repo. Use the studio to upload links,
          keep drafts private, import batches, and tune the channel surfaces viewers see.
        </p>
        <div className="inlineActions">
          <Link href="/studio/sleep-lab" className="secondaryButton">
            Open Sleep Lab
          </Link>
        </div>
      </section>

      <UploadForm />
      <div style={{ height: "1rem" }} />
      <StudioVideoManager initialVideos={videos} />
      <div style={{ height: "1rem" }} />
      <ChannelProfileManager initialChannels={channels} />
    </>
  );
}
