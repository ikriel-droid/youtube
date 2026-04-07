import test from "node:test";
import assert from "node:assert/strict";

import { getQuickPrivateTestConcept } from "../lib/sleep-launch-plan";

test("quick private test concept stays scenic and short for upload validation", () => {
  const concept = getQuickPrivateTestConcept();

  assert.equal(concept.id, "nature-quick-private");
  assert.equal(concept.minutes, 1);
  assert.match(concept.title, /\[Private Test\]/);
  assert.equal(concept.releasePreset, "ocean-drift");
});
