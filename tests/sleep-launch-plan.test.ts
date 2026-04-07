import assert from "node:assert/strict";
import test from "node:test";

import {
  firstSleepVideoConcepts,
  getFirstPublishReadyConcept,
  sleepChannelIdentity
} from "../lib/sleep-launch-plan";

test("sleep launch plan defines a concrete channel identity", () => {
  assert.match(sleepChannelIdentity.channelName, /Midnight Tide Sleep/);
  assert.match(sleepChannelIdentity.niche, /forest|ocean|rain|waterfall/i);
});

test("sleep launch plan includes a 10-theme nature lineup and a publish-ready target", () => {
  assert.equal(firstSleepVideoConcepts.length, 10);
  const concept = getFirstPublishReadyConcept();
  assert.equal(concept.themeLabel, "Waterfall");
  assert.match(concept.title, /Waterfall Ambient Sleep/i);
  assert.equal(concept.releasePreset, "ocean-drift");
});
