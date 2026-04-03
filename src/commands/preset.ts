import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { PresetSwitcher } from '../core/switcher.js';
import { printDiff } from '../core/diff.js';
import { success, spinner } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { interactivePresetMenu } from './interactive.js';
import { t } from '../i18n.js';

export const presetCommand = new Command('preset')
  .description(t('preset_desc'))
  .action(async () => {
    await interactivePresetMenu();
  });

presetCommand
  .command('list')
  .description(t('preset_list_desc'))
  .action(() => {
    const presets = ConfigReader.listPresets();
    if (presets.length === 0) {
      console.log(chalk.dim(t('preset_no_presets')));
      console.log(
        chalk.dim(t('preset_create_hint')),
      );
      return;
    }

    const active = ConfigReader.detectActivePreset();
    console.log('');
    for (const name of presets) {
      const isActive = name === active;
      const marker = isActive ? chalk.green('*') : ' ';
      const label = isActive
        ? chalk.green(t('preset_active_label', { name }))
        : chalk.white(name);
      console.log(`  ${marker} ${label}`);
    }
    console.log('');
  });

presetCommand
  .command('use <name>')
  .description(t('preset_use_desc'))
  .option('--no-backup', t('preset_no_backup_desc'))
  .action(async (name: string, opts: { backup: boolean }) => {
    try {
      const s = spinner(t('preset_switching', { name }));
      const { previous, current } = await PresetSwitcher.switchTo(name, {
        noBackup: !opts.backup,
      });
      s.succeed(t('preset_switched', { name }));
      PresetSwitcher.printSwitchSummary(previous, current);
    } catch (err) {
      handleError(err);
    }
  });

presetCommand
  .command('save <name>')
  .description(t('preset_save_desc'))
  .option('--from <file>', t('preset_from_desc'))
  .action(async (name: string, opts: { from?: string }) => {
    try {
      await PresetSwitcher.saveAs(name, opts.from);
      success(t('preset_saved', { name }));
    } catch (err) {
      handleError(err);
    }
  });

presetCommand
  .command('delete <name>')
  .description(t('preset_delete_desc'))
  .option('-y, --yes', t('preset_yes_desc'))
  .action(async (name: string, opts: { yes?: boolean }) => {
    try {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: t('preset_delete_confirm', { name }),
            default: false,
          },
        ]);
        if (!confirm) {
          console.log(chalk.dim(t('cancelled')));
          return;
        }
      }
      await ConfigWriter.deletePreset(name);
      success(t('preset_deleted', { name }));
    } catch (err) {
      handleError(err);
    }
  });

presetCommand
  .command('rename <oldName> <newName>')
  .description(t('preset_rename_desc'))
  .action(async (oldName: string, newName: string) => {
    try {
      await ConfigWriter.renamePreset(oldName, newName);
      success(t('preset_renamed', { oldName, newName }));
    } catch (err) {
      handleError(err);
    }
  });

presetCommand
  .command('diff <name1> <name2>')
  .description(t('preset_diff_desc'))
  .action(async (name1: string, name2: string) => {
    try {
      const preset1 = ConfigReader.readPreset(name1);
      const preset2 = ConfigReader.readPreset(name2);
      console.log('');
      printDiff(
        preset1 as Record<string, unknown>,
        preset2 as Record<string, unknown>,
        name1,
        name2,
      );
      console.log('');
    } catch (err) {
      handleError(err);
    }
  });
