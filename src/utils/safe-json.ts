import fs from 'fs-extra';
import { ConfigReadError } from './errors.js';
import { t } from '../i18n.js';

export async function readJsonSafe<T = unknown>(filePath: string): Promise<T> {
  try {
    return (await fs.readJson(filePath)) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ConfigReadError(filePath, new Error(t('util_file_not_found')));
    }
    throw new ConfigReadError(filePath, err as Error);
  }
}

export function readJsonSafeSync<T = unknown>(filePath: string): T {
  try {
    return fs.readJsonSync(filePath) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ConfigReadError(filePath, new Error(t('util_file_not_found')));
    }
    throw new ConfigReadError(filePath, err as Error);
  }
}
