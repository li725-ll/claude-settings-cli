import fs from 'fs-extra';
import { SETTINGS_FILE, presetPath } from './paths.js';
import { BackupManager } from '../utils/backup.js';
import type { Settings } from '../schema/settings.js';

export class ConfigWriter {
  static async atomicWrite(
    filePath: string,
    data: unknown,
  ): Promise<void> {
    const tmp = filePath + '.tmp.' + Date.now();
    await fs.writeJson(tmp, data, { spaces: 2 });
    await fs.rename(tmp, filePath);
  }

  static async writeSettings(
    settings: Settings,
    options?: { noBackup?: boolean },
  ): Promise<void> {
    if (!options?.noBackup) {
      await BackupManager.createBackup(SETTINGS_FILE);
    }
    await this.atomicWrite(SETTINGS_FILE, settings);
  }

  static async savePreset(name: string, settings: Settings): Promise<void> {
    await this.atomicWrite(presetPath(name), settings);
  }

  static async deletePreset(name: string): Promise<void> {
    await fs.remove(presetPath(name));
  }

  static async renamePreset(oldName: string, newName: string): Promise<void> {
    const oldPath = presetPath(oldName);
    const newPath = presetPath(newName);
    if (!(await fs.pathExists(oldPath))) {
      throw new Error(`Preset "${oldName}" not found`);
    }
    if (await fs.pathExists(newPath)) {
      throw new Error(`Preset "${newName}" already exists`);
    }
    await fs.move(oldPath, newPath);
  }
}
