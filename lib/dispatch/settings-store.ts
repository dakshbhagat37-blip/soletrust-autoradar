import * as fs from "node:fs";
import * as path from "node:path";
import { DEFAULT_STUDIO_SETTINGS, type StudioSettings } from "./types.ts";
import { logger } from "../logging/logger.ts";

const SETTINGS_FILE_PATH = path.join(process.cwd(), ".autoradar-data", "studio-settings.json");

let cachedSettings: StudioSettings | null = null;

export function getStudioSettings(): StudioSettings {
  if (cachedSettings) return cachedSettings;

  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      const merged: StudioSettings = { ...DEFAULT_STUDIO_SETTINGS, ...parsed };
      cachedSettings = merged;
      return merged;
    }
  } catch (err) {
    logger.debug(`Could not read settings file, using defaults: ${(err as Error).message}`, { context: "SettingsStore" });
  }

  const fallback: StudioSettings = { ...DEFAULT_STUDIO_SETTINGS };
  cachedSettings = fallback;
  return fallback;
}

export function updateStudioSettings(updates: Partial<StudioSettings>): StudioSettings {
  const current = getStudioSettings();
  cachedSettings = { ...current, ...updates };

  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(cachedSettings, null, 2), "utf-8");
  } catch (err) {
    logger.debug(`Could not persist settings file: ${(err as Error).message}`, { context: "SettingsStore" });
  }

  return cachedSettings;
}
