import chalk from 'chalk';
import { t } from '../i18n.js';

export class CccError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'CccError';
  }
}

export class PresetNotFoundError extends CccError {
  constructor(name: string) {
    super(t('err_preset_not_found', { name }), 'PRESET_NOT_FOUND');
  }
}

export class InvalidConfigError extends CccError {
  constructor(filePath: string, message: string) {
    super(t('err_invalid_config', { filePath, message }), 'INVALID_CONFIG');
  }
}

export class ConfigReadError extends CccError {
  constructor(filePath: string, cause?: Error) {
    super(
      t('err_read_failed', { filePath, cause: cause?.message ?? t('err_unknown') }),
      'CONFIG_READ_ERROR',
    );
  }
}

export class ConfigWriteError extends CccError {
  constructor(filePath: string, cause?: Error) {
    super(
      t('err_write_failed', { filePath, cause: cause?.message ?? t('err_unknown') }),
      'CONFIG_WRITE_ERROR',
    );
  }
}

export function handleError(err: unknown): never {
  if (err instanceof CccError) {
    console.error(chalk.red(t('err_handle_error', { msg: err.message })));
  } else if (err instanceof Error) {
    console.error(chalk.red(t('err_handle_error', { msg: err.message })));
  } else {
    console.error(chalk.red(t('err_handle_unknown', { msg: String(err) })));
  }
  process.exit(1);
}
