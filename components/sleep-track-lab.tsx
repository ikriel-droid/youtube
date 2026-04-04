"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildSleepMetadata,
  exportSleepTrackWav,
  generateSleepTrackData,
  getSleepExportSpec,
  getSleepPresetLabel,
  getSleepReleasePresetLabel,
  type SleepPreset,
  type SleepReleasePreset
} from "@/lib/sleep-audio";
import { SleepVisualizer } from "@/components/sleep-visualizer";
import type { PublishState } from "@/lib/types";

const presets: Array<{
  value: SleepPreset;
  lead: string;
}> = [
  { value: "deep-drone", lead: "Low drone layers for a steady deep-sleep bed." },
  { value: "brown-noise", lead: "Soft brown noise for focus or sleep masking." },
  { value: "rain", lead: "Rain-like texture with light drone support underneath." },
  { value: "ocean", lead: "Slow swell texture with gentle ocean-style movement." }
];

const minuteOptions = [1, 3, 5, 10, 30, 60];
const previewSampleRate = 22_050;
const releaseProfiles: Array<{
  value: SleepReleasePreset;
  lead: string;
}> = [
  { value: "black-screen", lead: "Minimal packaging for distraction-free overnight uploads." },
  { value: "rain-window", lead: "A softer visual package built around rain-window motion." },
  { value: "ocean-drift", lead: "A calm glow-based package for ocean-style ambience videos." }
];
const initialMetadata = buildSleepMetadata(
  {
    preset: "deep-drone",
    minutes: 30,
    seed: "midnight-rain"
  },
  {
    releasePreset: "black-screen"
  }
);

export function SleepTrackLab() {
  const [preset, setPreset] = useState<SleepPreset>("deep-drone");
  const [releasePreset, setReleasePreset] = useState<SleepReleasePreset>("black-screen");
  const [minutes, setMinutes] = useState(30);
  const [seed, setSeed] = useState("midnight-rain");
  const [channelName, setChannelName] = useState("Sleep Lab");
  const [channelSlug, setChannelSlug] = useState("sleep-lab");
  const [publishState, setPublishState] = useState<PublishState>("published");
  const [title, setTitle] = useState(initialMetadata.title);
  const [description, setDescription] = useState(initialMetadata.description);
  const [tagsInput, setTagsInput] = useState(initialMetadata.tags.join(", "));
  const [metadataTouched, setMetadataTouched] = useState(false);
  const [status, setStatus] = useState("Pick a preset and generate a preview.");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renderingBundle, setRenderingBundle] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [savedVideoId, setSavedVideoId] = useState<string | null>(null);
  const [renderBundle, setRenderBundle] = useState<{
    videoUrl: string;
    thumbnailUrl: string;
    manifestUrl: string;
    suggestedFilenameBase: string;
  } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const metadata = useMemo(
    () =>
      buildSleepMetadata({
        preset,
        minutes,
        seed
      }, {
        releasePreset
      }),
    [minutes, preset, releasePreset, seed]
  );

  const exportSpec = useMemo(() => getSleepExportSpec(minutes), [minutes]);

  useEffect(() => {
    return () => {
      stopPreview();
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  useEffect(() => {
    if (!metadataTouched) {
      setTitle(metadata.title);
      setDescription(metadata.description);
      setTagsInput(metadata.tags.join(", "));
    }
  }, [metadata, metadataTouched]);

  async function handlePreview() {
    stopPreview();
    setPreviewing(true);
    setStatus("Building a 20-second preview...");

    try {
      const previewSamples = generateSleepTrackData(
        {
          preset,
          minutes: 1,
          seed
        },
        previewSampleRate
      ).slice(0, previewSampleRate * 20);

      const context = new AudioContext();
      const buffer = context.createBuffer(1, previewSamples.length, previewSampleRate);
      buffer.copyToChannel(previewSamples, 0);

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => {
        setPreviewing(false);
        setStatus("Preview finished.");
      };
      source.start();

      audioContextRef.current = context;
      previewSourceRef.current = source;
      setStatus("Preview playing.");
    } catch (error) {
      setPreviewing(false);
      setStatus("Preview could not start in this browser.");
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setSavedVideoId(null);
    setRenderBundle(null);
    setStatus("Generating WAV file...");

    try {
      const exportResult = exportSleepTrackWav({
        preset,
        minutes,
        seed
      });

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      const nextUrl = URL.createObjectURL(exportResult.blob);
      setDownloadUrl(nextUrl);
      setStatus(
        `Generated ${minutes}-minute ${getSleepPresetLabel(preset)} track at ${exportResult.sampleRate} Hz (${exportResult.qualityLabel}).`
      );
    } catch (error) {
      setStatus("Generation failed. Try again with a different preset or shorter duration.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRenderBundle() {
    setRenderingBundle(true);
    setStatus("Rendering a YouTube-ready bundle...");

    try {
      const response = await fetch("/api/sleep-renders", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          preset,
          releasePreset,
          minutes,
          seed,
          title: title.trim(),
          description: description.trim(),
          tags: tagsInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          channelName: channelName.trim()
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        videoUrl?: string;
        thumbnailUrl?: string;
        manifestUrl?: string;
        suggestedFilenameBase?: string;
      };

      if (!response.ok || !payload.videoUrl || !payload.thumbnailUrl || !payload.manifestUrl) {
        throw new Error(payload.error || "Render bundle failed.");
      }

      setRenderBundle({
        videoUrl: payload.videoUrl,
        thumbnailUrl: payload.thumbnailUrl,
        manifestUrl: payload.manifestUrl,
        suggestedFilenameBase: payload.suggestedFilenameBase || "sleep-upload"
      });
      setStatus("YouTube-ready render bundle created. MP4, thumbnail, and manifest are ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Render bundle failed.";
      setStatus(message);
    } finally {
      setRenderingBundle(false);
    }
  }

  async function handleSave() {
    if (!downloadUrl) {
      setStatus("Generate a WAV first, then save it into LocalTube.");
      return;
    }

    setSaving(true);
    setStatus("Saving the generated sleep track into LocalTube...");

    try {
      const response = await fetch("/api/sleep-tracks", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          preset,
          minutes,
          seed,
          releasePreset,
          title: title.trim(),
          description: description.trim(),
          tags: tagsInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          channelName: channelName.trim(),
          channelSlug: channelSlug.trim(),
          status: publishState
        })
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        videoId?: string;
      };

      if (!response.ok) {
        if (response.status === 409 && payload.videoId) {
          setSavedVideoId(payload.videoId);
          setStatus("That sleep track was already saved. Opening the existing LocalTube item is available below.");
          return;
        }

        throw new Error(payload.error || "Sleep-track save failed.");
      }

      setSavedVideoId(payload.videoId ?? null);
      setStatus(
        `Saved into LocalTube as ${publishState}. This track now stays in the library after refresh.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sleep-track save failed.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  }

  function stopPreview() {
    previewSourceRef.current?.stop();
    previewSourceRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setPreviewing(false);
  }

  function randomizeSeed() {
    setSeed(`sleep-${Math.random().toString(36).slice(2, 8)}`);
  }

  function handleUseSuggestedMetadata() {
    setMetadataTouched(false);
    setTitle(metadata.title);
    setDescription(metadata.description);
    setTagsInput(metadata.tags.join(", "));
    setStatus("Suggested sleep-upload metadata restored.");
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="pill">sleep content lab</span>
        <h1>Generate the sleep-audio bed and its visual direction before touching upload.</h1>
        <p>
          This version now supports longer loop-stitched exports, ambient background preview, and a
          waveform strip you can treat like the first frame of a sleep-video concept.
        </p>
        <div className="inlineActions">
          <Link className="secondaryButton" href="/studio/sleep-library">
            Open Sleep Library
          </Link>
        </div>
      </section>

      <SleepVisualizer preset={preset} seed={seed} />

      <section className="panel stack">
        <div className="panelHeader">
          <h2>Track Controls</h2>
          <span>local synth</span>
        </div>

        <div className="sleepPresetGrid">
          {presets.map((item) => (
            <button
              key={item.value}
              type="button"
              className={item.value === preset ? "sleepPreset isActive" : "sleepPreset"}
              onClick={() => setPreset(item.value)}
            >
              <strong>{getSleepPresetLabel(item.value)}</strong>
              <span>{item.lead}</span>
            </button>
          ))}
        </div>

        <div className="panelHeader">
          <h2>Release Presets</h2>
          <span>publish-ready package</span>
        </div>
        <div className="sleepPresetGrid">
          {releaseProfiles.map((item) => (
            <button
              key={item.value}
              type="button"
              className={item.value === releasePreset ? "sleepPreset isActive" : "sleepPreset"}
              onClick={() => setReleasePreset(item.value)}
            >
              <strong>{getSleepReleasePresetLabel(item.value)}</strong>
              <span>{item.lead}</span>
            </button>
          ))}
        </div>

        <div className="fieldGrid">
          <label>
            Length
            <select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
              {minuteOptions.map((value) => (
                <option key={value} value={value}>
                  {value} minute{value === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Texture seed
            <input value={seed} onChange={(event) => setSeed(event.target.value)} />
          </label>
        </div>

        <div className="panelHeader">
          <h2>Final Upload Settings</h2>
          <span>creator-controlled</span>
        </div>

        <div className="fieldGrid">
          <label>
            Final title
            <input
              value={title}
              onChange={(event) => {
                setMetadataTouched(true);
                setTitle(event.target.value);
              }}
            />
          </label>
          <label>
            Channel name
            <input value={channelName} onChange={(event) => setChannelName(event.target.value)} />
          </label>
          <label>
            Channel slug
            <input value={channelSlug} onChange={(event) => setChannelSlug(event.target.value)} />
          </label>
          <label>
            Publish state
            <select
              value={publishState}
              onChange={(event) => setPublishState(event.target.value as PublishState)}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>

        <div className="fieldGrid">
          <label>
            Final description
            <textarea
              rows={4}
              value={description}
              onChange={(event) => {
                setMetadataTouched(true);
                setDescription(event.target.value);
              }}
            />
          </label>
          <label>
            Tags
            <input
              value={tagsInput}
              onChange={(event) => {
                setMetadataTouched(true);
                setTagsInput(event.target.value);
              }}
              placeholder="sleep music, ambient, black screen"
            />
          </label>
        </div>

        <div className="inlineTags">
          <span className="tagPill">Export mode: {exportSpec.qualityLabel}</span>
          <span className="tagPill">Sample rate: {exportSpec.sampleRate} Hz</span>
          <span className="tagPill">Loop segment: {exportSpec.segmentMinutes} min</span>
          <span className="tagPill">Crossfade: {exportSpec.crossfadeSeconds}s</span>
          <span className="tagPill">Release preset: {getSleepReleasePresetLabel(releasePreset)}</span>
          <span className="tagPill">Save state: {publishState}</span>
        </div>

        <div className="inlineActions">
          <button className="secondaryButton" type="button" onClick={randomizeSeed}>
            Randomize Seed
          </button>
          <button className="secondaryButton" type="button" onClick={handleUseSuggestedMetadata}>
            Reset Suggested Metadata
          </button>
          <button className="primaryButton" type="button" onClick={handlePreview} disabled={previewing}>
            {previewing ? "Previewing..." : "Preview 20s"}
          </button>
          <button className="secondaryButton" type="button" onClick={stopPreview} disabled={!previewing}>
            Stop Preview
          </button>
          <button className="primaryButton" type="button" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating..." : `Generate ${minutes}m WAV`}
          </button>
          <button
            className="primaryButton"
            type="button"
            onClick={handleRenderBundle}
            disabled={renderingBundle || generating}
          >
            {renderingBundle ? "Rendering Bundle..." : "Render YouTube Bundle"}
          </button>
          <button
            className="secondaryButton"
            type="button"
            onClick={handleSave}
            disabled={saving || generating || !downloadUrl}
          >
            {saving ? "Saving..." : "Save To LocalTube"}
          </button>
        </div>

        <p className="statusText">{status}</p>
        <div className="inlineActions">
          {downloadUrl ? (
            <a
              className="secondaryButton"
              href={downloadUrl}
              download={`localtube-${preset}-${minutes}min.wav`}
            >
              Download WAV
            </a>
          ) : null}
          {savedVideoId ? (
            <Link className="primaryButton" href={`/watch/${savedVideoId}`}>
              Open Saved Track
            </Link>
          ) : null}
        </div>
        {renderBundle ? (
          <div className="stack">
            <div className="inlineTags">
              <span className="tagPill">Suggested file base: {renderBundle.suggestedFilenameBase}</span>
            </div>
            <div className="inlineActions">
              <a className="primaryButton" href={renderBundle.videoUrl} target="_blank" rel="noreferrer">
                Open MP4
              </a>
              <a className="secondaryButton" href={renderBundle.thumbnailUrl} target="_blank" rel="noreferrer">
                Open Thumbnail
              </a>
              <a className="secondaryButton" href={renderBundle.manifestUrl} target="_blank" rel="noreferrer">
                Open Metadata Package
              </a>
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel stack">
        <div className="panelHeader">
          <h2>Sleep Upload Packaging</h2>
          <span>channel-ready draft</span>
        </div>
        <div className="stack">
          <p>
            <strong>Suggested title:</strong> {metadata.title}
          </p>
          <p>
            <strong>Suggested description:</strong> {metadata.description}
          </p>
          <p>
            <strong>Suggested tags:</strong> {metadata.tags.join(", ")}
          </p>
        </div>
        <div className="sleepTemplateGrid">
          <article className="studioCard">
            <h3>Black Screen Template</h3>
            <p>Minimal visual, subtle waveform intro, sleep-first packaging.</p>
          </article>
          <article className="studioCard">
            <h3>Rain Window Template</h3>
            <p>Best fit for rain preset with soft parallax and low-contrast motion.</p>
          </article>
          <article className="studioCard">
            <h3>Ocean Drift Template</h3>
            <p>Slow animated glow and horizon-style motion for longer calming uploads.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
