"use client";

import { useState } from "react";

import type { Category, PublishState, VideoRecord } from "@/lib/types";

const categories: Category[] = ["finance", "ai", "vision", "baseball", "football", "creator", "sleep"];
const publishStates: PublishState[] = ["published", "draft"];

export function StudioVideoManager({ initialVideos }: { initialVideos: VideoRecord[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [statusById, setStatusById] = useState<Record<string, string>>({});
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>, videoId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    setBusyById((current) => ({ ...current, [videoId]: true }));
    setStatusById((current) => ({ ...current, [videoId]: "" }));

    const response = await fetch(`/api/videos/${videoId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorMessage = await extractError(response, "Save failed.");
      setBusyById((current) => ({ ...current, [videoId]: false }));
      setStatusById((current) => ({ ...current, [videoId]: errorMessage }));
      return;
    }

    const result = (await response.json()) as { video: VideoRecord };
    setVideos((current) => current.map((video) => (video.id === videoId ? result.video : video)));
    setBusyById((current) => ({ ...current, [videoId]: false }));
    setStatusById((current) => ({ ...current, [videoId]: "Saved." }));
  }

  async function handleDelete(videoId: string) {
    setBusyById((current) => ({ ...current, [videoId]: true }));
    setStatusById((current) => ({ ...current, [videoId]: "" }));

    const response = await fetch(`/api/videos/${videoId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const errorMessage = await extractError(response, "Delete failed.");
      setBusyById((current) => ({ ...current, [videoId]: false }));
      setStatusById((current) => ({ ...current, [videoId]: errorMessage }));
      return;
    }

    setVideos((current) => current.filter((video) => video.id !== videoId));
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Manage Uploaded Videos</h2>
        <span>{videos.length}</span>
      </div>

      {videos.length === 0 ? (
        <div className="emptyState">No videos are stored yet.</div>
      ) : (
        <div className="stack">
          {videos.map((video) => (
            <form key={video.id} className="studioCard" onSubmit={(event) => handleUpdate(event, video.id)}>
              <div className="panelHeader">
                <h3>{video.title}</h3>
                <span>{video.status}</span>
              </div>

              <div className="fieldGrid">
                <label>
                  Title
                  <input name="title" defaultValue={video.title} maxLength={120} required />
                </label>
                <label>
                  Channel name
                  <input name="channelName" defaultValue={video.channelName} maxLength={80} required />
                </label>
                <label>
                  Channel slug
                  <input
                    name="channelSlug"
                    defaultValue={video.channelSlug}
                    maxLength={80}
                    pattern="[a-z0-9-]+"
                    required
                  />
                </label>
                <label>
                  Category
                  <select name="category" defaultValue={video.category} required>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Publish state
                  <select name="status" defaultValue={video.status}>
                    {publishStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Duration
                  <input name="duration" defaultValue={video.duration} maxLength={10} required />
                </label>
                <label>
                  Tags
                  <input
                    name="tags"
                    defaultValue={video.tags.join(", ")}
                    placeholder="sports, breakdown, tactics"
                  />
                </label>
                <label>
                  Thumbnail override
                  <input
                    name="thumbnailUrl"
                    defaultValue={video.thumbnailUrl ?? ""}
                    placeholder="https://...jpg"
                  />
                </label>
              </div>

              <label>
                Public video URL
                <input name="videoUrl" defaultValue={video.videoUrl} required />
              </label>

              <label>
                Description
                <textarea name="description" rows={4} defaultValue={video.description} required />
              </label>

              <div className="inlineActions">
                <button className="primaryButton" type="submit" disabled={busyById[video.id]}>
                  {busyById[video.id] ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="dangerButton"
                  type="button"
                  disabled={busyById[video.id]}
                  onClick={() => handleDelete(video.id)}
                >
                  Delete Video
                </button>
                {statusById[video.id] ? <p className="statusText">{statusById[video.id]}</p> : null}
              </div>
            </form>
          ))}
        </div>
      )}
    </section>
  );
}

async function extractError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}
