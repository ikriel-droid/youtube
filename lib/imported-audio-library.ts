import { promises as fs } from "fs";
import path from "path";

export interface ImportedAudioRecord {
  id: string;
  title: string;
  sourceName: string;
  licenseNote: string;
  minutes: number;
  durationLabel: string;
  tags: string[];
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

interface ImportedAudioLibrary {
  records: ImportedAudioRecord[];
}

const defaultDataFile = path.join(process.cwd(), "data", "imported-audio-library.json");

export function getImportedAudioLibraryPath() {
  const configured = process.env.LOCALTUBE_IMPORTED_AUDIO_FILE?.trim();
  if (!configured) {
    return defaultDataFile;
  }

  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export async function listImportedAudioRecords() {
  const library = await readImportedAudioLibrary();
  return [...library.records].sort(
    (left, right) => Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt)
  );
}

export async function getImportedAudioRecordById(id: string) {
  const records = await listImportedAudioRecords();
  return records.find((record) => record.id === id) ?? null;
}

export async function getLatestImportedAudioRecord() {
  const records = await listImportedAudioRecords();
  return records[0] ?? null;
}

export async function addImportedAudioRecord(
  input: Omit<ImportedAudioRecord, "id" | "uploadedAt" | "durationLabel">
) {
  const library = await readImportedAudioLibrary();
  const record: ImportedAudioRecord = {
    id: `audio-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    uploadedAt: new Date().toISOString(),
    durationLabel: formatDuration(input.minutes),
    ...input
  };

  library.records.unshift(record);
  await writeImportedAudioLibrary(library);
  return record;
}

async function readImportedAudioLibrary(): Promise<ImportedAudioLibrary> {
  await ensureImportedAudioLibraryFile();
  const raw = await fs.readFile(getImportedAudioLibraryPath(), "utf8");
  const parsed = JSON.parse(raw) as Partial<ImportedAudioLibrary>;
  return {
    records: Array.isArray(parsed.records) ? parsed.records : []
  };
}

async function writeImportedAudioLibrary(library: ImportedAudioLibrary) {
  await fs.writeFile(
    getImportedAudioLibraryPath(),
    `${JSON.stringify(library, null, 2)}\n`,
    "utf8"
  );
}

async function ensureImportedAudioLibraryFile() {
  const file = getImportedAudioLibraryPath();
  await fs.mkdir(path.dirname(file), { recursive: true });

  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, `${JSON.stringify({ records: [] }, null, 2)}\n`, "utf8");
  }
}

function formatDuration(minutes: number) {
  return `${String(minutes).padStart(2, "0")}:00`;
}
