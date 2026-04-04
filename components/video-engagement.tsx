"use client";

import { useEffect, useMemo, useState } from "react";

import { formatNumber } from "@/lib/format";

interface VideoEngagementProps {
  videoId: string;
  initialViews: number;
  initialLikes: number;
}

export function VideoEngagement({
  videoId,
  initialViews,
  initialLikes
}: VideoEngagementProps) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState("");

  const viewedKey = useMemo(() => `localtube:viewed:${videoId}`, [videoId]);
  const likedKey = useMemo(() => `localtube:liked:${videoId}`, [videoId]);

  useEffect(() => {
    const alreadyLiked = window.sessionStorage.getItem(likedKey) === "1";
    setLiked(alreadyLiked);

    const savedIds = JSON.parse(
      window.localStorage.getItem("localtube:watch-later") ?? "[]"
    ) as string[];
    setSaved(savedIds.includes(videoId));

    const currentHistory = JSON.parse(
      window.localStorage.getItem("localtube:watch-history") ?? "[]"
    ) as string[];
    const nextHistory = [videoId, ...currentHistory.filter((item) => item !== videoId)].slice(0, 12);
    window.localStorage.setItem("localtube:watch-history", JSON.stringify(nextHistory));

    const alreadyViewed = window.sessionStorage.getItem(viewedKey) === "1";
    if (alreadyViewed) {
      return;
    }

    window.sessionStorage.setItem(viewedKey, "1");

    void fetch(`/api/videos/${videoId}/engagement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "view" })
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { views: number };
        setViews(payload.views);
      })
      .catch(() => {
        window.sessionStorage.removeItem(viewedKey);
      });
  }, [likedKey, videoId, viewedKey]);

  async function handleLike() {
    if (liked) {
      setStatus("Already liked in this session.");
      return;
    }

    const response = await fetch(`/api/videos/${videoId}/engagement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "like" })
    });

    if (!response.ok) {
      setStatus("Like failed. Try again.");
      return;
    }

    const payload = (await response.json()) as { likes: number };
    setLikes(payload.likes);
    setLiked(true);
    window.sessionStorage.setItem(likedKey, "1");
    setStatus("Liked.");
  }

  function handleWatchLater() {
    const current = JSON.parse(
      window.localStorage.getItem("localtube:watch-later") ?? "[]"
    ) as string[];

    if (saved) {
      const next = current.filter((item) => item !== videoId);
      window.localStorage.setItem("localtube:watch-later", JSON.stringify(next));
      setSaved(false);
      setStatus("Removed from Watch later.");
      return;
    }

    const next = [videoId, ...current.filter((item) => item !== videoId)].slice(0, 30);
    window.localStorage.setItem("localtube:watch-later", JSON.stringify(next));
    setSaved(true);
    setStatus("Saved to Watch later.");
  }

  return (
    <section className="engagementBar">
      <div className="engagementStats">
        <span>{formatNumber(views)} views</span>
        <span>{formatNumber(likes)} likes</span>
      </div>
      <div className="inlineActions">
        <button className="primaryButton" type="button" onClick={handleLike}>
          {liked ? "Liked" : "Like"}
        </button>
        <button className="secondaryButton" type="button" onClick={handleWatchLater}>
          {saved ? "Saved" : "Watch later"}
        </button>
        {status ? <p className="statusText">{status}</p> : null}
      </div>
    </section>
  );
}
