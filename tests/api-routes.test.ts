import assert from "node:assert/strict";
import test from "node:test";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { POST as generateMetadata } from "../app/api/ai/metadata/route";
import { POST as createSleepTrack } from "../app/api/sleep-tracks/route";
import { POST as createVideo } from "../app/api/videos/route";
import { POST as createComment } from "../app/api/videos/[id]/comments/route";
import { POST as trackEngagement } from "../app/api/videos/[id]/engagement/route";

const seedPath = path.join(process.cwd(), "data", "library.seed.json");

test("upload route saves tags and publish state", async () => {
  await withTempLibrary(async (dataFile) => {
    const response = await createVideo(
      new Request("http://localtube.test/api/videos", {
        method: "POST",
        body: JSON.stringify({
          title: "Test upload",
          description: "A clean upload payload for tests.",
          channelName: "Test Channel",
          channelSlug: "test-channel",
          category: "creator",
          duration: "03:15",
          videoUrl: "https://samplelib.com/lib/preview/mp4/sample-30s.mp4",
          tags: "creator, testing, upload",
          status: "draft"
        })
      })
    );

    assert.equal(response.status, 200);
    const payload = (await response.json()) as { ok: boolean; videoId: string };
    assert.equal(payload.ok, true);

    const stored = JSON.parse(await readFile(dataFile, "utf8")) as {
      videos: Array<{ id: string; status: string; tags: string[] }>;
    };
    const created = stored.videos.find((video) => video.id === payload.videoId);

    assert.ok(created);
    assert.equal(created?.status, "draft");
    assert.deepEqual(created?.tags, ["creator", "testing", "upload"]);
  });
});

test("upload route blocks duplicate links", async () => {
  await withTempLibrary(async () => {
    const response = await createVideo(
      new Request("http://localtube.test/api/videos", {
        method: "POST",
        body: JSON.stringify({
          title: "Duplicate upload",
          description: "Trying to upload the same link again.",
          channelName: "Creator Stack",
          channelSlug: "creator-stack",
          category: "creator",
          duration: "04:00",
          videoUrl: "https://www.youtube.com/watch?v=ATfjufkgmx4",
          status: "published"
        })
      })
    );

    assert.equal(response.status, 409);
    const payload = (await response.json()) as { error: string };
    assert.match(payload.error, /already/i);
  });
});

test("comments route appends a new comment", async () => {
  await withTempLibrary(async (dataFile) => {
    const response = await createComment(
      new Request("http://localtube.test/api/videos/vid-ai-workflow/comments", {
        method: "POST",
        body: JSON.stringify({
          author: "TestAuthor",
          body: "This comment should land in the test library."
        })
      }),
      { params: { id: "vid-ai-workflow" } }
    );

    assert.equal(response.status, 200);
    const payload = (await response.json()) as { ok: boolean; comment: { author: string } };
    assert.equal(payload.ok, true);
    assert.equal(payload.comment.author, "TestAuthor");

    const stored = JSON.parse(await readFile(dataFile, "utf8")) as {
      videos: Array<{ id: string; comments: Array<{ author: string }> }>;
    };
    const video = stored.videos.find((item) => item.id === "vid-ai-workflow");
    assert.equal(video?.comments[0]?.author, "TestAuthor");
  });
});

test("engagement route increments views and likes", async () => {
  await withTempLibrary(async () => {
    const viewResponse = await trackEngagement(
      new Request("http://localtube.test/api/videos/vid-football-short/engagement", {
        method: "POST",
        body: JSON.stringify({ action: "view" })
      }),
      { params: { id: "vid-football-short" } }
    );
    assert.equal(viewResponse.status, 200);
    const viewPayload = (await viewResponse.json()) as { views: number };
    assert.ok(viewPayload.views > 30891);

    const likeResponse = await trackEngagement(
      new Request("http://localtube.test/api/videos/vid-football-short/engagement", {
        method: "POST",
        body: JSON.stringify({ action: "like" })
      }),
      { params: { id: "vid-football-short" } }
    );
    assert.equal(likeResponse.status, 200);
    const likePayload = (await likeResponse.json()) as { likes: number };
    assert.ok(likePayload.likes > 2415);
  });
});

test("metadata route returns category recommendation and shorts script", async () => {
  const response = await generateMetadata(
    new Request("http://localtube.test/api/ai/metadata", {
      method: "POST",
      body: JSON.stringify({
        idea: "football title race thumbnail ideas for recap shorts",
        category: "creator",
        channelName: "Touchline Room"
      })
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    suggestion: { recommendedCategory: string; shortsScript: string; recommendedTags: string[] };
  };
  assert.equal(payload.suggestion.recommendedCategory, "football");
  assert.ok(payload.suggestion.shortsScript.length > 20);
  assert.ok(payload.suggestion.recommendedTags.includes("football"));
});

test("sleep-track route saves generated audio and registers it in the library", async () => {
  await withTempEnvironment(async ({ dataFile, publicDir }) => {
    const response = await createSleepTrack(
      new Request("http://localtube.test/api/sleep-tracks", {
        method: "POST",
        body: JSON.stringify({
          preset: "rain",
          minutes: 1,
          seed: "night-window",
          releasePreset: "rain-window",
          title: "Custom Rain Sleep Upload",
          description: "Soft rain for an overnight sleep upload.",
          tags: ["sleep music", "rain ambience", "night"],
          channelName: "Sleep Channel",
          channelSlug: "sleep-channel",
          status: "draft"
        })
      })
    );

    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      ok: boolean;
      videoId: string;
      fileUrl: string;
    };
    assert.equal(payload.ok, true);

    const stored = JSON.parse(await readFile(dataFile, "utf8")) as {
      videos: Array<{
        id: string;
        category: string;
        videoUrl: string;
        title: string;
        channelSlug: string;
        status: string;
        tags: string[];
      }>;
    };
    const created = stored.videos.find((video) => video.id === payload.videoId);

    assert.ok(created);
    assert.equal(created?.category, "sleep");
    assert.equal(created?.videoUrl, payload.fileUrl);
    assert.equal(created?.title, "Custom Rain Sleep Upload");
    assert.equal(created?.channelSlug, "sleep-channel");
    assert.equal(created?.status, "draft");
    assert.deepEqual(created?.tags, ["sleep music", "rain ambience", "night"]);

    const savedFile = path.join(publicDir, ...payload.fileUrl.split("/").filter(Boolean));
    const audioBuffer = await readFile(savedFile);
    assert.ok(audioBuffer.byteLength > 1024);
  });
});

async function withTempLibrary(run: (dataFile: string) => Promise<void>) {
  await withTempEnvironment(async ({ dataFile }) => run(dataFile));
}

async function withTempEnvironment(
  run: (paths: { dataFile: string; publicDir: string }) => Promise<void>
) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "localtube-tests-"));
  const dataFile = path.join(tempDir, "library.json");
  const publicDir = path.join(tempDir, "public");
  await copyFile(seedPath, dataFile);
  process.env.LOCALTUBE_DATA_FILE = dataFile;
  process.env.LOCALTUBE_PUBLIC_DIR = publicDir;

  try {
    await run({ dataFile, publicDir });
  } finally {
    delete process.env.LOCALTUBE_DATA_FILE;
    delete process.env.LOCALTUBE_PUBLIC_DIR;
    await rm(tempDir, { recursive: true, force: true });
  }
}
