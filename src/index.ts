import { Command } from 'commander';
import chalk from 'chalk';
import { presetCommand } from './commands/preset.js';
import { configCommand } from './commands/config.js';
import { pluginCommand } from './commands/plugin.js';
import { projectCommand } from './commands/project.js';
import { ioCommand, importCommand } from './commands/io.js';
import { backupCommand } from './commands/backup.js';
import { ConfigReader } from './core/reader.js';
import { maskValue } from './schema/settings.js';

const program = new Command();

program
  .name('ccc')
  .description('Claude Code Config - manage your Claude Code configuration')
  .version('1.0.0');

program.addCommand(presetCommand);
program.addCommand(configCommand);
program.addCommand(pluginCommand);
program.addCommand(projectCommand);
program.addCommand(ioCommand);
program.addCommand(importCommand);
program.addCommand(backupCommand);

program
  .command('current')
  .description('Show current active configuration summary')
  .action(() => {
    try {
      const settings = ConfigReader.readSettings();
      const active = ConfigReader.detectActivePreset();

      console.log('');
      if (active) {
        console.log(chalk.green(`  Active preset: ${active}`));
      } else {
        console.log(chalk.dim('  Active preset: (custom)'));
      }

      if (settings.env.ANTHROPIC_BASE_URL) {
        console.log(
          `  Base URL: ${settings.env.ANTHROPIC_BASE_URL}`,
        );
      }

      const models = [
        settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL,
        settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL,
        settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
      ].filter(Boolean);
      if (models.length > 0) {
        console.log(`  Models: ${models.join(', ')}`);
      }

      if (settings.env.ANTHROPIC_AUTH_TOKEN) {
        console.log(
          `  Token: ${maskValue('TOKEN', settings.env.ANTHROPIC_AUTH_TOKEN)}`,
        );
      }

      const pluginCount = settings.enabledPlugins
        ? Object.values(settings.enabledPlugins).filter(Boolean).length
        : 0;
      console.log(`  Plugins: ${pluginCount} enabled`);

      console.log('');
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        console.log(chalk.yellow('  No settings.json found.'));
      } else {
        throw err;
      }
    }
  });

program.parse();
