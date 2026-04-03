import * as readline from 'node:readline';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { PresetSwitcher } from '../core/switcher.js';
import { TemplateManager } from '../core/templates.js';
import { maskValue } from '../schema/settings.js';
import { success, spinner } from '../utils/logger.js';

export async function startRepl(): Promise<void> {
  console.log('');
  console.log(chalk.cyan.bold('  Claude Code Config (ccc)'));
  console.log(chalk.dim('  Type /help for available commands'));
  console.log('');

  while (true) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'cmd',
        message: '>',
      },
    ]);

    const input = answer.cmd.trim();
    if (!input) continue;

    if (input.startsWith('/')) {
      const cmd = input.slice(1).toLowerCase();
      try {
        switch (cmd) {
          case 'preset':
            await handlePreset();
            break;
          case 'template':
            await handleTemplate();
            break;
          case 'current':
            handleCurrent();
            break;
          case 'help':
            printHelp();
            break;
          case 'quit':
          case 'exit':
            console.log(chalk.dim('  Bye!'));
            return;
          default:
            console.log(chalk.yellow(`  Unknown command: /${cmd}`));
            console.log(chalk.dim('  Type /help for available commands'));
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log(chalk.red(`  Error: ${err.message}`));
        }
      }
    } else {
      console.log(chalk.yellow(`  Unknown input: ${input}`));
      console.log(chalk.dim('  Type /help for available commands'));
    }

    console.log('');
  }
}

function printHelp(): void {
  console.log('');
  console.log(chalk.bold('  Available commands:'));
  console.log('  /preset    - List and switch presets');
  console.log('  /template  - List and apply templates');
  console.log('  /current   - Show current config');
  console.log('  /help      - Show this help');
  console.log('  /quit      - Exit');
}

function handleCurrent(): void {
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
      console.log(`  Base URL: ${settings.env.ANTHROPIC_BASE_URL}`);
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
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      console.log(chalk.yellow('  No settings.json found.'));
    } else {
      throw err;
    }
  }
}

async function handlePreset(): Promise<void> {
  const presets = ConfigReader.listPresets();
  const active = ConfigReader.detectActivePreset();

  console.log('');
  if (presets.length === 0) {
    console.log(chalk.dim('  No presets found.'));
    console.log(chalk.dim('  Use /template to create one from a template.'));
    return;
  }

  for (const name of presets) {
    const isActive = name === active;
    if (isActive) {
      console.log(chalk.green(`    ● ${name}  ← active`));
    } else {
      console.log(chalk.white(`    ○ ${name}`));
    }
  }
  console.log('');

  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Select a preset to switch:',
      choices: presets.map((p) => ({
        name: p === active ? chalk.green(`${p}  ← active`) : p,
        value: p,
      })),
    },
  ]);

  if (selected === active) {
    console.log(chalk.dim('  Already active.'));
    return;
  }

  const s = spinner(`Switching to "${selected}"...`);
  const { previous, current } = await PresetSwitcher.switchTo(selected);
  s.succeed(`Switched to preset "${selected}"`);
  PresetSwitcher.printSwitchSummary(previous, current);
}

async function handleTemplate(): Promise<void> {
  const templates = TemplateManager.listAll();

  console.log('');
  if (templates.length === 0) {
    console.log(chalk.dim('  No templates found.'));
    return;
  }

  for (const t of templates) {
    const tag = t.isBuiltin
      ? chalk.blue('[builtin]')
      : chalk.yellow('[custom] ');
    console.log(
      `    ${tag} ${chalk.white(t.name.padEnd(20))} ${chalk.dim(`- ${t.description}`)}`,
    );
  }
  console.log('');

  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Select a template to apply:',
      choices: templates.map((t) => ({
        name: `${t.isBuiltin ? '[builtin]' : '[custom] '} ${t.name} - ${t.description}`,
        value: t.name,
      })),
    },
  ]);

  const template = TemplateManager.find(selected)!;

  const values: Record<string, string> = {};
  for (const v of template.variables) {
    const { val } = await inquirer.prompt([
      {
        type: v.sensitive ? 'password' : 'input',
        name: 'val',
        message: `${v.description} (${v.key}):${v.defaultValue ? ` [${v.defaultValue}]` : ''}`,
        default: v.defaultValue,
        validate: (input: string) => {
          if (v.required && !input.trim()) return `${v.key} is required`;
          return true;
        },
      },
    ]);
    values[v.key] = val.trim() || v.defaultValue || '';
  }

  const rendered = TemplateManager.renderSettings(template, values);

  const presets = ConfigReader.listPresets();
  const { presetName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'presetName',
      message: 'Preset name:',
      validate: (v: string) => {
        if (!v.trim()) return 'Name is required';
        if (presets.includes(v.trim())) return 'Preset already exists';
        return true;
      },
    },
  ]);

  const s = spinner(`Creating preset "${presetName.trim()}"...`);
  await ConfigWriter.savePreset(presetName.trim(), rendered);
  s.succeed(`Created preset "${presetName.trim()}" from template "${template.name}"`);
}
