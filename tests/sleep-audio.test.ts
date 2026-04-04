import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSleepMetadata,
  encodeMonoWav,
  exportSleepTrackWav,
  generateSleepTrackData,
  getSleepExportSpec,
  summarizeWaveform
} from "../lib/sleep-audio";

test("sleep metadata includes title, description, and tags", () => {
  const metadata = buildSleepMetadata(
    {
      preset: "rain",
      minutes: 3,
      seed: "night-rain"
    },
    {
      releasePreset: "rain-window"
    }
  );

  assert.match(metadata.title, /Rain Drift/i);
  assert.match(metadata.title, /Rain Window Visual/i);
  assert.ok(metadata.description.length > 40);
  assert.ok(metadata.tags.includes("sleep music"));
  assert.ok(metadata.tags.includes("rain ambience"));
});

test("sleep track generator creates deterministic sample length", () => {
  const samples = generateSleepTrackData(
    {
      preset: "deep-drone",
      minutes: 1,
      seed: "night-sky"
    },
    22_050
  );

  assert.equal(samples.length, 22_050 * 60);
  assert.ok(samples.some((sample) => Math.abs(sample) > 0.001));
});

test("wav encoder returns a non-empty audio blob", async () => {
  const samples = generateSleepTrackData(
    {
      preset: "brown-noise",
      minutes: 1,
      seed: "brown-seed"
    },
    8_000
  ).slice(0, 8_000);

  const blob = encodeMonoWav(samples, 8_000);
  assert.equal(blob.type, "audio/wav");
  assert.ok(blob.size > 44);
});

test("long-form export uses loop-friendly lower-rate spec", () => {
  const spec = getSleepExportSpec(60);
  assert.equal(spec.segmentMinutes, 5);
  assert.equal(spec.crossfadeSeconds, 10);
  assert.equal(spec.sampleRate, 8000);
});

test("sleep export returns a wav blob for long-form tracks", () => {
  const result = exportSleepTrackWav({
    preset: "ocean",
    minutes: 12,
    seed: "ocean-seed"
  });

  assert.equal(result.blob.type, "audio/wav");
  assert.equal(result.sampleRate, 12000);
  assert.ok(result.blob.size > 1000);
});

test("waveform summary returns the requested number of bars", () => {
  const samples = generateSleepTrackData(
    {
      preset: "rain",
      minutes: 1,
      seed: "wave-bars"
    },
    4000
  );

  const bars = summarizeWaveform(samples, 48);
  assert.equal(bars.length, 48);
  assert.ok(bars.some((bar) => bar > 0));
});
