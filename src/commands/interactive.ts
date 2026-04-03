import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { PresetSwitcher } from '../core/switcher.js';
import { maskValue } from '../schema/settings.js';
import { success, spinner } from '../utils/logger.js';
import { t } from '../i18n.js';

type Action =
  | 'use'
  | 'add'
  | 'edit'
  | 'delete'
  | 'view'
  | 'quit';

export async function interactivePresetMenu(): Promise<void> {
  while (true) {
    const presets = ConfigReader.listPresets();
    const active = ConfigReader.detectActivePreset();

    // Show preset list
    console.log('');
    console.log(chalk.cyan.bold(t('interactive_presets_header')));
    if (presets.length === 0) {
      console.log(chalk.dim(t('interactive_none')));
    } else {
      for (const name of presets) {
        const isActive = name === active;
        if (isActive) {
          console.log(chalk.green(`    ● ${name}  ← active`));
        } else {
          console.log(chalk.white(`    ○ ${name}`));
        }
      }
    }
    console.log('');

    const { action } = await inquirer.prompt<{ action: Action }>([
      {
        type: 'list',
        name: 'action',
        message: t('interactive_what_to_do'),
        choices: [
          { name: t('interactive_switch'), value: 'use' },
          { name: t('interactive_add'), value: 'add' },
          { name: t('interactive_edit'), value: 'edit' },
          { name: t('interactive_delete'), value: 'delete' },
          { name: t('interactive_view'), value: 'view' },
          new inquirer.Separator(),
          { name: t('interactive_quit'), value: 'quit' },
        ],
      },
    ]);

    if (action === 'quit') {
      console.log(chalk.dim(t('interactive_bye')));
      return;
    }

    try {
      switch (action) {
        case 'use':
          await handleUse(presets, active);
          break;
        case 'add':
          await handleAdd(presets);
          break;
        case 'edit':
          await handleEdit(presets);
          break;
        case 'delete':
          await handleDelete(presets, active);
          break;
        case 'view':
          await handleView(presets);
          break;
      }
    } catch (err) {
      if (err instanceof Error) {
        console.log(chalk.red(t('interactive_error', { msg: err.message })));
      }
    }
  }
}

async function handleUse(
  presets: string[],
  active: string | null,
): Promise<void> {
  if (presets.length === 0) {
    console.log(chalk.dim(t('interactive_no_presets_switch')));
    return;
  }

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'list',
      name: 'name',
      message: t('interactive_select_switch'),
      choices: presets.map((p) => ({
        name: p === active ? chalk.green(`${p}  ← active`) : p,
        value: p,
      })),
    },
  ]);

  if (name === active) {
    console.log(chalk.dim(t('repl_already_active')));
    return;
  }

  const s = spinner(t('repl_switching', { name }));
  const { previous, current } = await PresetSwitcher.switchTo(name);
  s.succeed(t('repl_switched', { name }));
  PresetSwitcher.printSwitchSummary(previous, current);
}

async function handleAdd(presets: string[]): Promise<void> {
  const { source } = await inquirer.prompt<{ source: string }>([
    {
      type: 'list',
      name: 'source',
      message: t('interactive_create_from'),
      choices: [
        { name: t('interactive_from_current'), value: 'current' },
        { name: t('interactive_from_copy'), value: 'copy' },
        { name: t('interactive_from_file'), value: 'file' },
      ],
    },
  ]);

  let name: string;
  if (source === 'copy' && presets.length > 0) {
    const answers = await inquirer.prompt<{ src: string; name: string }>([
      {
        type: 'list',
        name: 'src',
        message: t('interactive_copy_which'),
        choices: presets,
      },
      {
        type: 'input',
        name: 'name',
        message: t('interactive_new_preset_name'),
        validate: (v: string) => {
          if (!v.trim()) return t('template_name_required');
          if (presets.includes(v.trim())) return t('template_preset_exists');
          return true;
        },
      },
    ]);
    const srcSettings = ConfigReader.readPreset(answers.src);
    await ConfigWriter.savePreset(answers.name.trim(), srcSettings);
    success(t('interactive_created_from', { name: answers.name.trim(), src: answers.src }));
    return;
  }

  if (source === 'file') {
    const answers = await inquirer.prompt<{ file: string; name: string }>([
      {
        type: 'input',
        name: 'file',
        message: t('interactive_file_path'),
        validate: (v: string) => (v.trim() ? true : t('interactive_path_required')),
      },
      {
        type: 'input',
        name: 'name',
        message: t('interactive_new_preset_name'),
        validate: (v: string) => {
          if (!v.trim()) return t('template_name_required');
          if (presets.includes(v.trim())) return t('template_preset_exists');
          return true;
        },
      },
    ]);
    await PresetSwitcher.saveAs(answers.name.trim(), answers.file.trim());
    success(t('interactive_created_from_file', { name: answers.name.trim() }));
    return;
  }

  // Default: from current settings
  const answers = await inquirer.prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: t('interactive_new_preset_name'),
      validate: (v: string) => {
        if (!v.trim()) return t('template_name_required');
        if (presets.includes(v.trim())) return t('template_preset_exists');
        return true;
      },
    },
  ]);

  name = answers.name.trim();
  await PresetSwitcher.saveAs(name);
  success(t('interactive_saved_current', { name }));
}

async function handleEdit(presets: string[]): Promise<void> {
  if (presets.length === 0) {
    console.log(chalk.dim(t('interactive_no_presets_edit')));
    return;
  }

  const { target } = await inquirer.prompt<{ target: string }>([
    {
      type: 'list',
      name: 'target',
      message: t('interactive_select_edit'),
      choices: presets,
    },
  ]);

  const settings = ConfigReader.readPreset(target);
  const envKeys = Object.keys(settings.env);

  // Flatten all editable fields
  const allFields: { key: string; value: unknown }[] = [];
  for (const [k, v] of Object.entries(settings.env)) {
    allFields.push({ key: `env.${k}`, value: v });
  }
  if (settings.language !== undefined) {
    allFields.push({ key: 'language', value: settings.language });
  }
  if (settings.alwaysThinkingEnabled !== undefined) {
    allFields.push({
      key: 'alwaysThinkingEnabled',
      value: settings.alwaysThinkingEnabled,
    });
  }
  if (settings.permissions?.defaultMode !== undefined) {
    allFields.push({
      key: 'permissions.defaultMode',
      value: settings.permissions.defaultMode,
    });
  }

  const { editAction } = await inquirer.prompt<{
    editAction: string;
  }>([
    {
      type: 'list',
      name: 'editAction',
      message: t('interactive_editing', { name: target }),
      choices: [
        { name: t('interactive_modify_field'), value: 'modify' },
        { name: t('interactive_add_env'), value: 'add-env' },
        { name: t('interactive_remove_field'), value: 'remove' },
      ],
    },
  ]);

  if (editAction === 'modify') {
    const { field } = await inquirer.prompt<{ field: string }>([
      {
        type: 'list',
        name: 'field',
        message: t('interactive_select_modify'),
        choices: allFields.map((f) => ({
          name: `${f.key}: ${JSON.stringify(f.value)}`,
          value: f.key,
        })),
      },
    ]);

    const currentVal = allFields.find((f) => f.key === field)?.value;
    const { newVal } = await inquirer.prompt<{ newVal: string }>([
      {
        type: 'input',
        name: 'newVal',
        message: t('interactive_new_value', { field }),
        default: String(currentVal),
      },
    ]);

    // Parse the value
    const parsed = parseValue(newVal);

    // Set the value
    if (field.startsWith('env.')) {
      settings.env[field.slice(4)] = String(parsed);
    } else if (field === 'language') {
      settings.language = String(parsed);
    } else if (field === 'alwaysThinkingEnabled') {
      settings.alwaysThinkingEnabled = parsed === true || parsed === 'true';
    } else if (field === 'permissions.defaultMode') {
      if (!settings.permissions) settings.permissions = {};
      settings.permissions.defaultMode = String(parsed) as
        | 'default'
        | 'bypassPermissions'
        | 'acceptEdits';
    }

    await ConfigWriter.savePreset(target, settings);
    success(t('interactive_updated', { field }));
  } else if (editAction === 'add-env') {
    const answers = await inquirer.prompt<{ key: string; value: string }>([
      {
        type: 'input',
        name: 'key',
        message: t('interactive_env_name'),
        validate: (v: string) => (v.trim() ? true : t('interactive_key_required')),
      },
      {
        type: 'input',
        name: 'value',
        message: t('interactive_value_prompt'),
        validate: (v: string) => (v.trim() ? true : t('interactive_value_required')),
      },
    ]);

    settings.env[answers.key.trim()] = answers.value.trim();
    await ConfigWriter.savePreset(target, settings);
    success(t('interactive_added_env', { key: answers.key.trim() }));
  } else if (editAction === 'remove') {
    const { field } = await inquirer.prompt<{ field: string }>([
      {
        type: 'list',
        name: 'field',
        message: t('interactive_select_remove'),
        choices: allFields.map((f) => f.key),
      },
    ]);

    if (field.startsWith('env.')) {
      delete settings.env[field.slice(4)];
    }

    await ConfigWriter.savePreset(target, settings);
    success(t('interactive_removed', { field }));
  }
}

async function handleDelete(
  presets: string[],
  active: string | null,
): Promise<void> {
  if (presets.length === 0) {
    console.log(chalk.dim(t('interactive_no_presets_delete')));
    return;
  }

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'list',
      name: 'name',
      message: t('interactive_select_delete'),
      choices: presets.map((p) => ({
        name: p === active ? `${p}  ← active` : p,
        value: p,
      })),
    },
  ]);

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: t('interactive_delete_confirm', { name }),
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.dim(t('interactive_cancelled')));
    return;
  }

  await ConfigWriter.deletePreset(name);
  success(t('interactive_deleted', { name }));
}

async function handleView(presets: string[]): Promise<void> {
  if (presets.length === 0) {
    console.log(chalk.dim(t('interactive_no_presets_view')));
    return;
  }

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'list',
      name: 'name',
      message: t('interactive_select_view'),
      choices: presets,
    },
  ]);

  const settings = ConfigReader.readPreset(name);
  console.log('');
  console.log(chalk.cyan.bold(`  ── ${name} ──`));

  for (const [key, value] of Object.entries(settings.env)) {
    const display = maskValue(key, String(value));
    console.log(`  ${chalk.dim(`env.${key}`)}: ${display}`);
  }

  const otherKeys = ['language', 'alwaysThinkingEnabled', 'permissions'] as const;
  for (const key of otherKeys) {
    const val = settings[key as keyof typeof settings];
    if (val !== undefined) {
      console.log(
        `  ${chalk.dim(key)}: ${JSON.stringify(val)}`,
      );
    }
  }

  const pluginCount = settings.enabledPlugins
    ? Object.values(settings.enabledPlugins).filter(Boolean).length
    : 0;
  console.log(t('interactive_plugins_count', { count: pluginCount }));
  console.log('');
}

function parseValue(val: string): unknown {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  const num = Number(val);
  if (!isNaN(num) && val.trim() !== '') return num;
  return val;
}
