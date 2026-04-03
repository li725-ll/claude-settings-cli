import fs from 'fs-extra';
import { SETTINGS_FILE, PRESETS_DIR, presetPath } from './paths.js';
import { BackupManager } from '../utils/backup.js';
import type { Settings } from '../schema/settings.js';
import { t } from '../i18n.js';

export class ConfigWriter {
  static async atomicWrite(
    filePath: string,
    data: unknown,
  ): Promise<void> {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    await fs.ensureDir(dir);
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
    await fs.ensureDir(PRESETS_DIR);
    await this.atomicWrite(presetPath(name), settings);
  }

  static async deletePreset(name: string): Promise<void> {
    await fs.remove(presetPath(name));
  }

  static async renamePreset(oldName: string, newName: string): Promise<void> {
    const oldPath = presetPath(oldName);
    const newPath = presetPath(newName);
    if (!(await fs.pathExists(oldPath))) {
      throw new Error(t('writer_preset_not_found', { name: oldName }));
    }
    if (await fs.pathExists(newPath)) {
      throw new Error(t('writer_preset_already_exists', { name: newName }));
    }
    await fs.move(oldPath, newPath);
  }
}
