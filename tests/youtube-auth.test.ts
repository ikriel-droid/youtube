import assert from "node:assert/strict";
import test from "node:test";

import { getYouTubeOAuthConfig } from "../lib/youtube-auth";

test("youtube oauth config is disabled when client credentials are missing", () => {
  const previousClientId = process.env.GOOGLE_CLIENT_ID;
  const previousClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const previousBaseUrl = process.env.LOCALTUBE_BASE_URL;

  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.LOCALTUBE_BASE_URL;

  const config = getYouTubeOAuthConfig();
  assert.equal(config.configured, false);
  assert.match(config.redirectUri, /127\.0\.0\.1:3000/);

  restoreEnv("GOOGLE_CLIENT_ID", previousClientId);
  restoreEnv("GOOGLE_CLIENT_SECRET", previousClientSecret);
  restoreEnv("LOCALTUBE_BASE_URL", previousBaseUrl);
});

test("youtube oauth config derives redirect uri from base url", () => {
  const previousClientId = process.env.GOOGLE_CLIENT_ID;
  const previousClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const previousBaseUrl = process.env.LOCALTUBE_BASE_URL;

  process.env.GOOGLE_CLIENT_ID = "demo-client";
  process.env.GOOGLE_CLIENT_SECRET = "demo-secret";
  process.env.LOCALTUBE_BASE_URL = "https://sleep.localtube.dev";

  const config = getYouTubeOAuthConfig();
  assert.equal(config.configured, true);
  assert.equal(config.redirectUri, "https://sleep.localtube.dev/api/youtube/oauth/callback");

  restoreEnv("GOOGLE_CLIENT_ID", previousClientId);
  restoreEnv("GOOGLE_CLIENT_SECRET", previousClientSecret);
  restoreEnv("LOCALTUBE_BASE_URL", previousBaseUrl);
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
