import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { maskValue } from '../schema/settings.js';
import { success } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { promptWithAbort, AbortError } from '../utils/prompt.js';
import { t } from '../i18n.js';
import type { Settings } from '../types/index.js';

type EditAction = 'modify' | 'add-env' | 'remove' | 'view' | 'save' | 'discard';

export async function runEdit(presetName?: string): Promise<void> {
  const presets = ConfigReader.listPresets();
  if (presets.length === 0) {
    console.log(chalk.dim(t('edit_no_presets')));
    return;
  }

  // Step 1: Select preset
  let name = presetName;
  if (!name) {
    const answer = await promptWithAbort<{ name: string }>([
      {
        type: 'list',
        name: 'name',
        message: t('edit_select'),
        choices: presets,
      },
    ]);
    name = answer.name;
  } else if (!presets.includes(name)) {
    console.log(chalk.red(t('edit_preset_not_found', { name })));
    return;
  }

  const settings: Settings = structuredClone(ConfigReader.readPreset(name));

  // Step 2: Show current fields
  printFields(name, settings);

  // Step 3: Loop editing
  while (true) {
    const { action } = await promptWithAbort<{ action: EditAction }>([
      {
        type: 'list',
        name: 'action',
        message: t('edit_what_to_do'),
        choices: [
          { name: t('edit_modify'), value: 'modify' },
          { name: t('edit_add_env'), value: 'add-env' },
          { name: t('edit_remove'), value: 'remove' },
          { name: t('edit_view'), value: 'view' },
          new inquirer.Separator(),
          { name: t('edit_save'), value: 'save' },
          { name: t('edit_discard'), value: 'discard' },
        ],
      },
    ]);

    if (action === 'save') {
      await ConfigWriter.savePreset(name, settings);
      success(t('edit_saved', { name }));
      return;
    }

    if (action === 'discard') {
      console.log(chalk.dim(t('edit_discarded')));
      return;
    }

    if (action === 'view') {
      console.log('');
      printFields(name, settings);
      continue;
    }

    if (action === 'modify') {
      const allFields = flattenFields(settings);
      if (allFields.length === 0) {
        console.log(chalk.dim(t('edit_no_fields')));
        continue;
      }

      const { field } = await promptWithAbort<{ field: string }>([
        {
          type: 'list',
          name: 'field',
          message: t('edit_select_modify'),
          choices: allFields.map((f) => ({
            name: `${f.key}: ${JSON.stringify(f.value)}`,
            value: f.key,
          })),
        },
      ]);

      const currentVal = allFields.find((f) => f.key === field)?.value;
      const { newVal } = await promptWithAbort<{ newVal: string }>([
        {
          type: 'input',
          name: 'newVal',
          message: t('edit_new_value', { field }),
          default: String(currentVal),
        },
      ]);

      const parsed = parseValue(newVal);
      applyField(settings, field, parsed);
      success(t('edit_updated', { field }));
    } else if (action === 'add-env') {
      const answers = await promptWithAbort<{ key: string; value: string }>([
        {
          type: 'input',
          name: 'key',
          message: t('edit_env_key'),
          validate: (v: string) => (v.trim() ? true : t('edit_env_key_required')),
        },
        {
          type: 'input',
          name: 'value',
          message: t('edit_env_value'),
          validate: (v: string) => (v.trim() ? true : t('edit_env_value_required')),
        },
      ]);

      settings.env[answers.key.trim()] = answers.value.trim();
      success(t('edit_env_added', { key: answers.key.trim() }));
    } else if (action === 'remove') {
      const allFields = flattenFields(settings);
      if (allFields.length === 0) {
        console.log(chalk.dim(t('edit_no_fields')));
        continue;
      }

      const { field } = await promptWithAbort<{ field: string }>([
        {
          type: 'list',
          name: 'field',
          message: t('edit_select_remove'),
          choices: allFields.map((f) => f.key),
        },
      ]);

      removeField(settings, field);
      success(t('edit_removed', { field }));
    }
  }
}

export const editCommand = new Command('edit')
  .description(t('edit_desc'))
  .argument('[name]', 'Preset name to edit')
  .action(async (name?: string) => {
    try {
      await runEdit(name);
    } catch (err) {
      if (err instanceof AbortError) return;
      handleError(err);
    }
  });

function printFields(name: string, settings: Settings): void {
  console.log('');
  console.log(chalk.cyan.bold(t('edit_header', { name })));

  for (const [key, value] of Object.entries(settings.env)) {
    const display = maskValue(key, String(value));
    console.log(`  ${chalk.dim(`env.${key}`)}: ${display}`);
  }

  if (settings.language !== undefined) {
    console.log(`  ${chalk.dim('language')}: ${settings.language}`);
  }
  if (settings.alwaysThinkingEnabled !== undefined) {
    console.log(`  ${chalk.dim('alwaysThinkingEnabled')}: ${settings.alwaysThinkingEnabled}`);
  }
  if (settings.skipDangerousModePermissionPrompt !== undefined) {
    console.log(`  ${chalk.dim('skipDangerousModePermissionPrompt')}: ${settings.skipDangerousModePermissionPrompt}`);
  }
  if (settings.permissions?.defaultMode !== undefined) {
    console.log(`  ${chalk.dim('permissions.defaultMode')}: ${settings.permissions.defaultMode}`);
  }

  const pluginCount = settings.enabledPlugins
    ? Object.values(settings.enabledPlugins).filter(Boolean).length
    : 0;
  if (pluginCount > 0) {
    console.log(t('edit_plugins_count', { count: pluginCount }));
  }
  console.log('');
}

function flattenFields(settings: Settings): { key: string; value: unknown }[] {
  const fields: { key: string; value: unknown }[] = [];
  for (const [k, v] of Object.entries(settings.env)) {
    fields.push({ key: `env.${k}`, value: v });
  }
  if (settings.language !== undefined) {
    fields.push({ key: 'language', value: settings.language });
  }
  if (settings.alwaysThinkingEnabled !== undefined) {
    fields.push({ key: 'alwaysThinkingEnabled', value: settings.alwaysThinkingEnabled });
  }
  if (settings.skipDangerousModePermissionPrompt !== undefined) {
    fields.push({ key: 'skipDangerousModePermissionPrompt', value: settings.skipDangerousModePermissionPrompt });
  }
  if (settings.permissions?.defaultMode !== undefined) {
    fields.push({ key: 'permissions.defaultMode', value: settings.permissions.defaultMode });
  }
  return fields;
}

function applyField(settings: Settings, field: string, parsed: unknown): void {
  if (field.startsWith('env.')) {
    settings.env[field.slice(4)] = String(parsed);
  } else if (field === 'language') {
    settings.language = String(parsed);
  } else if (field === 'alwaysThinkingEnabled') {
    settings.alwaysThinkingEnabled = parsed === true || parsed === 'true';
  } else if (field === 'skipDangerousModePermissionPrompt') {
    settings.skipDangerousModePermissionPrompt = parsed === true || parsed === 'true';
  } else if (field === 'permissions.defaultMode') {
    if (!settings.permissions) settings.permissions = {};
    settings.permissions.defaultMode = String(parsed) as 'default' | 'bypassPermissions' | 'acceptEdits';
  }
}

function removeField(settings: Settings, field: string): void {
  if (field.startsWith('env.')) {
    delete settings.env[field.slice(4)];
  } else if (field === 'language') {
    delete settings.language;
  } else if (field === 'alwaysThinkingEnabled') {
    delete settings.alwaysThinkingEnabled;
  } else if (field === 'skipDangerousModePermissionPrompt') {
    delete settings.skipDangerousModePermissionPrompt;
  } else if (field === 'permissions.defaultMode') {
    if (settings.permissions) {
      delete settings.permissions.defaultMode;
      if (Object.keys(settings.permissions).length === 0) {
        delete settings.permissions;
      }
    }
  }
}

function parseValue(val: string): unknown {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  const num = Number(val);
  if (!isNaN(num) && val.trim() !== '') return num;
  return val;
}
