"use client";

import Link from "next/link";
import { useState } from "react";

import type { Category, PublishState } from "@/lib/types";

const categories: Category[] = ["finance", "ai", "vision", "baseball", "football", "creator", "sleep"];
const publishStates: PublishState[] = ["published", "draft"];

const initialForm = {
  idea: "",
  channelName: "",
  channelSlug: "",
  category: "creator" as Category,
  duration: "06:00",
  title: "",
  videoUrl: "",
  thumbnailUrl: "",
  description: "",
  tags: "",
  status: "published" as PublishState
};

interface SuggestionState {
  hook: string;
  thumbnailCopy: string;
  shortsScript: string;
  recommendedCategory: Category;
  recommendedTags: string[];
  categoryReason: string;
}

const initialBulkForm = {
  channelName: "",
  channelSlug: "",
  category: "creator" as Category,
  duration: "04:00",
  status: "published" as PublishState,
  tags: "",
  urls: ""
};

export function UploadForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionState | null>(null);
  const [bulkForm, setBulkForm] = useState(initialBulkForm);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    setCreatedVideoId(null);

    const response = await fetch("/api/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        channelName: form.channelName,
        channelSlug: form.channelSlug,
        category: form.category,
        duration: form.duration,
        videoUrl: form.videoUrl,
        thumbnailUrl: form.thumbnailUrl,
        tags: form.tags,
        status: form.status
      })
    });

    if (!response.ok) {
      setStatus(await extractError(response, "Upload failed."));
      setSubmitting(false);
      return;
    }

    const result = (await response.json()) as { videoId: string };
    setStatus("Video added to LocalTube.");
    setCreatedVideoId(result.videoId);
    setForm((current) => ({
      ...initialForm,
      channelName: current.channelName,
      channelSlug: current.channelSlug,
      category: current.category,
      tags: current.tags,
      status: current.status
    }));
    setSuggestion(null);
    setSubmitting(false);
  }

  async function handleSuggest() {
    if (!form.idea.trim()) {
      setStatus("Add an idea first so the assistant has something to work from.");
      return;
    }

    setSuggesting(true);
    setStatus("");

    const response = await fetch("/api/ai/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idea: form.idea,
        category: form.category,
        channelName: form.channelName
      })
    });

    if (!response.ok) {
      setStatus(await extractError(response, "Suggestion failed."));
      setSuggesting(false);
      return;
    }

    const result = (await response.json()) as {
      suggestion: SuggestionState & {
        title: string;
        description: string;
      };
    };

    setForm((current) => ({
      ...current,
      title: result.suggestion.title,
      description: result.suggestion.description,
      category: result.suggestion.recommendedCategory,
      tags: current.tags || result.suggestion.recommendedTags.join(", ")
    }));
    setSuggestion(result.suggestion);
    setSuggesting(false);
    setStatus("Suggestion applied to title, description, category, and tags.");
  }

  async function handleBulkImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBulkSubmitting(true);
    setBulkStatus("");

    const response = await fetch("/api/videos/bulk-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bulkForm)
    });

    if (!response.ok) {
      setBulkStatus(await extractError(response, "Bulk import failed."));
      setBulkSubmitting(false);
      return;
    }

    const payload = (await response.json()) as {
      importedCount: number;
      duplicateCount: number;
    };

    setBulkStatus(
      `Imported ${payload.importedCount} videos. Skipped ${payload.duplicateCount} duplicate links.`
    );
    setBulkForm((current) => ({
      ...current,
      urls: ""
    }));
    setBulkSubmitting(false);
  }

  function updateField<Key extends keyof typeof initialForm>(key: Key, value: (typeof initialForm)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateBulkField<Key extends keyof typeof initialBulkForm>(
    key: Key,
    value: (typeof initialBulkForm)[Key]
  ) {
    setBulkForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="panelHeader">
          <h2>AI Metadata Helper</h2>
          <span>local assistant</span>
        </div>
        <div className="fieldGrid">
          <label>
            Video idea
            <input
              value={form.idea}
              onChange={(event) => updateField("idea", event.target.value)}
              placeholder="e.g. why this football match changed the title race"
            />
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(event) => updateField("category", event.target.value as Category)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Channel name
            <input
              value={form.channelName}
              onChange={(event) => updateField("channelName", event.target.value)}
              placeholder="Optional but helpful"
            />
          </label>
        </div>
        <div className="inlineActions">
          <button className="primaryButton" type="button" onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? "Generating..." : "Generate Metadata + Shorts Script"}
          </button>
          {status ? <p className="statusText">{status}</p> : null}
        </div>
        {suggestion ? (
          <div className="suggestionBox stack">
            <p>
              <strong>Recommended category:</strong> {suggestion.recommendedCategory}
            </p>
            <p>
              <strong>Why:</strong> {suggestion.categoryReason}
            </p>
            <p>
              <strong>Hook:</strong> {suggestion.hook}
            </p>
            <p>
              <strong>Thumbnail copy:</strong> {suggestion.thumbnailCopy}
            </p>
            <p>
              <strong>Suggested tags:</strong> {suggestion.recommendedTags.join(", ")}
            </p>
            <p>
              <strong>Shorts script:</strong> {suggestion.shortsScript}
            </p>
          </div>
        ) : null}
      </section>

      <form className="uploadForm" onSubmit={handleSubmit}>
        <div className="fieldGrid">
          <label>
            Channel name
            <input
              name="channelName"
              maxLength={80}
              required
              value={form.channelName}
              onChange={(event) => updateField("channelName", event.target.value)}
            />
          </label>
          <label>
            Channel slug
            <input
              name="channelSlug"
              maxLength={80}
              pattern="[a-z0-9-]+"
              required
              value={form.channelSlug}
              onChange={(event) => updateField("channelSlug", event.target.value)}
            />
          </label>
          <label>
            Category
            <select
              name="category"
              required
              value={form.category}
              onChange={(event) => updateField("category", event.target.value as Category)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Publish state
            <select
              name="status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as PublishState)}
            >
              {publishStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
          <label>
            Duration
            <input
              name="duration"
              maxLength={10}
              required
              value={form.duration}
              onChange={(event) => updateField("duration", event.target.value)}
            />
          </label>
          <label>
            Tags
            <input
              name="tags"
              maxLength={120}
              placeholder="sports, breakdown, tactics"
              value={form.tags}
              onChange={(event) => updateField("tags", event.target.value)}
            />
          </label>
        </div>

        <label>
          Title
          <input
            name="title"
            maxLength={120}
            required
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>

        <label>
          Public video URL
          <input
            name="videoUrl"
            type="url"
            placeholder="https://...mp4 or https://www.youtube.com/watch?v=..."
            required
            value={form.videoUrl}
            onChange={(event) => updateField("videoUrl", event.target.value)}
          />
        </label>

        <p className="statusText">
          Direct MP4 links and standard YouTube watch URLs both work in this MVP. Duplicate links are blocked.
        </p>

        <label>
          Thumbnail override URL
          <input
            name="thumbnailUrl"
            type="url"
            placeholder="Optional https://...jpg"
            value={form.thumbnailUrl}
            onChange={(event) => updateField("thumbnailUrl", event.target.value)}
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            rows={6}
            maxLength={1000}
            required
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>

        <div className="inlineActions">
          <button className="primaryButton" type="submit" disabled={submitting}>
            {submitting ? "Uploading..." : "Add Video"}
          </button>
          {createdVideoId ? (
            <Link href={`/watch/${createdVideoId}`} className="secondaryButton">
              Open Uploaded Video
            </Link>
          ) : null}
          {status ? <p className="statusText">{status}</p> : null}
        </div>
      </form>

      <form className="panel stack" onSubmit={handleBulkImport}>
        <div className="panelHeader">
          <h2>Bulk Import</h2>
          <span>seed or external links</span>
        </div>
        <div className="fieldGrid">
          <label>
            Channel name
            <input
              value={bulkForm.channelName}
              onChange={(event) => updateBulkField("channelName", event.target.value)}
              required
            />
          </label>
          <label>
            Channel slug
            <input
              value={bulkForm.channelSlug}
              onChange={(event) => updateBulkField("channelSlug", event.target.value)}
              pattern="[a-z0-9-]+"
              required
            />
          </label>
          <label>
            Category
            <select
              value={bulkForm.category}
              onChange={(event) => updateBulkField("category", event.target.value as Category)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Publish state
            <select
              value={bulkForm.status}
              onChange={(event) => updateBulkField("status", event.target.value as PublishState)}
            >
              {publishStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
          <label>
            Default duration
            <input
              value={bulkForm.duration}
              onChange={(event) => updateBulkField("duration", event.target.value)}
            />
          </label>
          <label>
            Shared tags
            <input
              value={bulkForm.tags}
              onChange={(event) => updateBulkField("tags", event.target.value)}
              placeholder="football, analysis"
            />
          </label>
        </div>
        <label>
          One URL per line
          <textarea
            rows={6}
            value={bulkForm.urls}
            onChange={(event) => updateBulkField("urls", event.target.value)}
            placeholder={"https://www.youtube.com/watch?v=...\nhttps://samplelib.com/lib/preview/mp4/sample-20s.mp4"}
            required
          />
        </label>
        <div className="inlineActions">
          <button className="primaryButton" type="submit" disabled={bulkSubmitting}>
            {bulkSubmitting ? "Importing..." : "Import Links"}
          </button>
          {bulkStatus ? <p className="statusText">{bulkStatus}</p> : null}
        </div>
      </form>
    </div>
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
