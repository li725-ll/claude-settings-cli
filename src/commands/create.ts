import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { success } from '../utils/logger.js';
import { promptWithAbort, AbortError } from '../utils/prompt.js';
import { t } from '../i18n.js';
import type { Settings } from '../types/index.js';

const SKIP = '__SKIP__';

export async function runCreate(): Promise<void> {
  const presets = ConfigReader.listPresets();

  // Step 0: Preset name
  const { name } = await promptWithAbort<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: t('create_preset_name_prompt'),
      validate: (v: string) => {
        if (!v.trim()) return t('create_name_required');
        if (presets.includes(v.trim())) return t('create_name_exists', { name: v.trim() });
        return true;
      },
    },
  ]);

  const presetName = name.trim();

  // Build settings step by step
  const settings: Settings = { env: {} };

  // Step 1: ANTHROPIC_API_KEY (required)
  const { apiKey } = await promptWithAbort<{ apiKey: string }>([
    {
      type: 'password',
      name: 'apiKey',
      message: fieldPrompt('ANTHROPIC_API_KEY', t('create_api_key_desc'), t('create_api_key_example')),
      validate: (v: string) => (v.trim() ? true : t('template_var_required', { key: 'ANTHROPIC_API_KEY' })),
    },
  ]);
  settings.env.ANTHROPIC_API_KEY = apiKey.trim();

  // Step 2: ANTHROPIC_AUTH_TOKEN (optional)
  const { authToken } = await promptWithAbort<{ authToken: string }>([
    {
      type: 'password',
      name: 'authToken',
      message: fieldPrompt('ANTHROPIC_AUTH_TOKEN', t('create_auth_token_desc'), t('create_auth_token_example'), true),
    },
  ]);
  if (authToken.trim()) {
    settings.env.ANTHROPIC_AUTH_TOKEN = authToken.trim();
  }

  // Step 3: ANTHROPIC_BASE_URL (optional)
  const { baseUrl } = await promptWithAbort<{ baseUrl: string }>([
    {
      type: 'input',
      name: 'baseUrl',
      message: fieldPrompt('ANTHROPIC_BASE_URL', t('create_base_url_desc'), t('create_base_url_example'), true),
    },
  ]);
  if (baseUrl.trim()) {
    settings.env.ANTHROPIC_BASE_URL = baseUrl.trim();
  }

  // Step 4: SONNET_MODEL (optional, default provided)
  const { sonnetModel } = await promptWithAbort<{ sonnetModel: string }>([
    {
      type: 'input',
      name: 'sonnetModel',
      message: fieldPrompt('ANTHROPIC_DEFAULT_SONNET_MODEL', t('create_sonnet_model_desc'), '', false, 'claude-sonnet-4-20250514'),
      default: 'claude-sonnet-4-20250514',
    },
  ]);
  if (sonnetModel.trim()) {
    settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL = sonnetModel.trim();
  }

  // Step 5: OPUS_MODEL (optional, default provided)
  const { opusModel } = await promptWithAbort<{ opusModel: string }>([
    {
      type: 'input',
      name: 'opusModel',
      message: fieldPrompt('ANTHROPIC_DEFAULT_OPUS_MODEL', t('create_opus_model_desc'), '', false, 'claude-opus-4-20250514'),
      default: 'claude-opus-4-20250514',
    },
  ]);
  if (opusModel.trim()) {
    settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL = opusModel.trim();
  }

  // Step 6: HAIKU_MODEL (optional, default provided)
  const { haikuModel } = await promptWithAbort<{ haikuModel: string }>([
    {
      type: 'input',
      name: 'haikuModel',
      message: fieldPrompt('ANTHROPIC_DEFAULT_HAIKU_MODEL', t('create_haiku_model_desc'), '', false, 'claude-haiku-35-20241022'),
      default: 'claude-haiku-35-20241022',
    },
  ]);
  if (haikuModel.trim()) {
    settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = haikuModel.trim();
  }

  // Step 7: permissions.defaultMode (list + Skip)
  const { permMode } = await promptWithAbort<{ permMode: string }>([
    {
      type: 'list',
      name: 'permMode',
      message: `permissions.defaultMode\n  ${t('create_permissions_desc')}\n  ${t('create_optional_hint')}`,
      choices: [
        { name: 'default', value: 'default' },
        { name: 'bypassPermissions', value: 'bypassPermissions' },
        { name: 'acceptEdits', value: 'acceptEdits' },
        new inquirer.Separator(),
        { name: t('create_skip_option'), value: SKIP },
      ],
    },
  ]);
  if (permMode !== SKIP) {
    settings.permissions = { defaultMode: permMode as 'default' | 'bypassPermissions' | 'acceptEdits' };
  }

  // Step 8: language (list + Skip)
  const { langChoice } = await promptWithAbort<{ langChoice: string }>([
    {
      type: 'list',
      name: 'langChoice',
      message: `language\n  ${t('create_language_desc')}\n  ${t('create_optional_hint')}`,
      choices: [
        { name: 'zh', value: 'zh' },
        { name: 'en', value: 'en' },
        new inquirer.Separator(),
        { name: t('create_skip_option'), value: SKIP },
      ],
    },
  ]);
  if (langChoice !== SKIP) {
    settings.language = langChoice;
  }

  // Step 9: alwaysThinkingEnabled (list + Skip)
  const { thinking } = await promptWithAbort<{ thinking: string }>([
    {
      type: 'list',
      name: 'thinking',
      message: `alwaysThinkingEnabled\n  ${t('create_thinking_desc')}\n  ${t('create_optional_hint')}`,
      choices: [
        { name: 'true', value: 'true' },
        { name: 'false', value: 'false' },
        new inquirer.Separator(),
        { name: t('create_skip_option'), value: SKIP },
      ],
    },
  ]);
  if (thinking !== SKIP) {
    settings.alwaysThinkingEnabled = thinking === 'true';
  }

  // Step 10: skipDangerousModePermissionPrompt (list + Skip)
  const { dangerous } = await promptWithAbort<{ dangerous: string }>([
    {
      type: 'list',
      name: 'dangerous',
      message: `skipDangerousModePermissionPrompt\n  ${t('create_dangerous_desc')}\n  ${t('create_optional_hint')}`,
      choices: [
        { name: 'true', value: 'true' },
        { name: 'false', value: 'false' },
        new inquirer.Separator(),
        { name: t('create_skip_option'), value: SKIP },
      ],
    },
  ]);
  if (dangerous !== SKIP) {
    settings.skipDangerousModePermissionPrompt = dangerous === 'true';
  }

  // Step 11: Summary and confirm
  console.log('');
  console.log(chalk.cyan.bold(t('create_summary_header')));
  console.log(chalk.white(`  name: ${presetName}`));
  for (const [k, v] of Object.entries(settings.env)) {
    console.log(`  env.${k}: ${v}`);
  }
  if (settings.permissions) {
    console.log(`  permissions: ${JSON.stringify(settings.permissions)}`);
  }
  if (settings.language !== undefined) {
    console.log(`  language: ${settings.language}`);
  }
  if (settings.alwaysThinkingEnabled !== undefined) {
    console.log(`  alwaysThinkingEnabled: ${settings.alwaysThinkingEnabled}`);
  }
  if (settings.skipDangerousModePermissionPrompt !== undefined) {
    console.log(`  skipDangerousModePermissionPrompt: ${settings.skipDangerousModePermissionPrompt}`);
  }
  console.log('');

  const { confirm } = await promptWithAbort<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: t('create_confirm'),
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.dim(t('create_cancelled')));
    return;
  }

  await ConfigWriter.savePreset(presetName, settings);
  success(t('create_saved', { name: presetName }));
}

export const createCommand = new Command('create')
  .description(t('create_desc'))
  .action(async () => {
    try {
      await runCreate();
    } catch (err) {
      if (err instanceof AbortError) return;
      if (err instanceof Error) {
        console.log(chalk.red(t('interactive_error', { msg: err.message })));
      }
    }
  });

function fieldPrompt(
  key: string,
  desc: string,
  example: string,
  optional = false,
  defaultValue?: string,
): string {
  const lines = [`${key}`, `  ${desc}`];
  if (example) {
    lines.push(`  ${t('create_field_example', { example })}`);
  }
  if (defaultValue) {
    lines.push(`  ${t('create_default_hint')}`);
  }
  if (optional) {
    lines.push(`  ${t('create_optional_hint')}`);
  }
  return lines.join('\n');
}
