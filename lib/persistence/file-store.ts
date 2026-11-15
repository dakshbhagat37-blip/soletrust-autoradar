import * as fs from "node:fs";
import * as path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), ".autoradar-data");

function ensureDataDir(): string {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  return DATA_DIR;
}

export function saveJsonToFile<T>(filename: string, data: T): void {
  try {
    const dir = ensureDataDir();
    const filePath = path.join(dir, filename);
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, serialized, "utf-8");
  } catch (err) {
    console.error(`[FileStore] Failed to save JSON to ${filename}:`, err);
  }
}

export function loadJsonFromFile<T>(filename: string, defaultValue: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.trim()) {
      return defaultValue;
    }
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`[FileStore] Failed to load JSON from ${filename}:`, err);
    return defaultValue;
  }
}
