import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSleepFileBase,
  buildSleepPinnedComment,
  buildSleepRenderManifest,
  buildSleepThumbnailSvg
} from "../lib/sleep-render";

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
