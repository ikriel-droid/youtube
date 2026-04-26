import { readFile } from "node:fs/promises";
import path from "node:path";

import { exchangeCodeForToken } from "../lib/youtube-auth";

async function main() {
  await loadLocalEnv();

  const input = (process.argv.slice(2).join(" ").trim() || process.env.OAUTH_CALLBACK_URL?.trim() || "");
  if (!input) {
    throw new Error("Pass the full callback URL or a code value.");
  }

  let code = input;
  let state: string | undefined;

  if (input.startsWith("http://") || input.startsWith("https://")) {
    const url = new URL(input);
    code = url.searchParams.get("code") ?? "";
    state = url.searchParams.get("state") ?? undefined;
  }

  if (!code) {
    throw new Error("Could not find an OAuth code in the provided input.");
  }

  const result = await exchangeCodeForToken(code, state);
  console.log(JSON.stringify(result, null, 2));
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
    // ignore
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
