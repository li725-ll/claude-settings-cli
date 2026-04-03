import chalk from 'chalk';

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
    super(
      `Preset "${name}" not found. Run "ccc preset list" to see available presets.`,
      'PRESET_NOT_FOUND',
    );
  }
}

export class InvalidConfigError extends CccError {
  constructor(filePath: string, message: string) {
    super(`Invalid config in ${filePath}:\n${message}`, 'INVALID_CONFIG');
  }
}

export class ConfigReadError extends CccError {
  constructor(filePath: string, cause?: Error) {
    super(
      `Failed to read ${filePath}: ${cause?.message ?? 'unknown error'}`,
      'CONFIG_READ_ERROR',
    );
  }
}

export class ConfigWriteError extends CccError {
  constructor(filePath: string, cause?: Error) {
    super(
      `Failed to write ${filePath}: ${cause?.message ?? 'unknown error'}`,
      'CONFIG_WRITE_ERROR',
    );
  }
}

export function handleError(err: unknown): never {
  if (err instanceof CccError) {
    console.error(chalk.red(`Error: ${err.message}`));
  } else if (err instanceof Error) {
    console.error(chalk.red(`Error: ${err.message}`));
  } else {
    console.error(chalk.red(`Unknown error: ${String(err)}`));
  }
  process.exit(1);
}
