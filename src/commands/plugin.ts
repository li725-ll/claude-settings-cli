import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { success } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { t } from '../i18n.js';

export const pluginCommand = new Command('plugin')
  .description(t('plugin_desc'));

pluginCommand
  .command('list')
  .description(t('plugin_list_desc'))
  .action(() => {
    try {
      const pluginsData = ConfigReader.readInstalledPlugins();
      if (!pluginsData) {
        console.log(chalk.dim(t('plugin_none')));
        return;
      }

      const settings = ConfigReader.readSettings();
      const enabledPlugins = settings.enabledPlugins ?? {};
      const blocklist = ConfigReader.readBlocklist();

      console.log('');
      const entries = Object.entries(pluginsData.plugins);
      if (entries.length === 0) {
        console.log(chalk.dim(t('plugin_none')));
      }
      for (const [pluginId, versions] of entries) {
        const isBlocked = pluginId in blocklist;
        const isEnabled = enabledPlugins[pluginId] === true;
        const status = isBlocked
          ? chalk.red(t('plugin_blocked'))
          : isEnabled
            ? chalk.green(t('plugin_enabled'))
            : chalk.dim(t('plugin_disabled'));
        const latest = versions[versions.length - 1];
        console.log(t('plugin_entry', { id: pluginId, version: latest.version, status }));
      }
      console.log('');
    } catch (err) {
      handleError(err);
    }
  });

pluginCommand
  .command('enable <pluginId>')
  .description(t('plugin_enable_desc'))
  .action(async (pluginId: string) => {
    try {
      const settings = ConfigReader.readSettings();
      if (!settings.enabledPlugins) {
        settings.enabledPlugins = {};
      }
      settings.enabledPlugins[pluginId] = true;
      await ConfigWriter.writeSettings(settings);
      success(t('plugin_enabled_success', { id: pluginId }));
    } catch (err) {
      handleError(err);
    }
  });

pluginCommand
  .command('disable <pluginId>')
  .description(t('plugin_disable_desc'))
  .action(async (pluginId: string) => {
    try {
      const settings = ConfigReader.readSettings();
      if (settings.enabledPlugins) {
        settings.enabledPlugins[pluginId] = false;
      }
      await ConfigWriter.writeSettings(settings);
      success(t('plugin_disabled_success', { id: pluginId }));
    } catch (err) {
      handleError(err);
    }
  });
