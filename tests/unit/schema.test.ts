import { describe, it, expect } from 'vitest';
import { SettingsSchema, maskValue, SENSITIVE_KEYS } from '../../src/schema/settings.js';

describe('SettingsSchema', () => {
  it('should parse valid settings with env only', () => {
    const result = SettingsSchema.parse({ env: { FOO: 'bar' } });
    expect(result.env.FOO).toBe('bar');
  });

  it('should default env to empty object', () => {
    const result = SettingsSchema.parse({});
    expect(result.env).toEqual({});
  });

  it('should parse full settings', () => {
    const settings = {
      env: { ANTHROPIC_BASE_URL: 'https://example.com' },
      permissions: { defaultMode: 'bypassPermissions' },
      enabledPlugins: { 'test@plugin': true },
      language: '中文',
      alwaysThinkingEnabled: true,
      skipDangerousModePermissionPrompt: true,
    };
    const result = SettingsSchema.parse(settings);
    expect(result.language).toBe('中文');
    expect(result.alwaysThinkingEnabled).toBe(true);
  });

  it('should accept valid permissions modes', () => {
    for (const mode of ['default', 'bypassPermissions', 'acceptEdits']) {
      const result = SettingsSchema.parse({
        env: {},
        permissions: { defaultMode: mode },
      });
      expect(result.permissions?.defaultMode).toBe(mode);
    }
  });

  it('should reject invalid permissions mode', () => {
    expect(() =>
      SettingsSchema.parse({
        env: {},
        permissions: { defaultMode: 'invalid' },
      }),
    ).toThrow();
  });
});

describe('maskValue', () => {
  it('should mask sensitive keys', () => {
    const result = maskValue('ANTHROPIC_AUTH_TOKEN', 'sk-abcdefghijklmnop');
    expect(result).toBe('sk-a****');
  });

  it('should mask short sensitive values completely', () => {
    const result = maskValue('API_KEY', 'short');
    expect(result).toBe('****');
  });

  it('should not mask non-sensitive keys', () => {
    const result = maskValue('ANTHROPIC_BASE_URL', 'https://example.com');
    expect(result).toBe('https://example.com');
  });

  it('should mask ANTHROPIC_API_KEY', () => {
    const result = maskValue('ANTHROPIC_API_KEY', 'secret123456789');
    expect(result).toBe('secr****');
  });
});
