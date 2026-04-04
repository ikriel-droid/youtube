"use client";

import { useMemo } from "react";

import {
  generateSleepTrackData,
  summarizeWaveform,
  type SleepPreset
} from "@/lib/sleep-audio";

interface SleepVisualizerProps {
  preset: SleepPreset;
  seed: string;
}

const visualThemeByPreset: Record<SleepPreset, { className: string; label: string }> = {
  "deep-drone": { className: "sleepVisual deepDrone", label: "Deep drone visual" },
  "brown-noise": { className: "sleepVisual brownNoise", label: "Brown noise visual" },
  rain: { className: "sleepVisual rainDrift", label: "Rain drift visual" },
  ocean: { className: "sleepVisual oceanBreath", label: "Ocean breath visual" }
};

export function SleepVisualizer({ preset, seed }: SleepVisualizerProps) {
  const bars = useMemo(() => {
    const preview = generateSleepTrackData(
      {
        preset,
        minutes: 1,
        seed
      },
      4_000
    ).slice(0, 4_000 * 20);

    return summarizeWaveform(preview, 72);
  }, [preset, seed]);

  const theme = visualThemeByPreset[preset];

  return (
    <section className="panel stack">
      <div className="panelHeader">
        <h2>Video Background Preview</h2>
        <span>ambient visualizer</span>
      </div>

      <div className={theme.className}>
        <div className="sleepVisualGlow" aria-hidden="true" />
        <div className="sleepVisualMist" aria-hidden="true" />
        <div className="sleepVisualOverlay">
          <span className="pill">{theme.label}</span>
          <strong>Loop-ready sleep backdrop</strong>
          <p>Use this as the visual direction for long-form sleep uploads.</p>
        </div>
      </div>

      <div className="waveformBars" aria-label="Sleep waveform preview">
        {bars.map((bar, index) => (
          <span
            key={`${preset}-${seed}-${index}`}
            className="waveformBar"
            style={{ height: `${Math.max(8, Math.round(bar * 140))}px` }}
          />
        ))}
      </div>
    </section>
  );
}
