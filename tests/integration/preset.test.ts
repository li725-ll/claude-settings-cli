import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { ConfigReader } from '../../src/core/reader.js';
import { ConfigWriter } from '../../src/core/writer.js';
import { PresetSwitcher } from '../../src/core/switcher.js';

// Use a temp directory for all tests
let tmpDir: string;

describe('Preset integration tests', () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccc-test-'));

    const settingsDir = path.join(tmpDir, '.claude');
    const presetsDir = path.join(tmpDir, '.ccc', 'presets');
    await fs.ensureDir(settingsDir);
    await fs.ensureDir(presetsDir);

    // Create test settings.json
    await fs.writeJson(path.join(settingsDir, 'settings.json'), {
      env: {
        ANTHROPIC_BASE_URL: 'https://current.com',
        ANTHROPIC_AUTH_TOKEN: 'current-token',
      },
      language: '中文',
    });

    // Create test preset in new location
    await fs.writeJson(path.join(presetsDir, 'test.json'), {
      env: {
        ANTHROPIC_BASE_URL: 'https://test.com',
        ANTHROPIC_AUTH_TOKEN: 'test-token',
      },
      language: 'English',
    });
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('should read settings from file', async () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json');
    const raw = await fs.readJson(settingsPath);
    expect(raw.env.ANTHROPIC_BASE_URL).toBe('https://current.com');
    expect(raw.language).toBe('中文');
  });

  it('should write settings atomically', async () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json');
    const newSettings = {
      env: { ANTHROPIC_BASE_URL: 'https://new.com' },
    };
    const tmp = settingsPath + '.tmp.' + Date.now();
    await fs.writeJson(tmp, newSettings, { spaces: 2 });
    await fs.rename(tmp, settingsPath);

    const result = await fs.readJson(settingsPath);
    expect(result.env.ANTHROPIC_BASE_URL).toBe('https://new.com');
  });

  it('should backup before writing', async () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json');
    const backupDir = path.join(tmpDir, '.claude', 'backups');
    await fs.ensureDir(backupDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(backupDir, `settings_${timestamp}.json`);
    await fs.copy(settingsPath, backupPath);

    const backups = await fs.readdir(backupDir);
    expect(backups.length).toBe(1);
  });

  it('should read preset from new ~/.ccc/presets/ location', async () => {
    const presetPath = path.join(tmpDir, '.ccc', 'presets', 'test.json');
    const preset = await fs.readJson(presetPath);
    expect(preset.env.ANTHROPIC_BASE_URL).toBe('https://test.com');
    expect(preset.env.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
  });

  it('should switch preset by copying file', async () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json');
    const presetPath = path.join(tmpDir, '.ccc', 'presets', 'test.json');

    const preset = await fs.readJson(presetPath);
    await fs.writeJson(settingsPath, preset, { spaces: 2 });

    const result = await fs.readJson(settingsPath);
    expect(result.env.ANTHROPIC_BASE_URL).toBe('https://test.com');
    expect(result.env.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
  });

  it('should scan preset names from new location', async () => {
    const presetsDir = path.join(tmpDir, '.ccc', 'presets');
    const files = await fs.readdir(presetsDir);
    const presets = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.slice(0, -'.json'.length))
      .sort();

    expect(presets).toEqual(['test']);
  });
});
