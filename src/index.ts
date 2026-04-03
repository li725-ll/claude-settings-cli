import { Command } from 'commander';
import chalk from 'chalk';
import { presetCommand } from './commands/preset.js';
import { configCommand } from './commands/config.js';
import { pluginCommand } from './commands/plugin.js';
import { projectCommand } from './commands/project.js';
import { ioCommand, importCommand } from './commands/io.js';
import { backupCommand } from './commands/backup.js';
import { templateCommand } from './commands/template.js';
import { startRepl } from './commands/repl.js';
import { ConfigReader } from './core/reader.js';
import { maskValue } from './schema/settings.js';
import { t } from './i18n.js';

const program = new Command();

program
  .name('ccc')
  .description(t('prog_desc'))
  .version('1.0.0');

program.addCommand(presetCommand);
program.addCommand(configCommand);
program.addCommand(pluginCommand);
program.addCommand(projectCommand);
program.addCommand(ioCommand);
program.addCommand(importCommand);
program.addCommand(backupCommand);
program.addCommand(templateCommand);

program
  .command('current')
  .description(t('prog_current_desc'))
  .action(() => {
    try {
      const settings = ConfigReader.readSettings();
      const active = ConfigReader.detectActivePreset();

      console.log('');
      if (active) {
        console.log(chalk.green(t('prog_active_preset', { name: active })));
      } else {
        console.log(chalk.dim(t('prog_active_preset_custom')));
      }

      if (settings.env.ANTHROPIC_BASE_URL) {
        console.log(
          t('prog_base_url', { url: settings.env.ANTHROPIC_BASE_URL }),
        );
      }

      const models = [
        settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL,
        settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL,
        settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
      ].filter(Boolean);
      if (models.length > 0) {
        console.log(t('prog_models', { models: models.join(', ') }));
      }

      if (settings.env.ANTHROPIC_AUTH_TOKEN) {
        console.log(
          t('prog_token', { token: maskValue('TOKEN', settings.env.ANTHROPIC_AUTH_TOKEN) }),
        );
      }

      const pluginCount = settings.enabledPlugins
        ? Object.values(settings.enabledPlugins).filter(Boolean).length
        : 0;
      console.log(t('prog_plugins', { count: pluginCount }));

      console.log('');
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        console.log(chalk.yellow(t('prog_no_settings')));
      } else {
        throw err;
      }
    }
  });

// Show REPL when no arguments provided
if (process.argv.length <= 2) {
  startRepl();
} else {
  program.parse();
}
