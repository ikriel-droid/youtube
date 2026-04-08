import { NextResponse } from "next/server";

import { getImportedAudioRecordById, getLatestImportedAudioRecord } from "@/lib/imported-audio-library";
import { getImportedFootageRecordById, getLatestImportedFootageRecord } from "@/lib/imported-footage-library";
import { buildImportedAudioUploadDraft } from "@/lib/imported-audio-upload";
import { getAuthorizedOAuthClient } from "@/lib/youtube-auth";
import {
  firstSleepVideoConcepts,
  getQuickPrivateTestConcept,
  sleepChannelIdentity
} from "@/lib/sleep-launch-plan";
import { writeYouTubeUploadLog } from "@/lib/youtube-upload-log";
import { uploadSleepBundleToYouTube } from "@/lib/youtube-upload";

export async function POST(request: Request) {
  const authClient = await getAuthorizedOAuthClient();
  if (!authClient) {
    return NextResponse.json({ error: "Connect YouTube first." }, { status: 401 });
  }

  const body = (await request.json()) as {
    mode?: "concept" | "imported-audio-scenic";
    conceptId?: string;
    importedAudioId?: string;
    importedFootageId?: string;
    audioTrimStartSeconds?: number;
    footageTrimStartSeconds?: number;
    privacyStatus?: "private" | "unlisted" | "public";
    titleOverride?: string;
    descriptionOverride?: string;
    tagsOverride?: string[];
  };

  const mode = body.mode ?? "concept";

  try {
    if (mode === "imported-audio-scenic") {
      const importedAudio = body.importedAudioId
        ? await getImportedAudioRecordById(body.importedAudioId)
        : await getLatestImportedAudioRecord();

      if (!importedAudio) {
        return NextResponse.json(
          { error: "Import licensed audio in Sleep Lab before using scenic YouTube upload." },
          { status: 404 }
        );
      }

      const draft = buildImportedAudioUploadDraft(importedAudio);
      const importedFootage = body.importedFootageId
        ? await getImportedFootageRecordById(body.importedFootageId)
        : await getLatestImportedFootageRecord();
      const title = body.titleOverride?.trim() || draft.title;
      const description = body.descriptionOverride?.trim() || draft.description;
      const tags =
        body.tagsOverride
          ?.map((item) => item.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 10) || draft.tags;

      await writeYouTubeUploadLog("upload_attempt", {
        conceptId: `imported-audio:${importedAudio.id}`,
        title,
        privacyStatus: body.privacyStatus ?? "private"
      });

      const result = await uploadSleepBundleToYouTube(authClient, {
        preset: draft.preset,
        releasePreset: draft.releasePreset,
        minutes: draft.minutes,
        seed: draft.seed,
        audioSourceUrl: importedAudio.fileUrl,
        footageSourceUrl: importedFootage?.fileUrl,
        audioTrimStartSeconds:
          typeof body.audioTrimStartSeconds === "number" ? body.audioTrimStartSeconds : undefined,
        footageTrimStartSeconds:
          typeof body.footageTrimStartSeconds === "number" ? body.footageTrimStartSeconds : undefined,
        title,
        description,
        tags,
        channelName: sleepChannelIdentity.channelName,
        privacyStatus: body.privacyStatus ?? "private"
      });

      await writeYouTubeUploadLog("upload_success", {
        conceptId: `imported-audio:${importedAudio.id}`,
        title: result.lastUpload?.title ?? draft.title,
        videoId: result.videoId,
        privacyStatus: result.lastUpload?.privacyStatus ?? (body.privacyStatus ?? "private"),
        youtubeWatchUrl: result.youtubeWatchUrl
      });

      return NextResponse.json({
        ok: true,
        mode,
        importedAudio,
        ...result
      });
    }

    const concept =
      body.conceptId === "launch-01-quick" || body.conceptId === "nature-quick-private"
        ? getQuickPrivateTestConcept()
        : firstSleepVideoConcepts.find((item) => item.id === body.conceptId) ?? firstSleepVideoConcepts[0];

    await writeYouTubeUploadLog("upload_attempt", {
      conceptId: concept.id,
      title: concept.title,
      privacyStatus: body.privacyStatus ?? "private"
    });

    const result = await uploadSleepBundleToYouTube(authClient, {
      preset: concept.preset,
      releasePreset: concept.releasePreset,
      minutes: concept.minutes,
      seed: concept.seed,
      title: concept.title,
      description: concept.hook,
      tags: concept.tags,
      channelName: sleepChannelIdentity.channelName,
      privacyStatus: body.privacyStatus ?? "private"
    });

    await writeYouTubeUploadLog("upload_success", {
      conceptId: concept.id,
      title: result.lastUpload?.title ?? concept.title,
      videoId: result.videoId,
      privacyStatus: result.lastUpload?.privacyStatus ?? (body.privacyStatus ?? "private"),
      youtubeWatchUrl: result.youtubeWatchUrl
    });

    return NextResponse.json({
      ok: true,
      mode,
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube upload failed.";
    await writeYouTubeUploadLog("upload_error", {
      conceptId: body.mode === "imported-audio-scenic" ? `imported-audio:${body.importedAudioId ?? "latest"}` : body.conceptId ?? "launch-default",
      title: body.mode === "imported-audio-scenic" ? "Imported scenic upload" : body.conceptId ?? "Launch upload",
      privacyStatus: body.privacyStatus ?? "private",
      error: message
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
