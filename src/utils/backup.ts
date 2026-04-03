import fs from 'fs-extra';
import path from 'node:path';
import { BACKUPS_DIR } from '../core/paths.js';
import { t } from '../i18n.js';

export class BackupManager {
  static async createBackup(filePath: string): Promise<string | null> {
    if (!(await fs.pathExists(filePath))) return null;

    await fs.ensureDir(BACKUPS_DIR);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const basename = path.basename(filePath, '.json');
    const backupPath = path.join(BACKUPS_DIR, `${basename}_${timestamp}.json`);

    await fs.copy(filePath, backupPath);
    return backupPath;
  }

  static listBackups(): string[] {
    try {
      return fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json')).sort().reverse();
    } catch {
      return [];
    }
  }

  static async restoreBackup(backupName: string, targetPath: string): Promise<void> {
    const backupPath = path.join(BACKUPS_DIR, backupName);
    if (!(await fs.pathExists(backupPath))) {
      throw new Error(t('util_backup_not_found', { name: backupName }));
    }
    await fs.copy(backupPath, targetPath);
  }
}
