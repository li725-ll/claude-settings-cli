import fs from 'fs-extra';
import { presetPath } from './paths.js';
import { ConfigReader } from './reader.js';
import { ConfigWriter } from './writer.js';
import { BackupManager } from '../utils/backup.js';
import { PresetNotFoundError } from '../utils/errors.js';
import { SETTINGS_FILE } from './paths.js';
import { SettingsSchema, type Settings } from '../schema/settings.js';
import { diffObjects } from './diff.js';
import { t } from '../i18n.js';

export class PresetSwitcher {
  static async switchTo(
    name: string,
    options?: { noBackup?: boolean },
  ): Promise<{ previous: Settings; current: Settings }> {
    const sourcePath = presetPath(name);
    if (!(await fs.pathExists(sourcePath))) {
      throw new PresetNotFoundError(name);
    }

    const previous = ConfigReader.readSettings();
    const preset = SettingsSchema.parse(await fs.readJson(sourcePath));

    await ConfigWriter.writeSettings(preset, options);

    return { previous, current: preset };
  }

  static async saveAs(
    name: string,
    source?: string,
  ): Promise<void> {
    const src = source ?? SETTINGS_FILE;
    const settings = SettingsSchema.parse(await fs.readJson(src));
    await ConfigWriter.savePreset(name, settings);
  }

  static printSwitchSummary(
    previous: Settings,
    current: Settings,
  ): void {
    const lines = diffObjects(
      previous as Record<string, unknown>,
      current as Record<string, unknown>,
    );
    if (lines.length === 0) {
      console.log(t('switcher_no_changes'));
    } else {
      for (const line of lines) {
        console.log(line);
      }
    }
  }
}
