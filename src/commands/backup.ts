import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BackupManager } from '../utils/backup.js';
import { SETTINGS_FILE } from '../core/paths.js';
import { success } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { t } from '../i18n.js';

export const backupCommand = new Command('backup')
  .description(t('backup_desc'));

backupCommand
  .command('list')
  .description(t('backup_list_desc'))
  .action(() => {
    const backups = BackupManager.listBackups();
    console.log('');
    if (backups.length === 0) {
      console.log(chalk.dim(t('backup_no_backups')));
    } else {
      for (const b of backups) {
        console.log(`  ${b}`);
      }
    }
    console.log('');
  });

backupCommand
  .command('restore [name]')
  .description(t('backup_restore_desc'))
  .action(async (name?: string) => {
    try {
      const backups = BackupManager.listBackups();
      if (backups.length === 0) {
        console.log(chalk.dim(t('backup_no_backups')));
        return;
      }

      let selected = name;
      if (!selected) {
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'backup',
            message: t('backup_select_prompt'),
            choices: backups,
          },
        ]);
        selected = answer.backup;
      }

      await BackupManager.restoreBackup(selected!, SETTINGS_FILE);
      success(t('backup_restored', { name: selected! }));
    } catch (err) {
      handleError(err);
    }
  });
