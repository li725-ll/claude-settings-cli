import fs from 'fs-extra';
import {
  SETTINGS_FILE,
  presetPath,
  scanPresetNames,
  INSTALLED_PLUGINS_FILE,
  BLOCKLIST_FILE,
} from './paths.js';
import { SettingsSchema, type Settings } from '../schema/settings.js';
import {
  InstalledPluginsSchema,
  BlocklistSchema,
} from '../schema/plugins.js';
import { readJsonSafe, readJsonSafeSync } from '../utils/safe-json.js';
import type { InstalledPlugins, Blocklist } from '../types/index.js';

export class ConfigReader {
  static readSettings(): Settings {
    const raw = readJsonSafeSync(SETTINGS_FILE);
    return SettingsSchema.parse(raw);
  }

  static async readSettingsAsync(): Promise<Settings> {
    const raw = await readJsonSafe(SETTINGS_FILE);
    return SettingsSchema.parse(raw);
  }

  static readPreset(name: string): Settings {
    const raw = readJsonSafeSync(presetPath(name));
    return SettingsSchema.parse(raw);
  }

  static async readPresetAsync(name: string): Promise<Settings> {
    const raw = await readJsonSafe(presetPath(name));
    return SettingsSchema.parse(raw);
  }

  static listPresets(): string[] {
    return scanPresetNames();
  }

  static readInstalledPlugins(): InstalledPlugins | null {
    try {
      const raw = readJsonSafeSync(INSTALLED_PLUGINS_FILE);
      return InstalledPluginsSchema.parse(raw);
    } catch {
      return null;
    }
  }

  static readBlocklist(): Blocklist {
    try {
      const raw = readJsonSafeSync(BLOCKLIST_FILE);
      return BlocklistSchema.parse(raw);
    } catch {
      return {};
    }
  }

  static detectActivePreset(): string | null {
    try {
      const current = readJsonSafeSync<Record<string, unknown>>(SETTINGS_FILE);
      const presets = scanPresetNames();
      for (const name of presets) {
        try {
          const preset = readJsonSafeSync<Record<string, unknown>>(
            presetPath(name),
          );
          if (JSON.stringify(current) === JSON.stringify(preset)) {
            return name;
          }
        } catch {
          continue;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}
