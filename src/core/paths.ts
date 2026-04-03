import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';

export const CLAUDE_DIR = path.join(os.homedir(), '.claude');
export const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
export const PLUGINS_DIR = path.join(CLAUDE_DIR, 'plugins');
export const INSTALLED_PLUGINS_FILE = path.join(
  PLUGINS_DIR,
  'installed_plugins.json',
);
export const BLOCKLIST_FILE = path.join(PLUGINS_DIR, 'blocklist.json');
export const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
export const BACKUPS_DIR = path.join(CLAUDE_DIR, 'backups');

export function presetPath(name: string): string {
  return path.join(CLAUDE_DIR, `settings-${name}.json`);
}

export function scanPresetNames(): string[] {
  try {
    const files = fs.readdirSync(CLAUDE_DIR);
    return files
      .filter(
        (f) =>
          f.startsWith('settings-') &&
          f.endsWith('.json') &&
          f !== 'settings.json',
      )
      .map((f) => f.slice('settings-'.length, -'.json'.length))
      .sort();
  } catch {
    return [];
  }
}

export function encodeProjectDir(dir: string): string {
  return dir.replace(/^\//, '').replace(/\//g, '-');
}

export function decodeProjectDir(encoded: string): string {
  return '/' + encoded.replace(/-/g, '/');
}
