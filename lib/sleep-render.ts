import {
  getSleepPresetLabel,
  getSleepReleasePresetLabel,
  type SleepPreset,
  type SleepReleasePreset
} from "@/lib/sleep-audio";

export interface SleepRenderInput {
  preset: SleepPreset;
  releasePreset: SleepReleasePreset;
  minutes: number;
  seed: string;
  title: string;
  description: string;
  tags: string[];
  channelName: string;
}

export interface SleepRenderManifest {
  title: string;
  description: string;
  tags: string[];
  pinnedComment: string;
  suggestedFilenameBase: string;
  releasePreset: SleepReleasePreset;
  renderModeLabel: string;
  channelName: string;
}

export function buildSleepRenderManifest(input: SleepRenderInput): SleepRenderManifest {
  const base = buildSleepFileBase(input);
  const renderModeLabel = getSleepReleasePresetLabel(input.releasePreset);

  return {
    title: input.title,
    description: input.description,
    tags: input.tags,
    pinnedComment: buildSleepPinnedComment(input),
    suggestedFilenameBase: base,
    releasePreset: input.releasePreset,
    renderModeLabel,
    channelName: input.channelName
  };
}

export function buildSleepPinnedComment(input: SleepRenderInput) {
  const preset = getSleepPresetLabel(input.preset);
  return [
    `Tonight's upload uses the ${preset} bed with the ${getSleepReleasePresetLabel(input.releasePreset)} package.`,
    `If you want a longer version, leave the next duration you want in the comments.`,
    `Sleep well.`
  ].join(" ");
}

export function buildSleepFileBase(input: SleepRenderInput) {
  return slugify(`${input.channelName}-${input.title}-${input.releasePreset}-${input.minutes}m`);
}

export function buildSleepThumbnailSvg(input: SleepRenderInput) {
  const background = getSleepGradient(input.releasePreset);
  const accent = getSleepAccent(input.releasePreset);
  const titleLines =
    input.releasePreset === "black-screen"
      ? wrapTitle(input.title, 28).slice(0, 3)
      : buildScenicTitleLines(input.title);
  const durationLabel = `${input.minutes} MINUTES`;
  const presetLabel = getSleepPresetLabel(input.preset).toUpperCase();
  const titleFontSize = input.releasePreset === "black-screen" ? 72 : 60;
  const titleStep = input.releasePreset === "black-screen" ? 96 : 76;

  const textLines = titleLines
    .map(
      (line, index) =>
        `<text x="90" y="${220 + index * titleStep}" fill="#f8fafc" font-size="${titleFontSize}" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${escapeXml(line)}</text>`
    )
    .join("");
  const scenicLead =
    input.releasePreset === "black-screen"
      ? ""
      : `<text x="92" y="470" fill="#cbd5e1" font-size="30" font-weight="500" font-family="Segoe UI, Arial, sans-serif">ambient sleep visual</text>`;

  return `
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${background[0]}"/>
      <stop offset="100%" stop-color="${background[1]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <circle cx="970" cy="190" r="260" fill="url(#glow)"/>
  <circle cx="1080" cy="560" r="180" fill="url(#glow)" opacity="0.45"/>
  <rect x="72" y="92" rx="999" ry="999" width="248" height="56" fill="rgba(255,255,255,0.12)"/>
  <text x="108" y="128" fill="#cbd5e1" font-size="28" font-weight="600" font-family="Segoe UI, Arial, sans-serif">LOCALTUBE SLEEP</text>
  ${textLines}
  ${scenicLead}
  <rect x="90" y="560" rx="24" ry="24" width="270" height="72" fill="rgba(15,23,42,0.58)" stroke="rgba(255,255,255,0.12)"/>
  <text x="128" y="608" fill="#f8fafc" font-size="34" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${durationLabel}</text>
  <rect x="388" y="560" rx="24" ry="24" width="320" height="72" fill="rgba(15,23,42,0.58)" stroke="rgba(255,255,255,0.12)"/>
  <text x="426" y="608" fill="#f8fafc" font-size="34" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${escapeXml(presetLabel)}</text>
</svg>`.trim();
}

function getSleepGradient(releasePreset: SleepReleasePreset) {
  switch (releasePreset) {
    case "black-screen":
      return ["#020617", "#0f172a"] as const;
    case "rain-window":
      return ["#0b1120", "#14304b"] as const;
    case "ocean-drift":
      return ["#04131b", "#0f3b52"] as const;
  }
}

function getSleepAccent(releasePreset: SleepReleasePreset) {
  switch (releasePreset) {
    case "black-screen":
      return "#818cf8";
    case "rain-window":
      return "#38bdf8";
    case "ocean-drift":
      return "#2dd4bf";
  }
}

function wrapTitle(text: string, maxChars: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current.length === 0 ? word : `${current} ${word}`;
    if (next.length > maxChars && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

function buildScenicTitleLines(title: string) {
  const [headline, support = ""] = title.split("|").map((part) => part.trim());
  const lines = wrapTitle(headline || title, 24).slice(0, 2);
  const supportLine = support.trim();

  if (supportLine) {
    return [...lines.slice(0, 1), supportLine.slice(0, 26)];
  }

  return lines;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
