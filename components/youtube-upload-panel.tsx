"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type YouTubeStatus = {
  configured: boolean;
  connected: boolean;
  redirectUri: string;
  channelId: string | null;
  channelTitle: string | null;
  connectedAt: string | null;
  lastUpload: {
    videoId: string;
    title: string;
    uploadedAt: string;
    privacyStatus: string;
  } | null;
  uploadHistory: Array<{
    videoId?: string;
    title?: string;
    uploadedAt?: string;
    privacyStatus?: string;
    channelTitle?: string | null;
  }>;
};

export function YouTubeUploadPanel({
  initialStatus,
  initialMessage
}: {
  initialStatus?: string;
  initialMessage?: string;
}) {
  const [status, setStatus] = useState<YouTubeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(initialMessage ?? "");

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/youtube/status", { cache: "no-store" });
        const payload = (await response.json()) as YouTubeStatus;
        if (mounted) {
          setStatus(payload);
        }
      } catch {
        if (mounted) {
          setMessage("Could not load YouTube status.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStatus();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialStatus === "connected") {
      setMessage("YouTube connection completed. You can now upload launch-01 privately.");
    } else if (initialStatus === "oauth_error" && initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage, initialStatus]);

  async function handlePrivateUpload() {
    setUploading(true);
    setMessage("Uploading launch-01 to YouTube as private...");

    try {
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          conceptId: "launch-01",
          privacyStatus: "private"
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        youtubeWatchUrl?: string;
        youtubeStudioUrl?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "YouTube upload failed.");
      }

      setMessage(
        `Private upload completed. Watch: ${payload.youtubeWatchUrl} | Studio: ${payload.youtubeStudioUrl}`
      );

      const refresh = await fetch("/api/youtube/status", { cache: "no-store" });
      const refreshedStatus = (await refresh.json()) as YouTubeStatus;
      setStatus(refreshedStatus);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "YouTube upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="panelHeader">
        <h2>YouTube Upload</h2>
        <span>google oauth</span>
      </div>

      {loading ? <p className="statusText">Loading YouTube status...</p> : null}
      {!loading && status ? (
        <>
          <div className="inlineTags">
            <span className="tagPill">{status.configured ? "oauth configured" : "oauth missing"}</span>
            <span className="tagPill">{status.connected ? "connected" : "not connected"}</span>
            {status.channelTitle ? <span className="tagPill">{status.channelTitle}</span> : null}
          </div>
          <p className="sidebarText">
            Redirect URI: <code>{status.redirectUri}</code>
          </p>
          <div className="inlineActions">
            <a className="primaryButton" href="/api/youtube/oauth/start">
              Connect YouTube
            </a>
            <button
              className="secondaryButton"
              type="button"
              onClick={handlePrivateUpload}
              disabled={!status.configured || !status.connected || uploading}
            >
              {uploading ? "Uploading Private Test..." : "Upload Launch-01 As Private"}
            </button>
            <Link className="secondaryButton" href="/studio/sleep-launch">
              Open Launch Plan
            </Link>
          </div>
          <p className="statusText">{message || "Use manual-first by default, or connect YouTube to test the API path."}</p>

          {status.lastUpload ? (
            <div className="studioCard">
              <h3>Last Upload</h3>
              <p>
                <strong>{status.lastUpload.title}</strong>
              </p>
              <p className="sidebarText">
                {status.lastUpload.privacyStatus} | {new Date(status.lastUpload.uploadedAt).toLocaleString()}
              </p>
              <div className="inlineActions">
                <a
                  className="secondaryButton"
                  href={`https://www.youtube.com/watch?v=${status.lastUpload.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Watch Page
                </a>
                <a
                  className="secondaryButton"
                  href={`https://studio.youtube.com/video/${status.lastUpload.videoId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Studio
                </a>
              </div>
            </div>
          ) : null}

          {status.uploadHistory.length > 0 ? (
            <div className="stack">
              <h3>Upload History</h3>
              {status.uploadHistory.slice(0, 5).map((item, index) => (
                <div key={`${item.videoId ?? "history"}-${index}`} className="studioCard">
                  <p>
                    <strong>{item.title ?? "Untitled upload"}</strong>
                  </p>
                  <p className="sidebarText">
                    {item.privacyStatus ?? "unknown"} | {item.uploadedAt ? new Date(item.uploadedAt).toLocaleString() : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
