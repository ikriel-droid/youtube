import type { SleepPreset, SleepReleasePreset } from "@/lib/sleep-audio";

export interface SleepVideoConcept {
  id: string;
  title: string;
  preset: SleepPreset;
  releasePreset: SleepReleasePreset;
  minutes: number;
  seed: string;
  hook: string;
  angle: string;
  tags: string[];
}

export const sleepChannelIdentity = {
  channelName: "Midnight Tide Sleep",
  channelSlug: "midnight-tide-sleep",
  niche: "scenic ocean and rain-window sleep ambience for late-night wind-down listeners",
  tagline: "Soft-motion sleep ambience with calm scenic visuals and clean long-form packaging."
};

export const firstSleepVideoConcepts: SleepVideoConcept[] = [
  {
    id: "launch-01",
    title: "Rain Drift Sleep Music | 60 Minutes Black Screen For Deep Sleep",
    preset: "rain",
    releasePreset: "black-screen",
    minutes: 60,
    seed: "midnight-rain-long",
    hook: "A zero-distraction rain bed designed for sleep, not background browsing.",
    angle: "Best first upload because black-screen sleep videos are simple to package and easy to validate.",
    tags: ["sleep music", "black screen", "rain ambience", "deep sleep"]
  },
  {
    id: "launch-02",
    title: "Ocean Breath Sleep Music | 30 Minutes Soft Ocean Drift Visual",
    preset: "ocean",
    releasePreset: "ocean-drift",
    minutes: 30,
    seed: "horizon-ocean-soft",
    hook: "A calmer visual-led upload for viewers who want a little motion instead of pure black screen.",
    angle: "Good A/B follow-up against the black-screen version to test if visuals help CTR.",
    tags: ["sleep music", "ocean ambience", "calming sleep", "night routine"]
  },
  {
    id: "launch-03",
    title: "Brown Noise Sleep Music | 30 Minutes Rain Window Visual For Focus And Sleep",
    preset: "brown-noise",
    releasePreset: "rain-window",
    minutes: 30,
    seed: "brown-window-night",
    hook: "A crossover upload that can pick up both sleep and focus intent.",
    angle: "Useful for testing whether brown-noise packaging broadens search entry points.",
    tags: ["brown noise", "sleep music", "focus sound", "rain window"]
  }
];

export const firstPublishReadyConceptId = "launch-02";

export function getFirstPublishReadyConcept() {
  return firstSleepVideoConcepts.find((concept) => concept.id === firstPublishReadyConceptId)!;
}

export function getQuickPrivateTestConcept(): SleepVideoConcept {
  const base = getFirstPublishReadyConcept();
  return {
    ...base,
    id: "launch-01-quick",
    title: "[Private Test] Rain Drift Sleep Music | 1 Minute Black Screen",
    minutes: 1,
    seed: `${base.seed}-quick-private-test`,
    hook: "A fast private test render used to validate the YouTube upload path before the full-length release."
  };
}
