import { appendFile } from "node:fs/promises";
import path from "node:path";

const uploadLogFile = path.join(process.cwd(), "localtube-youtube-upload.log");

export async function writeYouTubeUploadLog(event: string, payload: Record<string, unknown>) {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    event,
    ...payload
  });

  await appendFile(uploadLogFile, `${line}\n`, "utf8");
}
