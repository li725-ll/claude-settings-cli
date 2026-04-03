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

// ccc own data directory
export const CCC_DIR = path.join(os.homedir(), '.ccc');
export const PRESETS_DIR = path.join(CCC_DIR, 'presets');
export const TEMPLATES_DIR = path.join(CCC_DIR, 'templates');

export function presetPath(name: string): string {
  return path.join(PRESETS_DIR, `${name}.json`);
}

export function scanPresetNames(): string[] {
  try {
    fs.ensureDirSync(PRESETS_DIR);
    const files = fs.readdirSync(PRESETS_DIR);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.slice(0, -'.json'.length))
      .sort();
  } catch {
    return [];
  }
}

export function templatePath(name: string): string {
  return path.join(TEMPLATES_DIR, `${name}.json`);
}

export function scanTemplateNames(): string[] {
  try {
    fs.ensureDirSync(TEMPLATES_DIR);
    const files = fs.readdirSync(TEMPLATES_DIR);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.slice(0, -'.json'.length))
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
