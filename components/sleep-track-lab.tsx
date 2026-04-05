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
import {
  firstSleepVideoConcepts,
  getFirstPublishReadyConcept,
  sleepChannelIdentity
} from "@/lib/sleep-launch-plan";
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
const defaultPrimaryConcept = getFirstPublishReadyConcept();
const initialMetadata = buildSleepMetadata(
  {
    preset: defaultPrimaryConcept.preset,
    minutes: defaultPrimaryConcept.minutes,
    seed: defaultPrimaryConcept.seed
  },
  {
    releasePreset: defaultPrimaryConcept.releasePreset
  }
);

interface SleepTrackLabProps {
  initialConceptId?: string;
}

interface ImportedAudioRecord {
  id: string;
  title: string;
  sourceName: string;
  licenseNote: string;
  minutes: number;
  durationLabel: string;
  tags: string[];
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

function getInitialConcept(initialConceptId?: string) {
  return (
    firstSleepVideoConcepts.find((concept) => concept.id === initialConceptId) ??
    getFirstPublishReadyConcept()
  );
}

export function SleepTrackLab({ initialConceptId }: SleepTrackLabProps) {
  const initialConcept = getInitialConcept(initialConceptId);
  const [sourceMode, setSourceMode] = useState<"generated" | "imported">("generated");
  const [preset, setPreset] = useState<SleepPreset>(initialConcept.preset);
  const [releasePreset, setReleasePreset] = useState<SleepReleasePreset>(
    initialConcept.releasePreset
  );
  const [minutes, setMinutes] = useState(initialConcept.minutes);
  const [seed, setSeed] = useState(initialConcept.seed);
  const [channelName, setChannelName] = useState(sleepChannelIdentity.channelName);
  const [channelSlug, setChannelSlug] = useState(sleepChannelIdentity.channelSlug);
  const [publishState, setPublishState] = useState<PublishState>("published");
  const [title, setTitle] = useState(initialConcept.title ?? initialMetadata.title);
  const [description, setDescription] = useState(initialConcept.hook ?? initialMetadata.description);
  const [tagsInput, setTagsInput] = useState((initialConcept.tags ?? initialMetadata.tags).join(", "));
  const [metadataTouched, setMetadataTouched] = useState(Boolean(initialConcept));
  const [status, setStatus] = useState(
    initialConceptId
      ? `Loaded ${initialConcept.id} into Sleep Lab.`
      : `Defaulted to ${initialConcept.id} so the next batch starts scenic-first.`
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renderingBundle, setRenderingBundle] = useState(false);
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [savedVideoId, setSavedVideoId] = useState<string | null>(null);
  const [renderBundle, setRenderBundle] = useState<{
    videoUrl: string;
    thumbnailUrl: string;
    manifestUrl: string;
    suggestedFilenameBase: string;
  } | null>(null);
  const [importedAudioRecords, setImportedAudioRecords] = useState<ImportedAudioRecord[]>([]);
  const [selectedImportedAudioUrl, setSelectedImportedAudioUrl] = useState("");
  const [importingAudio, setImportingAudio] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importSourceName, setImportSourceName] = useState("");
  const [importLicenseNote, setImportLicenseNote] = useState("Licensed for channel use.");
  const [importMinutes, setImportMinutes] = useState(30);
  const [importTags, setImportTags] = useState("ambient sleep, licensed audio");
  const [importFile, setImportFile] = useState<File | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const importedPreviewRef = useRef<HTMLAudioElement | null>(null);

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
    let mounted = true;

    async function loadImportedAudio() {
      try {
        const response = await fetch("/api/imported-audio", { cache: "no-store" });
        const payload = (await response.json()) as { records: ImportedAudioRecord[] };
        if (mounted) {
          setImportedAudioRecords(payload.records ?? []);
        }
      } catch {
        if (mounted) {
          setStatus("Imported audio library could not be loaded.");
        }
      }
    }

    loadImportedAudio();
    return () => {
      mounted = false;
    };
  }, []);

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
    setStatus(
      sourceMode === "generated"
        ? "Building a 20-second preview..."
        : "Previewing the imported audio source..."
    );

    try {
      if (sourceMode === "imported") {
        const selectedImported = importedAudioRecords.find(
          (record) => record.fileUrl === selectedImportedAudioUrl
        );
        if (!selectedImported) {
          setPreviewing(false);
          setStatus("Pick an imported audio source first.");
          return;
        }

        const audio = new Audio(selectedImported.fileUrl);
        importedPreviewRef.current = audio;
        audio.currentTime = 0;
        await audio.play();
        window.setTimeout(() => {
          audio.pause();
          setPreviewing(false);
          setStatus("Imported-audio preview finished.");
        }, 20_000);
        setStatus("Imported-audio preview playing.");
        return;
      }

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
    if (sourceMode === "imported") {
      setStatus("Imported audio already exists as a source. Render the bundle or save the import instead.");
      return;
    }

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
          audioSourceUrl: sourceMode === "imported" ? selectedImportedAudioUrl : undefined,
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

  async function handleDownloadUploadBundle() {
    setDownloadingBundle(true);
    setStatus("Building a one-click upload bundle...");

    try {
      const response = await fetch("/api/sleep-upload-bundle", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          preset,
          releasePreset,
          minutes,
          seed,
          audioSourceUrl: sourceMode === "imported" ? selectedImportedAudioUrl : undefined,
          title: title.trim(),
          description: description.trim(),
          tags: tagsInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          channelName: channelName.trim()
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Upload bundle creation failed.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${channelSlug || "sleep-channel"}-${preset}-${minutes}m-upload-bundle.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setStatus("Upload bundle downloaded. MP4, thumbnail, manifest, and checklist are packed together.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload bundle creation failed.";
      setStatus(message);
    } finally {
      setDownloadingBundle(false);
    }
  }

  async function handleSave() {
    if (sourceMode === "imported") {
      setStatus("Imported audio is already saved through the import flow. Use Open Sleep Library to review it.");
      return;
    }

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
    importedPreviewRef.current?.pause();
    importedPreviewRef.current = null;
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

  async function handleImportAudio() {
    if (!importFile) {
      setStatus("Pick an audio file before importing.");
      return;
    }

    setImportingAudio(true);
    setStatus("Importing licensed audio into LocalTube...");

    try {
      const form = new FormData();
      form.set("file", importFile);
      form.set("title", importTitle.trim());
      form.set("sourceName", importSourceName.trim());
      form.set("licenseNote", importLicenseNote.trim());
      form.set("minutes", String(importMinutes));
      form.set("tags", importTags);
      form.set("channelName", channelName.trim());
      form.set("channelSlug", channelSlug.trim());
      form.set("status", publishState);

      const response = await fetch("/api/imported-audio", {
        method: "POST",
        body: form
      });
      const payload = (await response.json()) as {
        error?: string;
        record?: ImportedAudioRecord;
      };

      if (!response.ok || !payload.record) {
        throw new Error(payload.error || "Imported audio upload failed.");
      }

      const recordsResponse = await fetch("/api/imported-audio", { cache: "no-store" });
      const recordsPayload = (await recordsResponse.json()) as { records: ImportedAudioRecord[] };
      setImportedAudioRecords(recordsPayload.records ?? []);
      setSourceMode("imported");
      setSelectedImportedAudioUrl(payload.record.fileUrl);
      setMinutes(payload.record.minutes);
      setTitle(payload.record.title);
      setTagsInput(payload.record.tags.join(", "));
      setDescription(
        `${payload.record.sourceName}. ${payload.record.licenseNote}`
      );
      setStatus("Imported audio is now available in Sleep Lab and ready for scenic rendering.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Imported audio upload failed.");
    } finally {
      setImportingAudio(false);
    }
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
          <Link className="secondaryButton" href="/studio/audio-library">
            Open Audio Library
          </Link>
          <Link className="secondaryButton" href="/studio/sleep-launch">
            Open Sleep Launch Plan
          </Link>
        </div>
      </section>

      <SleepVisualizer preset={preset} seed={seed} />

      <section className="panel stack">
        <div className="panelHeader">
          <h2>Track Controls</h2>
          <span>local synth</span>
        </div>

        <div className="fieldGrid">
          <label>
            Audio source
            <select
              value={sourceMode}
              onChange={(event) => setSourceMode(event.target.value as "generated" | "imported")}
            >
              <option value="generated">Generated in Sleep Lab</option>
              <option value="imported">Imported licensed audio</option>
            </select>
          </label>
          {sourceMode === "imported" ? (
            <label>
              Imported source
              <select
                value={selectedImportedAudioUrl}
                onChange={(event) => setSelectedImportedAudioUrl(event.target.value)}
              >
                <option value="">Pick imported audio</option>
                {importedAudioRecords.map((record) => (
                  <option key={record.id} value={record.fileUrl}>
                    {record.title} · {record.durationLabel}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {sourceMode === "imported" ? (
          <div className="studioCard stack">
            <div className="panelHeader">
              <h3>Licensed Audio Import</h3>
              <span>quality-first source</span>
            </div>
            <div className="fieldGrid">
              <label>
                Audio file
                <input
                  type="file"
                  accept=".wav,.mp3,.m4a,audio/*"
                  onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <label>
                Imported title
                <input value={importTitle} onChange={(event) => setImportTitle(event.target.value)} />
              </label>
              <label>
                Source name
                <input
                  value={importSourceName}
                  onChange={(event) => setImportSourceName(event.target.value)}
                  placeholder="Licensed pack / composer / store"
                />
              </label>
              <label>
                License note
                <input
                  value={importLicenseNote}
                  onChange={(event) => setImportLicenseNote(event.target.value)}
                />
              </label>
              <label>
                Length in minutes
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={importMinutes}
                  onChange={(event) => setImportMinutes(Number(event.target.value))}
                />
              </label>
              <label>
                Import tags
                <input value={importTags} onChange={(event) => setImportTags(event.target.value)} />
              </label>
            </div>
            <div className="inlineActions">
              <button
                className="primaryButton"
                type="button"
                onClick={handleImportAudio}
                disabled={importingAudio}
              >
                {importingAudio ? "Importing Audio..." : "Import Licensed Audio"}
              </button>
              <Link className="secondaryButton" href="/studio/audio-library">
                Review Imported Audio
              </Link>
            </div>
          </div>
        ) : null}

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
            onClick={handleDownloadUploadBundle}
            disabled={downloadingBundle || renderingBundle || generating}
          >
            {downloadingBundle ? "Packing Upload Bundle..." : "Download Upload Bundle"}
          </button>
          <button
            className="secondaryButton"
            type="button"
            onClick={handleSave}
            disabled={saving || generating || !downloadUrl || sourceMode === "imported"}
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
              <button
                className="secondaryButton"
                type="button"
                onClick={handleDownloadUploadBundle}
                disabled={downloadingBundle}
              >
                {downloadingBundle ? "Packing Upload Bundle..." : "Download Upload Bundle"}
              </button>
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
