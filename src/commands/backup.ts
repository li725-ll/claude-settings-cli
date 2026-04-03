import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BackupManager } from '../utils/backup.js';
import { SETTINGS_FILE } from '../core/paths.js';
import { success } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export const backupCommand = new Command('backup')
  .description('Manage backups');

backupCommand
  .command('list')
  .description('List available backups')
  .action(() => {
    const backups = BackupManager.listBackups();
    console.log('');
    if (backups.length === 0) {
      console.log(chalk.dim('  No backups found.'));
    } else {
      for (const b of backups) {
        console.log(`  ${b}`);
      }
    }
    console.log('');
  });

backupCommand
  .command('restore [name]')
  .description('Restore a backup (interactive if no name provided)')
  .action(async (name?: string) => {
    try {
      const backups = BackupManager.listBackups();
      if (backups.length === 0) {
        console.log(chalk.dim('  No backups found.'));
        return;
      }

      let selected = name;
      if (!selected) {
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'backup',
            message: 'Select a backup to restore:',
            choices: backups,
          },
        ]);
        selected = answer.backup;
      }

      await BackupManager.restoreBackup(selected!, SETTINGS_FILE);
      success(`Restored backup "${selected}"`);
    } catch (err) {
      handleError(err);
    }
  });
