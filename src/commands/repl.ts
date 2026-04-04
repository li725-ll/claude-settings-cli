import chalk from 'chalk';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { PresetSwitcher } from '../core/switcher.js';
import { TemplateManager } from '../core/templates.js';
import { runCreate } from './create.js';
import { runEdit } from './edit.js';
import { maskValue } from '../schema/settings.js';
import { success, spinner } from '../utils/logger.js';
import { promptWithAbort, AbortError } from '../utils/prompt.js';
import { t } from '../i18n.js';

export async function startRepl(): Promise<void> {
  console.log('');
  console.log(chalk.cyan.bold(t('repl_banner')));
  console.log(chalk.dim(t('repl_hint')));
  console.log('');

  while (true) {
    let answer: { cmd: string };
    try {
      answer = await promptWithAbort<{ cmd: string }>([
        {
          type: 'input',
          name: 'cmd',
          message: t('repl_prompt'),
        },
      ]);
    } catch (err) {
      if (err instanceof AbortError) continue;
      throw err;
    }

    const input = (answer.cmd ?? '').trim();
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
          case 'create':
            await runCreate();
            break;
          case 'edit': {
            const args = cmd.split(/\s+/).slice(1);
            await runEdit(args[0] || undefined);
            break;
          }
          case 'delete':
            await handleDelete();
            break;
          case 'current':
            handleCurrent();
            break;
          case 'help':
            printHelp();
            break;
          case 'quit':
          case 'exit':
            console.log(chalk.dim(t('repl_bye')));
            return;
          default:
            console.log(chalk.yellow(t('repl_unknown_cmd', { cmd })));
            console.log(chalk.dim(t('repl_hint')));
        }
      } catch (err) {
        if (err instanceof AbortError) {
          console.log('');
          console.log(chalk.dim(t('repl_aborted')));
        } else if (err instanceof Error) {
          console.log(chalk.red(t('repl_error', { msg: err.message })));
        }
      }
    } else {
      console.log(chalk.yellow(t('repl_unknown_input', { input })));
      console.log(chalk.dim(t('repl_hint')));
    }

    console.log('');
  }
}

function printHelp(): void {
  console.log('');
  console.log(chalk.bold(t('repl_help_title')));
  console.log(t('repl_help_preset'));
  console.log(t('repl_help_template'));
  console.log(t('repl_help_create'));
  console.log(t('repl_help_edit'));
  console.log(t('repl_help_delete'));
  console.log(t('repl_help_current'));
  console.log(t('repl_help_help'));
  console.log(t('repl_help_quit'));
}

function handleCurrent(): void {
  try {
    const settings = ConfigReader.readSettings();
    const active = ConfigReader.detectActivePreset();

    console.log('');
    if (active) {
      console.log(chalk.green(`  ${t('prog_active_preset', { name: active }).trim()}`));
    } else {
      console.log(chalk.dim(`  ${t('prog_active_preset_custom').trim()}`));
    }

    if (settings.env.ANTHROPIC_BASE_URL) {
      console.log(t('prog_base_url', { url: settings.env.ANTHROPIC_BASE_URL }));
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
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      console.log(chalk.yellow(t('prog_no_settings')));
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
    console.log(chalk.dim(t('repl_no_presets')));
    console.log(chalk.dim(t('repl_use_template_hint')));
    return;
  }

  for (const name of presets) {
    const isActive = name === active;
    if (isActive) {
      console.log(chalk.green(t('repl_active_marker', { name })));
    } else {
      console.log(chalk.white(t('repl_inactive_marker', { name })));
    }
  }
  console.log('');

  const { selected } = await promptWithAbort<{ selected: string }>([
    {
      type: 'list',
      name: 'selected',
      message: t('repl_select_preset'),
      choices: presets.map((p) => ({
        name: p === active ? chalk.green(`${p}  ← active`) : p,
        value: p,
      })),
    },
  ]);

  if (selected === active) {
    console.log(chalk.dim(t('repl_already_active')));
    return;
  }

  const s = spinner(t('repl_switching', { name: selected }));
  const { previous, current } = await PresetSwitcher.switchTo(selected);
  s.succeed(t('repl_switched', { name: selected }));
  PresetSwitcher.printSwitchSummary(previous, current);
}

async function handleTemplate(): Promise<void> {
  const templates = TemplateManager.listAll();

  console.log('');
  if (templates.length === 0) {
    console.log(chalk.dim(t('repl_no_templates')));
    return;
  }

  for (const tmpl of templates) {
    const tag = tmpl.isBuiltin
      ? chalk.blue('[builtin]')
      : chalk.yellow('[custom] ');
    console.log(
      `    ${tag} ${chalk.white(tmpl.name.padEnd(20))} ${chalk.dim(`- ${tmpl.description}`)}`,
    );
  }
  console.log('');

  const { selected } = await promptWithAbort<{ selected: string }>([
    {
      type: 'list',
      name: 'selected',
      message: t('repl_select_template'),
      choices: templates.map((tmpl) => ({
        name: `${tmpl.isBuiltin ? '[builtin]' : '[custom] '} ${tmpl.name} - ${tmpl.description}`,
        value: tmpl.name,
      })),
    },
  ]);

  const template = TemplateManager.find(selected)!;

  const values: Record<string, string> = {};
  for (const v of template.variables) {
    const defaultVal = v.defaultValue ? ` [${v.defaultValue}]` : '';
    const { val } = await promptWithAbort<{ val: string }>([
      {
        type: v.sensitive ? 'password' : 'input',
        name: 'val',
        message: t('template_var_prompt', { desc: v.description, key: v.key, defaultVal }),
        default: v.defaultValue,
        validate: (input: string) => {
          if (v.required && !input.trim()) return t('template_var_required', { key: v.key });
          return true;
        },
      },
    ]);
    values[v.key] = val.trim() || v.defaultValue || '';
  }

  const rendered = TemplateManager.renderSettings(template, values);

  const presets = ConfigReader.listPresets();
  const { presetName } = await promptWithAbort<{ presetName: string }>([
    {
      type: 'input',
      name: 'presetName',
      message: t('template_preset_name_prompt'),
      validate: (v: string) => {
        if (!v.trim()) return t('template_name_required');
        if (presets.includes(v.trim())) return t('template_preset_exists');
        return true;
      },
    },
  ]);

  const s = spinner(t('repl_creating', { name: presetName.trim() }));
  await ConfigWriter.savePreset(presetName.trim(), rendered);
  s.succeed(t('repl_created', { name: presetName.trim(), tmpl: template.name }));
}

async function handleDelete(): Promise<void> {
  const presets = ConfigReader.listPresets();
  if (presets.length === 0) {
    console.log(chalk.dim(t('repl_no_presets')));
    return;
  }

  const active = ConfigReader.detectActivePreset();

  const { selected } = await promptWithAbort<{ selected: string }>([
    {
      type: 'list',
      name: 'selected',
      message: t('repl_delete_select'),
      choices: presets.map((p) => ({
        name: p === active ? chalk.green(`${p}  ← active`) : p,
        value: p,
      })),
    },
  ]);

  const { confirm } = await promptWithAbort<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: t('repl_delete_confirm', { name: selected }),
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.dim(t('cancelled')));
    return;
  }

  await ConfigWriter.deletePreset(selected);
  success(t('repl_deleted', { name: selected }));
}
