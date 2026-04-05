import test from "node:test";
import assert from "node:assert/strict";

import { getQuickPrivateTestConcept } from "../lib/sleep-launch-plan";

test("quick private test concept shortens launch-01 for upload validation", () => {
  const concept = getQuickPrivateTestConcept();

  assert.equal(concept.id, "launch-01-quick");
  assert.equal(concept.minutes, 1);
  assert.match(concept.title, /\[Private Test\]/);
});
