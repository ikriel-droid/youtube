import { promises as fs } from "fs";
import path from "path";

export interface ImportedFootageRecord {
  id: string;
  title: string;
  sourceName: string;
  licenseNote: string;
  tags: string[];
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

interface ImportedFootageLibrary {
  records: ImportedFootageRecord[];
}

const defaultDataFile = path.join(process.cwd(), "data", "imported-footage-library.json");

export function getImportedFootageLibraryPath() {
  const configured = process.env.LOCALTUBE_IMPORTED_FOOTAGE_FILE?.trim();
  if (!configured) {
    return defaultDataFile;
  }

  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export async function listImportedFootageRecords() {
  const library = await readImportedFootageLibrary();
  return [...library.records].sort(
    (left, right) => Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt)
  );
}

export async function getImportedFootageRecordById(id: string) {
  const records = await listImportedFootageRecords();
  return records.find((record) => record.id === id) ?? null;
}

export async function getLatestImportedFootageRecord() {
  const records = await listImportedFootageRecords();
  return records[0] ?? null;
}

export async function addImportedFootageRecord(
  input: Omit<ImportedFootageRecord, "id" | "uploadedAt">
) {
  const library = await readImportedFootageLibrary();
  const record: ImportedFootageRecord = {
    id: `footage-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    uploadedAt: new Date().toISOString(),
    ...input
  };

  library.records.unshift(record);
  await writeImportedFootageLibrary(library);
  return record;
}

async function readImportedFootageLibrary(): Promise<ImportedFootageLibrary> {
  await ensureImportedFootageLibraryFile();
  const raw = await fs.readFile(getImportedFootageLibraryPath(), "utf8");
  const parsed = JSON.parse(raw) as Partial<ImportedFootageLibrary>;
  return {
    records: Array.isArray(parsed.records) ? parsed.records : []
  };
}

async function writeImportedFootageLibrary(library: ImportedFootageLibrary) {
  await fs.writeFile(
    getImportedFootageLibraryPath(),
    `${JSON.stringify(library, null, 2)}\n`,
    "utf8"
  );
}

async function ensureImportedFootageLibraryFile() {
  const file = getImportedFootageLibraryPath();
  await fs.mkdir(path.dirname(file), { recursive: true });

  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, `${JSON.stringify({ records: [] }, null, 2)}\n`, "utf8");
  }
}
