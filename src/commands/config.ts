import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { maskValue } from '../schema/settings.js';
import { success } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { t } from '../i18n.js';

export const configCommand = new Command('config')
  .description(t('config_desc'));

configCommand
  .command('show')
  .description(t('config_show_desc'))
  .option('--full', t('config_full_desc'))
  .action((opts: { full?: boolean }) => {
    try {
      const settings = ConfigReader.readSettings();
      console.log('');
      printConfig(settings, '', !opts.full);
      console.log('');
    } catch (err) {
      handleError(err);
    }
  });

configCommand
  .command('get <path>')
  .description(t('config_get_desc'))
  .action((pathStr: string) => {
    try {
      const settings = ConfigReader.readSettings();
      const value = getNestedValue(settings, pathStr);
      if (value === undefined) {
        console.log(chalk.dim(`  ${t('config_not_set', { path: pathStr })}`));
      } else {
        console.log(JSON.stringify(value, null, 2));
      }
    } catch (err) {
      handleError(err);
    }
  });

configCommand
  .command('set <path> <value>')
  .description(t('config_set_desc'))
  .action(async (pathStr: string, value: string) => {
    try {
      const settings = ConfigReader.readSettings();
      const parsed = inferType(value);
      setNestedValue(settings, pathStr, parsed);
      await ConfigWriter.writeSettings(settings);
      success(t('config_set_success', { path: pathStr, value: JSON.stringify(parsed) }));
    } catch (err) {
      handleError(err);
    }
  });

configCommand
  .command('unset <path>')
  .description(t('config_unset_desc'))
  .action(async (pathStr: string) => {
    try {
      const settings = ConfigReader.readSettings();
      unsetNestedValue(settings, pathStr);
      await ConfigWriter.writeSettings(settings);
      success(t('config_unset_success', { path: pathStr }));
    } catch (err) {
      handleError(err);
    }
  });

function printConfig(
  obj: Record<string, unknown>,
  prefix: string,
  mask: boolean,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      if (prefix) {
        console.log(chalk.cyan(`  ${fullPath}:`));
      }
      printConfig(value as Record<string, unknown>, fullPath, mask);
    } else {
      const displayValue =
        mask && prefix === 'env'
          ? maskValue(key, String(value))
          : JSON.stringify(value);
      console.log(`  ${chalk.dim(fullPath)}: ${displayValue}`);
    }
  }
}

function getNestedValue(
  obj: Record<string, unknown>,
  pathStr: string,
): unknown {
  const parts = pathStr.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(
  obj: Record<string, unknown>,
  pathStr: string,
  value: unknown,
): void {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

function unsetNestedValue(
  obj: Record<string, unknown>,
  pathStr: string,
): void {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) return;
    current = current[parts[i]] as Record<string, unknown>;
  }
  delete current[parts[parts.length - 1]];
}

function inferType(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  return value;
}
