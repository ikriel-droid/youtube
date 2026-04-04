import assert from "node:assert/strict";
import test from "node:test";

import {
  firstSleepVideoConcepts,
  getFirstPublishReadyConcept,
  sleepChannelIdentity
} from "../lib/sleep-launch-plan";

test("sleep launch plan defines a concrete channel identity", () => {
  assert.match(sleepChannelIdentity.channelName, /Midnight Tide Sleep/);
  assert.match(sleepChannelIdentity.niche, /sleep/i);
});

test("sleep launch plan includes three concepts and a publish-ready target", () => {
  assert.equal(firstSleepVideoConcepts.length, 3);
  const concept = getFirstPublishReadyConcept();
  assert.match(concept.title, /Rain Drift Sleep Music/i);
  assert.equal(concept.releasePreset, "black-screen");
});
