"use client";

import { useState } from "react";

import type { Category, ChannelProfile } from "@/lib/types";

const categories: Category[] = ["finance", "ai", "vision", "baseball", "football", "creator", "sleep"];

export function ChannelProfileManager({ initialChannels }: { initialChannels: ChannelProfile[] }) {
  const [channels, setChannels] = useState(initialChannels);
  const [statusBySlug, setStatusBySlug] = useState<Record<string, string>>({});
  const [busyBySlug, setBusyBySlug] = useState<Record<string, boolean>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>, slug: string) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    setBusyBySlug((current) => ({ ...current, [slug]: true }));
    setStatusBySlug((current) => ({ ...current, [slug]: "" }));

    const response = await fetch(`/api/channels/${slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorMessage = await extractError(response, "Save failed.");
      setBusyBySlug((current) => ({ ...current, [slug]: false }));
      setStatusBySlug((current) => ({ ...current, [slug]: errorMessage }));
      return;
    }

    const payloadJson = (await response.json()) as { channel: ChannelProfile };
    setChannels((current) =>
      current.map((channel) => (channel.slug === slug ? payloadJson.channel : channel))
    );
    setBusyBySlug((current) => ({ ...current, [slug]: false }));
    setStatusBySlug((current) => ({ ...current, [slug]: "Channel updated." }));
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Channel Profiles</h2>
        <span>{channels.length}</span>
      </div>
      <div className="stack">
        {channels.map((channel) => (
          <form
            key={channel.slug}
            className="studioCard"
            onSubmit={(event) => handleSubmit(event, channel.slug)}
          >
            <div className="panelHeader">
              <h3>{channel.name}</h3>
              <span>{channel.slug}</span>
            </div>
            <div className="fieldGrid">
              <label>
                Channel name
                <input name="name" defaultValue={channel.name} required />
              </label>
              <label>
                Category
                <select name="category" defaultValue={channel.category}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Avatar text
                <input name="avatarText" defaultValue={channel.avatarText} maxLength={2} required />
              </label>
              <label>
                Accent color
                <input name="accentColor" defaultValue={channel.accentColor} placeholder="#15803d" required />
              </label>
            </div>
            <label>
              Tagline
              <input name="tagline" defaultValue={channel.tagline} maxLength={140} required />
            </label>
            <label>
              About
              <textarea name="about" rows={4} defaultValue={channel.about} required />
            </label>
            <div className="inlineActions">
              <button className="primaryButton" type="submit" disabled={busyBySlug[channel.slug]}>
                {busyBySlug[channel.slug] ? "Saving..." : "Save Channel"}
              </button>
              {statusBySlug[channel.slug] ? <p className="statusText">{statusBySlug[channel.slug]}</p> : null}
            </div>
          </form>
        ))}
      </div>
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
