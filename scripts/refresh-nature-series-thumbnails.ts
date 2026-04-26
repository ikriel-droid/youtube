import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

import { getAuthorizedOAuthClient } from "../lib/youtube-auth";
import { setYouTubeThumbnailFromPath } from "../lib/youtube-upload";

interface ThemeThumbnailSpec {
  key: string;
  videoId: string;
  footageFileName: string;
  frameSeconds: number;
  headlineLines: [string, string];
}

const FONT_REGULAR = "C\\:/Windows/Fonts/malgunsl.ttf";
const FONT_BOLD = "C\\:/Windows/Fonts/malgunbd.ttf";
const ACCENT_FILL = "#456e63";

const SPECS: ThemeThumbnailSpec[] = [
  {
    key: "forest",
    videoId: "SFJxRnk1O7o",
    footageFileName: "foggy-forest-motion-1775741289679.webm",
    frameSeconds: 46,
    headlineLines: ["깊은 숲속", "새소리"]
  },
  {
    key: "day-ocean",
    videoId: "sNB7BTSs99o",
    footageFileName: "sunny-day-ocean-shore-motion-1775743467908.webm",
    frameSeconds: 2.2,
    headlineLines: ["햇살 비치는", "낮 바다"]
  },
  {
    key: "mountain-wind",
    videoId: "hzjDhwblWcM",
    footageFileName: "steens-mountain-wind-motion-1775886682801.webm",
    frameSeconds: 2.2,
    headlineLines: ["깊은 산속", "바람소리"]
  },
  {
    key: "valley-stream",
    videoId: "aWldGQIC4Ac",
    footageFileName: "south-fork-creek-valley-motion-1775661819099.webm",
    frameSeconds: 2.2,
    headlineLines: ["맑은 계곡물", "소리"]
  },
  {
    key: "night-sea",
    videoId: "fOxjWxNz_nQ",
    footageFileName: "night-sea-shore-motion-1775896117340.webm",
    frameSeconds: 2.2,
    headlineLines: ["잔잔한", "밤바다"]
  },
  {
    key: "rain",
    videoId: "WGf9Wmvlh7g",
    footageFileName: "lost-lake-forest-rain-motion-1775659572611.webm",
    frameSeconds: 2.2,
    headlineLines: ["호숫가", "새소리"]
  },
  {
    key: "waterfall",
    videoId: "wc_OhY9jmOk",
    footageFileName: "forest-waterfall-cascade-motion-1775897198539.webm",
    frameSeconds: 1.2,
    headlineLines: ["시원한 폭포", "물소리"]
  },
  {
    key: "snow-forest",
    videoId: "YQyTEHGE7Kw",
    footageFileName: "snow-forest-still-motion-1775899873973.mp4",
    frameSeconds: 1,
    headlineLines: ["눈 덮인", "겨울 숲"]
  },
  {
    key: "meadow-breeze",
    videoId: "E_-kX5Q4K2o",
    footageFileName: "windblown-meadow-motion-1775901940500.webm",
    frameSeconds: 1.2,
    headlineLines: ["초원 위", "산들바람"]
  },
  {
    key: "lakeside-dusk",
    videoId: "R3IhAfYWxqs",
    footageFileName: "lakeside-dusk-still-motion-1775910730235.mp4",
    frameSeconds: 1,
    headlineLines: ["노을 지는", "호숫가"]
  }
];

async function main() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static is required for thumbnail refresh.");
  }

  await loadLocalEnv();

  const authClient = await getAuthorizedOAuthClient();
  if (!authClient) {
    throw new Error("Connect YouTube first or make sure oauth tokens are available.");
  }

  const publicDir = path.join(process.cwd(), "public");
  const footageDir = path.join(publicDir, "imported-footage");
  const outputDir = path.join(publicDir, "series-thumbnails");
  await mkdir(outputDir, { recursive: true });

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "localtube-thumb-refresh-"));

  try {
    const renderOnly = process.argv.includes("--render-only");
    const keys = new Set(
      process.argv
        .slice(2)
        .filter((value) => value !== "--render-only")
        .map((value) => value.trim())
        .filter(Boolean)
    );
    const targets = keys.size > 0 ? SPECS.filter((spec) => keys.has(spec.key)) : SPECS;

    if (targets.length === 0) {
      throw new Error(`No thumbnail specs matched the provided keys: ${Array.from(keys).join(", ")}`);
    }

    const results: Array<{ key: string; videoId: string; thumbnailPath: string }> = [];

    for (const [index, spec] of targets.entries()) {
      const footagePath = path.join(footageDir, spec.footageFileName);
      const framePath = path.join(tempDir, `${spec.key}-frame.png`);
      const thumbnailPath = path.join(outputDir, `${spec.key}.png`);

      await extractFrame({
        inputPath: footagePath,
        outputPath: framePath,
        seconds: spec.frameSeconds
      });

      await renderThumbnail({
        framePath,
        outputPath: thumbnailPath,
        spec
      });

      if (!renderOnly) {
        await setThumbnailWithRetry(authClient, {
          videoId: spec.videoId,
          thumbnailFilePath: thumbnailPath
        });

        if (index < targets.length - 1) {
          await sleep(150000);
        }
      }

      results.push({
        key: spec.key,
        videoId: spec.videoId,
        thumbnailPath
      });
    }

    console.log(JSON.stringify({ refreshed: results, renderOnly }, null, 2));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  try {
    const raw = await readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const idx = trimmed.indexOf("=");
      if (idx <= 0) {
        continue;
      }

      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // env already loaded
  }
}

async function extractFrame(input: {
  inputPath: string;
  outputPath: string;
  seconds: number;
}) {
  await runProcess(ffmpegPath!, [
    "-y",
    "-ss",
    String(input.seconds),
    "-i",
    input.inputPath,
    "-frames:v",
    "1",
    "-vf",
    "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720",
    input.outputPath
  ]);
}

async function renderThumbnail(input: {
  framePath: string;
  outputPath: string;
  spec: ThemeThumbnailSpec;
}) {
  const filter = buildThumbnailFilter(input.spec);
  await runProcess(ffmpegPath!, [
    "-y",
    "-i",
    input.framePath,
    "-vf",
    filter,
    "-frames:v",
    "1",
    input.outputPath
  ]);
}

function buildThumbnailFilter(spec: ThemeThumbnailSpec) {
  const headline1 = escapeDrawtext(spec.headlineLines[0]);
  const headline2 = escapeDrawtext(spec.headlineLines[1]);
  const badge = escapeDrawtext("NATURE ASMR");
  const duration = escapeDrawtext("1시간 반복");

  const parts = [
    "drawbox=x=0:y=0:w=1280:h=720:color=black@0.04:t=fill",
    "drawbox=x=44:y=514:w=1192:h=152:color=black@0.18:t=fill",
    `drawbox=x=58:y=58:w=224:h=54:color=${ACCENT_FILL}@0.82:t=fill`,
    `drawtext=fontfile='${FONT_BOLD}':text='${badge}':fontcolor=white:fontsize=24:x=82:y=73`,
    `drawtext=fontfile='${FONT_BOLD}':text='${duration}':fontcolor=white:fontsize=28:shadowcolor=black@0.45:shadowx=2:shadowy=2:x=1032:y=73`,
    `drawtext=fontfile='${FONT_REGULAR}':text='${headline1}':fontcolor=#f7f5ef:fontsize=64:shadowcolor=black@0.48:shadowx=2:shadowy=2:x=64:y=558`,
    `drawtext=fontfile='${FONT_BOLD}':text='${headline2}':fontcolor=#f7f5ef:fontsize=84:shadowcolor=black@0.48:shadowx=2:shadowy=2:x=60:y=632`,
    `drawbox=x=62:y=648:w=156:h=5:color=${ACCENT_FILL}@0.98:t=fill`
  ];

  return parts.join(",");
}

function escapeDrawtext(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll("%", "\\%")
    .replaceAll(",", "\\,");
}

async function runProcess(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `Process exited with code ${code}.`));
    });
  });
}

async function setThumbnailWithRetry(
  authClient: Awaited<ReturnType<typeof getAuthorizedOAuthClient>>,
  input: {
    videoId: string;
    thumbnailFilePath: string;
  }
) {
  const delays = [0, 60000, 180000];
  let lastError: unknown;

  for (const delay of delays) {
    if (delay > 0) {
      await sleep(delay);
    }

    try {
      return await setYouTubeThumbnailFromPath(authClient!, input);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("uploaded too many thumbnails recently")) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
