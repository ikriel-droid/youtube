import type { ImportedAudioRecord } from "@/lib/imported-audio-library";

export interface ImportedAudioUploadDraft {
  title: string;
  description: string;
  tags: string[];
  minutes: number;
  preset: "ocean";
  releasePreset: "ocean-drift";
  seed: string;
}

export function buildImportedAudioUploadDraft(
  record: ImportedAudioRecord
): ImportedAudioUploadDraft {
  const minutes = Math.min(Math.max(record.minutes, 1), 30);
  const scenicLead =
    minutes === 1 ? "1 Minute Soft Ocean Drift Visual" : `${minutes} Minutes Soft Ocean Drift Visual`;

  return {
    title: `${record.title} | ${scenicLead}`,
    description: [
      "A scenic ocean sleep upload built from licensed ambient source audio.",
      `Source: ${record.sourceName}.`,
      record.licenseNote
    ].join(" "),
    tags: normalizeTags([
      ...record.tags,
      "sleep music",
      "ocean ambience",
      "licensed audio",
      "scenic sleep"
    ]),
    minutes,
    preset: "ocean",
    releasePreset: "ocean-drift",
    seed: buildImportedSeed(record)
  };
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
}

function buildImportedSeed(record: ImportedAudioRecord) {
  const slug = record.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return `imported-${slug || record.id}`;
}
