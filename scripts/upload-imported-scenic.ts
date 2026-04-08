import { readFile } from "node:fs/promises";
import path from "node:path";

import { buildImportedAudioUploadDraft } from "../lib/imported-audio-upload";
import {
  getImportedAudioRecordById,
  getLatestImportedAudioRecord
} from "../lib/imported-audio-library";
import {
  getImportedFootageRecordById,
  getLatestImportedFootageRecord
} from "../lib/imported-footage-library";
import { sleepChannelIdentity } from "../lib/sleep-launch-plan";
import { getAuthorizedOAuthClient } from "../lib/youtube-auth";
import { uploadSleepBundleToYouTube } from "../lib/youtube-upload";

async function main() {
  await loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  const authClient = await getAuthorizedOAuthClient();
  if (!authClient) {
    throw new Error("Connect YouTube first or make sure .env.local and youtube oauth tokens are available.");
  }

  const importedAudio = args.audioId
    ? await getImportedAudioRecordById(args.audioId)
    : await getLatestImportedAudioRecord();
  if (!importedAudio) {
    throw new Error("No imported audio record found.");
  }

  const importedFootage = args.footageId
    ? await getImportedFootageRecordById(args.footageId)
    : await getLatestImportedFootageRecord();

  const draft = buildImportedAudioUploadDraft(importedAudio);
  const result = await uploadSleepBundleToYouTube(authClient, {
    preset: draft.preset,
    releasePreset: draft.releasePreset,
    minutes: args.minutes ?? draft.minutes,
    seed: draft.seed,
    audioSourceUrl: importedAudio.fileUrl,
    footageSourceUrl: importedFootage?.fileUrl,
    title: args.title ?? draft.title,
    description: args.description ?? draft.description,
    tags: draft.tags,
    channelName: sleepChannelIdentity.channelName,
    privacyStatus: args.privacyStatus ?? "public"
  });

  console.log(
    JSON.stringify(
      {
        importedAudio: {
          id: importedAudio.id,
          title: importedAudio.title
        },
        importedFootage: importedFootage
          ? {
              id: importedFootage.id,
              title: importedFootage.title
            }
          : null,
        upload: result
      },
      null,
      2
    )
  );
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

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Keep going. The caller may already have env vars in the process.
  }
}

function parseArgs(argv: string[]) {
  const parsed: {
    title?: string;
    description?: string;
    privacyStatus?: "private" | "unlisted" | "public";
    minutes?: number;
    audioId?: string;
    footageId?: string;
  } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (!current.startsWith("--")) {
      continue;
    }

    switch (current) {
      case "--title":
        parsed.title = next;
        index += 1;
        break;
      case "--description":
        parsed.description = next;
        index += 1;
        break;
      case "--privacy":
        if (next === "private" || next === "unlisted" || next === "public") {
          parsed.privacyStatus = next;
        }
        index += 1;
        break;
      case "--minutes":
        parsed.minutes = Number(next);
        index += 1;
        break;
      case "--audio-id":
        parsed.audioId = next;
        index += 1;
        break;
      case "--footage-id":
        parsed.footageId = next;
        index += 1;
        break;
      default:
        break;
    }
  }

  return parsed;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
