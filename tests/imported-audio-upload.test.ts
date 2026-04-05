import assert from "node:assert/strict";
import test from "node:test";

import { buildImportedAudioUploadDraft } from "../lib/imported-audio-upload";

test("imported audio upload draft prefers scenic ocean packaging and caps length at 30 minutes", () => {
  const draft = buildImportedAudioUploadDraft({
    id: "audio-1",
    uploadedAt: "2026-04-05T10:21:10.488Z",
    durationLabel: "60:00",
    title: "Faroe Ocean Drift Ambient Sleep",
    sourceName: "Wikimedia Commons - Jarrod Stanley",
    licenseNote: "CC0 1.0 public domain field recording from Wikimedia Commons.",
    minutes: 60,
    tags: ["ambient sleep", "ocean drift", "field recording", "cc0"],
    fileUrl: "/api/generated-assets/imported-audio/faroe-ocean.mp3",
    fileName: "faroe-ocean.mp3"
  });

  assert.equal(draft.preset, "ocean");
  assert.equal(draft.releasePreset, "ocean-drift");
  assert.equal(draft.minutes, 30);
  assert.match(draft.title, /Soft Ocean Drift Visual/);
  assert.match(draft.description, /licensed ambient source audio/i);
  assert.ok(draft.tags.includes("licensed audio"));
  assert.ok(draft.tags.includes("sleep music"));
  assert.match(draft.seed, /^imported-/);
});
