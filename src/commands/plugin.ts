import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { success } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export const pluginCommand = new Command('plugin')
  .description('Manage plugins');

pluginCommand
  .command('list')
  .description('List all installed plugins')
  .action(() => {
    try {
      const pluginsData = ConfigReader.readInstalledPlugins();
      if (!pluginsData) {
        console.log(chalk.dim('  No plugins installed.'));
        return;
      }

      const settings = ConfigReader.readSettings();
      const enabledPlugins = settings.enabledPlugins ?? {};
      const blocklist = ConfigReader.readBlocklist();

      console.log('');
      const entries = Object.entries(pluginsData.plugins);
      if (entries.length === 0) {
        console.log(chalk.dim('  No plugins installed.'));
      }
      for (const [pluginId, versions] of entries) {
        const isBlocked = pluginId in blocklist;
        const isEnabled = enabledPlugins[pluginId] === true;
        const status = isBlocked
          ? chalk.red('blocked')
          : isEnabled
            ? chalk.green('enabled')
            : chalk.dim('disabled');
        const latest = versions[versions.length - 1];
        console.log(`  ${pluginId} v${latest.version} (${status})`);
      }
      console.log('');
    } catch (err) {
      handleError(err);
    }
  });

pluginCommand
  .command('enable <pluginId>')
  .description('Enable a plugin')
  .action(async (pluginId: string) => {
    try {
      const settings = ConfigReader.readSettings();
      if (!settings.enabledPlugins) {
        settings.enabledPlugins = {};
      }
      settings.enabledPlugins[pluginId] = true;
      await ConfigWriter.writeSettings(settings);
      success(`Enabled plugin "${pluginId}"`);
    } catch (err) {
      handleError(err);
    }
  });

pluginCommand
  .command('disable <pluginId>')
  .description('Disable a plugin')
  .action(async (pluginId: string) => {
    try {
      const settings = ConfigReader.readSettings();
      if (settings.enabledPlugins) {
        settings.enabledPlugins[pluginId] = false;
      }
      await ConfigWriter.writeSettings(settings);
      success(`Disabled plugin "${pluginId}"`);
    } catch (err) {
      handleError(err);
    }
  });
