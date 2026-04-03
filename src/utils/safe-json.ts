import fs from 'fs-extra';
import { ConfigReadError } from './errors.js';

export async function readJsonSafe<T = unknown>(filePath: string): Promise<T> {
  try {
    return (await fs.readJson(filePath)) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ConfigReadError(filePath, new Error('File not found'));
    }
    throw new ConfigReadError(filePath, err as Error);
  }
}

export function readJsonSafeSync<T = unknown>(filePath: string): T {
  try {
    return fs.readJsonSync(filePath) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ConfigReadError(filePath, new Error('File not found'));
    }
    throw new ConfigReadError(filePath, err as Error);
  }
}
