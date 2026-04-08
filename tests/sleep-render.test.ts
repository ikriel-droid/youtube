import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSleepFileBase,
  buildSleepPinnedComment,
  buildSleepRenderManifest,
  buildSleepThumbnailSvg
} from "../lib/sleep-render";
import {
  buildLoopedImportedAudioArgs,
  buildVerificationSampleOffsets
} from "../lib/sleep-render-bundle";

const sampleInput = {
  preset: "rain" as const,
  releasePreset: "rain-window" as const,
  minutes: 30,
  seed: "night-window",
  title: "Rain Drift Sleep Music | 30 Minutes Rain Window Visual",
  description: "Soft rain ambience for an overnight wind-down.",
  tags: ["sleep music", "rain ambience", "night"],
  channelName: "Sleep Lab"
};

test("sleep render manifest includes filename, pinned comment, and metadata", () => {
  const manifest = buildSleepRenderManifest(sampleInput);

  assert.match(manifest.suggestedFilenameBase, /sleep-lab-rain-drift-sleep-music/);
  assert.match(manifest.pinnedComment, /Rain Drift/i);
  assert.equal(manifest.renderModeLabel, "Rain Window Visual");
  assert.deepEqual(manifest.tags, ["sleep music", "rain ambience", "night"]);
});

test("sleep thumbnail svg is sized for YouTube thumbnails", () => {
  const svg = buildSleepThumbnailSvg(sampleInput);

  assert.match(svg, /width="1280"/);
  assert.match(svg, /height="720"/);
  assert.match(svg, /Rain Drift Sleep Music/);
  assert.match(svg, /30 MINUTES/);
  assert.match(svg, /night rain/);
  assert.doesNotMatch(svg, /30 Minutes Rain Window Visual/);
});

test("sleep thumbnail overlay mode keeps text but skips the solid scenic background", () => {
  const svg = buildSleepThumbnailSvg(sampleInput, { backgroundMode: "overlay" });

  assert.match(svg, /width="1280"/);
  assert.match(svg, /Rain Drift Sleep Music/);
  assert.match(svg, /night rain/);
  assert.doesNotMatch(svg, /fill="url\(#bg\)"/);
  assert.match(svg, /fill="url\(#shade\)"/);
});

test("sleep file base is slugified and stable", () => {
  const base = buildSleepFileBase(sampleInput);
  assert.equal(base.includes(" "), false);
  assert.match(base, /sleep-lab/);
});

test("sleep pinned comment stays creator-ready", () => {
  const comment = buildSleepPinnedComment(sampleInput);

  assert.match(comment, /Rain Window Visual/);
  assert.match(comment, /night rain/i);
  assert.match(comment, /Sleep well/i);
});

test("imported audio render args loop short audio to the full target duration", () => {
  const args = buildLoopedImportedAudioArgs("input.ogg", "output.wav", 1800, 12.5);

  assert.deepEqual(args.slice(0, 7), ["-y", "-stream_loop", "-1", "-ss", "12.5", "-i", "input.ogg"]);
  assert.ok(args.includes("-t"));
  assert.ok(args.includes("1800"));
  assert.ok(args.includes("pcm_s16le"));
  assert.equal(args.at(-1), "output.wav");
});

test("render verification checks post-5-minute and tail samples for long videos", () => {
  assert.deepEqual(buildVerificationSampleOffsets(3600), [310, 3585]);
  assert.deepEqual(buildVerificationSampleOffsets(360), [310, 345]);
  assert.deepEqual(buildVerificationSampleOffsets(60), [45]);
});
