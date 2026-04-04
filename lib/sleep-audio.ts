export type SleepPreset = "deep-drone" | "brown-noise" | "rain" | "ocean";
export type SleepReleasePreset = "black-screen" | "rain-window" | "ocean-drift";

export interface SleepTrackConfig {
  preset: SleepPreset;
  minutes: number;
  seed: string;
}

export interface SleepMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface SleepExportSpec {
  sampleRate: number;
  segmentMinutes: number;
  crossfadeSeconds: number;
  qualityLabel: string;
}

export interface SleepWavExport {
  blob: Blob;
  sampleRate: number;
  durationSeconds: number;
  qualityLabel: string;
}

const presetLabels: Record<SleepPreset, string> = {
  "deep-drone": "Deep Drone",
  "brown-noise": "Brown Noise",
  rain: "Rain Drift",
  ocean: "Ocean Breath"
};

const releasePresetProfiles: Record<
  SleepReleasePreset,
  {
    label: string;
    titleSuffix: string;
    descriptionLead: string;
    tags: string[];
  }
> = {
  "black-screen": {
    label: "Black Screen",
    titleSuffix: "Black Screen",
    descriptionLead: "Built for distraction-free sleep uploads with a minimal black-screen visual.",
    tags: ["black screen", "night sleep"]
  },
  "rain-window": {
    label: "Rain Window Visual",
    titleSuffix: "Rain Window Visual",
    descriptionLead: "Packaged for a slow rain-window visual with soft motion and low-contrast ambience.",
    tags: ["rain ambience", "window rain"]
  },
  "ocean-drift": {
    label: "Ocean Drift Visual",
    titleSuffix: "Ocean Drift Visual",
    descriptionLead: "Prepared for a calm ocean-drift visual with soft glow and horizon-style movement.",
    tags: ["ocean ambience", "sleep visual"]
  }
};

export function getSleepPresetLabel(preset: SleepPreset) {
  return presetLabels[preset];
}

export function getSleepReleasePresetLabel(preset: SleepReleasePreset) {
  return releasePresetProfiles[preset].label;
}

export function listSleepReleasePresets(): SleepReleasePreset[] {
  return ["black-screen", "rain-window", "ocean-drift"];
}

export function buildSleepMetadata(
  config: SleepTrackConfig,
  options?: { releasePreset?: SleepReleasePreset }
): SleepMetadata {
  const durationLabel = `${config.minutes} minute${config.minutes === 1 ? "" : "s"}`;
  const presetLabel = getSleepPresetLabel(config.preset);
  const releasePreset = options?.releasePreset ?? "black-screen";
  const releaseProfile = releasePresetProfiles[releasePreset];

  return {
    title: `${presetLabel} Sleep Music | ${durationLabel} ${releaseProfile.titleSuffix}`,
    description: `${releaseProfile.descriptionLead} A ${durationLabel} local sleep-audio track built with the ${presetLabel.toLowerCase()} preset. Use it as a first-pass sleep-music bed, loop it in an editor, or package it into a longer relaxation upload.`,
    tags: [
      ...new Set([
        "sleep music",
        "ambient",
        "relaxing",
        "deep sleep",
        config.preset.replace("-", " "),
        ...releaseProfile.tags
      ])
    ]
  };
}

export function getSleepExportSpec(minutes: number): SleepExportSpec {
  if (minutes >= 60) {
    return {
      sampleRate: 8_000,
      segmentMinutes: 5,
      crossfadeSeconds: 10,
      qualityLabel: "long-form export"
    };
  }

  if (minutes >= 30) {
    return {
      sampleRate: 9_000,
      segmentMinutes: 4,
      crossfadeSeconds: 8,
      qualityLabel: "extended export"
    };
  }

  if (minutes > 10) {
    return {
      sampleRate: 12_000,
      segmentMinutes: 3,
      crossfadeSeconds: 6,
      qualityLabel: "medium export"
    };
  }

  return {
    sampleRate: 22_050,
    segmentMinutes: Math.max(1, Math.min(3, minutes)),
    crossfadeSeconds: 4,
    qualityLabel: "full preview quality"
  };
}

export function generateSleepTrackData(
  config: SleepTrackConfig,
  sampleRate = 22_050
): Float32Array {
  const durationSeconds = Math.max(30, Math.min(config.minutes * 60, 600));
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(totalSamples);
  const rng = mulberry32(hashSeed(`${config.seed}:${config.preset}:${config.minutes}`));

  let brownState = 0;
  let rainState = 0;
  let oceanState = 0;
  const driftA = rng() * Math.PI * 2;
  const driftB = rng() * Math.PI * 2;

  let peak = 0;

  for (let index = 0; index < totalSamples; index += 1) {
    const t = index / sampleRate;
    const white = rng() * 2 - 1;

    brownState = (brownState + 0.02 * white) / 1.02;
    const brown = brownState * 3.2;

    rainState = rainState * 0.82 + white * 0.18;
    const rainNoise = rainState - white * 0.35;

    oceanState = oceanState * 0.985 + white * 0.015;
    const oceanNoise = oceanState * 2.4;

    const slowLfo = 0.5 + 0.5 * Math.sin(Math.PI * 2 * 0.04 * t + driftA);
    const slowerLfo = 0.5 + 0.5 * Math.sin(Math.PI * 2 * 0.015 * t + driftB);

    const droneA = Math.sin(Math.PI * 2 * 55 * t + 0.8 * Math.sin(Math.PI * 2 * 0.05 * t));
    const droneB = Math.sin(Math.PI * 2 * 82.5 * t + 0.3 * Math.sin(Math.PI * 2 * 0.03 * t));
    const droneC = Math.sin(Math.PI * 2 * 110 * t + 0.15 * Math.sin(Math.PI * 2 * 0.02 * t));

    let sample = 0;

    switch (config.preset) {
      case "deep-drone":
        sample = brown * 0.18 + droneA * 0.18 + droneB * 0.12 + droneC * 0.05 + slowLfo * 0.04;
        break;
      case "brown-noise":
        sample = brown * 0.33 + droneA * 0.05 + slowerLfo * 0.02;
        break;
      case "rain":
        sample =
          brown * 0.12 +
          rainNoise * 0.22 +
          droneA * 0.07 +
          Math.sin(Math.PI * 2 * 220 * t) * 0.01 * slowLfo;
        break;
      case "ocean":
        sample =
          oceanNoise * (0.16 + slowLfo * 0.08) +
          brown * 0.08 +
          droneA * 0.08 +
          droneB * 0.04 +
          slowerLfo * 0.03;
        break;
    }

    const fadeSeconds = 3;
    const fadeIn = Math.min(1, t / fadeSeconds);
    const fadeOut = Math.min(1, (durationSeconds - t) / fadeSeconds);
    const envelope = Math.min(fadeIn, fadeOut);

    sample *= envelope;
    samples[index] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  return normalizeSamples(samples, peak);
}

export function exportSleepTrackWav(config: SleepTrackConfig): SleepWavExport {
  const spec = getSleepExportSpec(config.minutes);
  const durationSeconds = Math.max(60, config.minutes * 60);

  if (config.minutes <= 10) {
    const samples = generateSleepTrackData(config, spec.sampleRate);
    return {
      blob: encodeMonoWav(samples, spec.sampleRate),
      sampleRate: spec.sampleRate,
      durationSeconds,
      qualityLabel: spec.qualityLabel
    };
  }

  const segmentCount = Math.max(2, Math.ceil(config.minutes / spec.segmentMinutes));
  const segments = Array.from({ length: segmentCount }, (_, index) =>
    generateSleepTrackData(
      {
        preset: config.preset,
        minutes: spec.segmentMinutes,
        seed: `${config.seed}-segment-${index + 1}`
      },
      spec.sampleRate
    )
  );

  const stitched = stitchSleepSegments(
    segments,
    durationSeconds,
    spec.sampleRate,
    spec.crossfadeSeconds
  );

  return {
    blob: encodeMonoWav(stitched, spec.sampleRate),
    sampleRate: spec.sampleRate,
    durationSeconds,
    qualityLabel: spec.qualityLabel
  };
}

export function summarizeWaveform(samples: Float32Array, barCount = 72) {
  const bars: number[] = [];
  const bucketSize = Math.max(1, Math.floor(samples.length / barCount));

  for (let bucket = 0; bucket < barCount; bucket += 1) {
    const start = bucket * bucketSize;
    const end = Math.min(samples.length, start + bucketSize);
    let peak = 0;

    for (let index = start; index < end; index += 1) {
      peak = Math.max(peak, Math.abs(samples[index] ?? 0));
    }

    bars.push(Number(peak.toFixed(4)));
  }

  return bars;
}

export function encodeMonoWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index] ?? 0));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function stitchSleepSegments(
  segments: Float32Array[],
  durationSeconds: number,
  sampleRate: number,
  crossfadeSeconds: number
) {
  const totalSamples = Math.floor(durationSeconds * sampleRate);
  const output = new Float32Array(totalSamples);
  const segmentLength = segments[0]?.length ?? 0;
  const crossfadeSamples = Math.min(segmentLength - 1, Math.floor(crossfadeSeconds * sampleRate));

  for (let index = 0; index < totalSamples; index += 1) {
    const absoluteProgress = index / totalSamples;
    const segmentIndex = Math.floor(index / segmentLength);
    const withinSegment = index % segmentLength;
    const current = segments[segmentIndex % segments.length];
    const next = segments[(segmentIndex + 1) % segments.length];

    let sample = current[withinSegment] ?? 0;

    if (withinSegment >= segmentLength - crossfadeSamples) {
      const fadeProgress =
        (withinSegment - (segmentLength - crossfadeSamples)) / Math.max(1, crossfadeSamples);
      const nextSample = next[(withinSegment - (segmentLength - crossfadeSamples)) % next.length] ?? 0;
      sample = sample * (1 - fadeProgress) + nextSample * fadeProgress;
    }

    const macroLfo = 0.92 + 0.08 * Math.sin(Math.PI * 2 * absoluteProgress * 3);
    output[index] = sample * macroLfo;
  }

  let peak = 0;
  for (let index = 0; index < output.length; index += 1) {
    peak = Math.max(peak, Math.abs(output[index] ?? 0));
  }

  return normalizeSamples(output, peak);
}

function normalizeSamples(samples: Float32Array, peak: number) {
  const gain = peak > 0 ? 0.82 / peak : 1;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] *= gain;
  }
  return samples;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function hashSeed(value: string) {
  let hash = 1779033703 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function mulberry32(seedFactory: () => number) {
  let state = seedFactory();
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
