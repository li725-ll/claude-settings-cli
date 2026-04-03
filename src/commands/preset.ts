import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { PresetSwitcher } from '../core/switcher.js';
import { printDiff } from '../core/diff.js';
import { success, spinner } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export const presetCommand = new Command('preset')
  .description('Manage configuration presets');

presetCommand
  .command('list')
  .description('List all available presets')
  .action(() => {
    const presets = ConfigReader.listPresets();
    if (presets.length === 0) {
      console.log(chalk.dim('  No presets found.'));
      console.log(
        chalk.dim('  Create one with: ccc preset save <name>'),
      );
      return;
    }

    const active = ConfigReader.detectActivePreset();
    console.log('');
    for (const name of presets) {
      const isActive = name === active;
      const marker = isActive ? chalk.green('*') : ' ';
      const label = isActive
        ? chalk.green(`${name} (active)`)
        : chalk.white(name);
      console.log(`  ${marker} ${label}`);
    }
    console.log('');
  });

presetCommand
  .command('use <name>')
  .description('Switch to a preset')
  .option('--no-backup', 'Skip backup of current settings')
  .action(async (name: string, opts: { backup: boolean }) => {
    try {
      const s = spinner(`Switching to preset "${name}"...`);
      const { previous, current } = await PresetSwitcher.switchTo(name, {
        noBackup: !opts.backup,
      });
      s.succeed(`Switched to preset "${name}"`);
      PresetSwitcher.printSwitchSummary(previous, current);
    } catch (err) {
      handleError(err);
    }
  });

presetCommand
  .command('save <name>')
  .description('Save current settings as a preset')
  .option('--from <file>', 'Save from a specific file instead of current settings')
  .action(async (name: string, opts: { from?: string }) => {
    try {
      await PresetSwitcher.saveAs(name, opts.from);
      success(`Saved current settings as preset "${name}"`);
    } catch (err) {
      handleError(err);
    }
  });

presetCommand
  .command('delete <name>')
  .description('Delete a preset')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (name: string, opts: { yes?: boolean }) => {
    try {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete preset "${name}"?`,
            default: false,
          },
        ]);
        if (!confirm) {
          console.log(chalk.dim('Cancelled.'));
          return;
        }
      }
      await ConfigWriter.deletePreset(name);
      success(`Deleted preset "${name}"`);
    } catch (err) {
      handleError(err);
    }
  });

presetCommand
  .command('rename <oldName> <newName>')
  .description('Rename a preset')
  .action(async (oldName: string, newName: string) => {
    try {
      await ConfigWriter.renamePreset(oldName, newName);
      success(`Renamed preset "${oldName}" → "${newName}"`);
    } catch (err) {
      handleError(err);
    }
  });

presetCommand
  .command('diff <name1> <name2>')
  .description('Compare two presets')
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
