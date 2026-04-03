import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { PresetSwitcher } from '../core/switcher.js';
import { maskValue } from '../schema/settings.js';
import { success, spinner } from '../utils/logger.js';

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
    console.log(chalk.cyan.bold('  ── Presets ──'));
    if (presets.length === 0) {
      console.log(chalk.dim('  (none)'));
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
        message: 'What do you want to do?',
        choices: [
          { name: '▶  Switch preset', value: 'use' },
          { name: '＋  Add new preset', value: 'add' },
          { name: '✎  Edit preset', value: 'edit' },
          { name: '✕  Delete preset', value: 'delete' },
          { name: '◉  View preset details', value: 'view' },
          new inquirer.Separator(),
          { name: '←  Quit', value: 'quit' },
        ],
      },
    ]);

    if (action === 'quit') {
      console.log(chalk.dim('Bye!'));
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
        console.log(chalk.red(`  Error: ${err.message}`));
      }
    }
  }
}

async function handleUse(
  presets: string[],
  active: string | null,
): Promise<void> {
  if (presets.length === 0) {
    console.log(chalk.dim('  No presets to switch. Add one first.'));
    return;
  }

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'list',
      name: 'name',
      message: 'Select a preset to switch to:',
      choices: presets.map((p) => ({
        name: p === active ? chalk.green(`${p}  ← active`) : p,
        value: p,
      })),
    },
  ]);

  if (name === active) {
    console.log(chalk.dim('  Already active.'));
    return;
  }

  const s = spinner(`Switching to "${name}"...`);
  const { previous, current } = await PresetSwitcher.switchTo(name);
  s.succeed(`Switched to preset "${name}"`);
  PresetSwitcher.printSwitchSummary(previous, current);
}

async function handleAdd(presets: string[]): Promise<void> {
  const { source } = await inquirer.prompt<{ source: string }>([
    {
      type: 'list',
      name: 'source',
      message: 'Create preset from:',
      choices: [
        { name: 'Current settings.json', value: 'current' },
        { name: 'Copy from existing preset', value: 'copy' },
        { name: 'From a file', value: 'file' },
      ],
    },
  ]);

  let name: string;
  if (source === 'copy' && presets.length > 0) {
    const answers = await inquirer.prompt<{ src: string; name: string }>([
      {
        type: 'list',
        name: 'src',
        message: 'Copy from which preset?',
        choices: presets,
      },
      {
        type: 'input',
        name: 'name',
        message: 'New preset name:',
        validate: (v: string) => {
          if (!v.trim()) return 'Name is required';
          if (presets.includes(v.trim())) return 'Preset already exists';
          return true;
        },
      },
    ]);
    const srcSettings = ConfigReader.readPreset(answers.src);
    await ConfigWriter.savePreset(answers.name.trim(), srcSettings);
    success(`Created preset "${answers.name.trim()}" from "${answers.src}"`);
    return;
  }

  if (source === 'file') {
    const answers = await inquirer.prompt<{ file: string; name: string }>([
      {
        type: 'input',
        name: 'file',
        message: 'File path:',
        validate: (v: string) => (v.trim() ? true : 'Path is required'),
      },
      {
        type: 'input',
        name: 'name',
        message: 'New preset name:',
        validate: (v: string) => {
          if (!v.trim()) return 'Name is required';
          if (presets.includes(v.trim())) return 'Preset already exists';
          return true;
        },
      },
    ]);
    await PresetSwitcher.saveAs(answers.name.trim(), answers.file.trim());
    success(`Created preset "${answers.name.trim()}" from file`);
    return;
  }

  // Default: from current settings
  const answers = await inquirer.prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: 'New preset name:',
      validate: (v: string) => {
        if (!v.trim()) return 'Name is required';
        if (presets.includes(v.trim())) return 'Preset already exists';
        return true;
      },
    },
  ]);

  name = answers.name.trim();
  await PresetSwitcher.saveAs(name);
  success(`Saved current settings as preset "${name}"`);
}

async function handleEdit(presets: string[]): Promise<void> {
  if (presets.length === 0) {
    console.log(chalk.dim('  No presets to edit.'));
    return;
  }

  const { target } = await inquirer.prompt<{ target: string }>([
    {
      type: 'list',
      name: 'target',
      message: 'Select a preset to edit:',
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
      message: `Editing preset "${target}":`,
      choices: [
        { name: 'Modify a field', value: 'modify' },
        { name: 'Add new env variable', value: 'add-env' },
        { name: 'Remove a field', value: 'remove' },
      ],
    },
  ]);

  if (editAction === 'modify') {
    const { field } = await inquirer.prompt<{ field: string }>([
      {
        type: 'list',
        name: 'field',
        message: 'Select field to modify:',
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
        message: `New value for ${field}:`,
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
    success(`Updated ${field}`);
  } else if (editAction === 'add-env') {
    const answers = await inquirer.prompt<{ key: string; value: string }>([
      {
        type: 'input',
        name: 'key',
        message: 'ENV variable name:',
        validate: (v: string) => (v.trim() ? true : 'Key is required'),
      },
      {
        type: 'input',
        name: 'value',
        message: 'Value:',
        validate: (v: string) => (v.trim() ? true : 'Value is required'),
      },
    ]);

    settings.env[answers.key.trim()] = answers.value.trim();
    await ConfigWriter.savePreset(target, settings);
    success(`Added env.${answers.key.trim()}`);
  } else if (editAction === 'remove') {
    const { field } = await inquirer.prompt<{ field: string }>([
      {
        type: 'list',
        name: 'field',
        message: 'Select field to remove:',
        choices: allFields.map((f) => f.key),
      },
    ]);

    if (field.startsWith('env.')) {
      delete settings.env[field.slice(4)];
    }

    await ConfigWriter.savePreset(target, settings);
    success(`Removed ${field}`);
  }
}

async function handleDelete(
  presets: string[],
  active: string | null,
): Promise<void> {
  if (presets.length === 0) {
    console.log(chalk.dim('  No presets to delete.'));
    return;
  }

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'list',
      name: 'name',
      message: 'Select a preset to delete:',
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
      message: `Delete preset "${name}"? This cannot be undone.`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.dim('  Cancelled.'));
    return;
  }

  await ConfigWriter.deletePreset(name);
  success(`Deleted preset "${name}"`);
}

async function handleView(presets: string[]): Promise<void> {
  if (presets.length === 0) {
    console.log(chalk.dim('  No presets to view.'));
    return;
  }

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'list',
      name: 'name',
      message: 'Select a preset to view:',
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
  console.log(`  ${chalk.dim('plugins')}: ${pluginCount} enabled`);
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
