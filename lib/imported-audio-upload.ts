import type { ImportedAudioRecord } from "@/lib/imported-audio-library";

export interface ImportedAudioUploadDraft {
  title: string;
  description: string;
  tags: string[];
  minutes: number;
  preset: "ocean" | "rain";
  releasePreset: "ocean-drift" | "rain-window";
  seed: string;
}

export function buildImportedAudioUploadDraft(
  record: ImportedAudioRecord
): ImportedAudioUploadDraft {
  const minutes = 60;
  const theme = detectImportedAudioTheme(record);
  const title = buildImportedTitle(theme, minutes);
  const description = buildImportedDescription(theme, record);

  return {
    title,
    description,
    tags: normalizeTags([
      ...record.tags,
      ...buildThemeTags(theme),
      "ambient sleep",
      "licensed audio",
      "scenic sleep"
    ]),
    minutes,
    preset: theme === "rain" ? "rain" : "ocean",
    releasePreset: theme === "rain" ? "rain-window" : "ocean-drift",
    seed: buildImportedSeed(record)
  };
}

type ImportedTheme = "ocean" | "rain" | "ambient";

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
}

function detectImportedAudioTheme(record: ImportedAudioRecord): ImportedTheme {
  const haystack =
    `${record.title} ${record.sourceName} ${record.licenseNote} ${record.tags.join(" ")}`.toLowerCase();

  if (/(ocean|wave|waves|sea|coast|coastal|waterfall|shore)/.test(haystack)) {
    return "ocean";
  }

  if (/(rain|storm|window|thunder|drizzle)/.test(haystack)) {
    return "rain";
  }

  return "ambient";
}

function buildImportedTitle(theme: ImportedTheme, minutes: number) {
  const durationLabel =
    minutes >= 60 ? "1-hour loop" : minutes === 1 ? "1 minute" : `${minutes} minutes`;

  switch (theme) {
    case "ocean":
      return `Ocean Ambient Sleep | Coastal Wave Drift | ${durationLabel}`;
    case "rain":
      return `Rain Window Ambient Sleep | Soft Night Drift | ${durationLabel}`;
    case "ambient":
      return `Ambient Sleep | Scenic Night Drift | ${durationLabel}`;
  }
}

function buildImportedDescription(theme: ImportedTheme, record: ImportedAudioRecord) {
  const lead =
    theme === "ocean"
      ? "Soft coastal wave ambience for sleep, wind down, and late-night rest."
      : theme === "rain"
        ? "Soft rain-window ambience for sleep, wind down, and quiet night focus."
        : "Soft scenic ambience for sleep, wind down, and low-stimulation late-night listening.";

  return [
    lead,
    "This upload uses licensed source audio so the texture feels more natural than the generated fallback path.",
    `Source: ${record.sourceName}.`,
    record.licenseNote
  ].join(" ");
}

function buildThemeTags(theme: ImportedTheme) {
  switch (theme) {
    case "ocean":
      return ["sleep music", "ocean ambience", "wave sounds", "coastal night"];
    case "rain":
      return ["sleep music", "rain ambience", "night rain", "window rain"];
    case "ambient":
      return ["sleep music", "ambient sleep", "night ambience"];
  }
}

function buildImportedSeed(record: ImportedAudioRecord) {
  const slug = record.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return `imported-${slug || record.id}`;
}
