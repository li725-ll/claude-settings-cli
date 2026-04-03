import { describe, it, expect } from 'vitest';
import { TemplateManager } from '../../src/core/templates.js';

describe('TemplateManager.renderSettings', () => {
  it('should replace template variables', () => {
    const template = TemplateManager.find('api-proxy')!;
    const rendered = TemplateManager.renderSettings(template, {
      API_KEY: 'sk-test123',
      BASE_URL: 'https://proxy.example.com',
    });
    expect(rendered.env.ANTHROPIC_API_KEY).toBe('sk-test123');
    expect(rendered.env.ANTHROPIC_BASE_URL).toBe('https://proxy.example.com');
  });

  it('should keep placeholders when values not provided', () => {
    const template = TemplateManager.find('api-proxy')!;
    const rendered = TemplateManager.renderSettings(template, {});
    expect(rendered.env.ANTHROPIC_API_KEY).toBe('{{API_KEY}}');
    expect(rendered.env.ANTHROPIC_BASE_URL).toBe('{{BASE_URL}}');
  });

  it('should handle custom-model template', () => {
    const template = TemplateManager.find('custom-model')!;
    const rendered = TemplateManager.renderSettings(template, {
      SONNET_MODEL: 'my-sonnet',
      OPUS_MODEL: 'my-opus',
      HAIKU_MODEL: 'my-haiku',
    });
    expect(rendered.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe('my-sonnet');
    expect(rendered.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe('my-opus');
    expect(rendered.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('my-haiku');
  });

  it('should handle permissive template with no variables', () => {
    const template = TemplateManager.find('permissive')!;
    const rendered = TemplateManager.renderSettings(template, {});
    expect(rendered.permissions?.defaultMode).toBe('bypassPermissions');
    expect(rendered.skipDangerousModePermissionPrompt).toBe(true);
  });
});

describe('TemplateManager.extractVariables', () => {
  it('should extract variables from settings', () => {
    const template = TemplateManager.find('api-proxy')!;
    const vars = TemplateManager.extractVariables(template.settings);
    expect(vars).toContain('API_KEY');
    expect(vars).toContain('BASE_URL');
  });

  it('should return empty array for no variables', () => {
    const vars = TemplateManager.extractVariables({ env: { FOO: 'bar' } });
    expect(vars).toEqual([]);
  });
});

describe('TemplateManager built-in templates', () => {
  it('should list 4 built-in templates', () => {
    const builtins = TemplateManager.listBuiltin();
    expect(builtins).toHaveLength(4);
    const names = builtins.map((t) => t.name);
    expect(names).toContain('api-proxy');
    expect(names).toContain('custom-model');
    expect(names).toContain('proxy-with-models');
    expect(names).toContain('permissive');
  });

  it('should find templates by name', () => {
    expect(TemplateManager.find('api-proxy')).toBeDefined();
    expect(TemplateManager.find('nonexistent')).toBeUndefined();
  });

  it('should mark all builtins as isBuiltin', () => {
    for (const t of TemplateManager.listBuiltin()) {
      expect(t.isBuiltin).toBe(true);
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.settings).toBeDefined();
      expect(t.variables).toBeDefined();
    }
  });
});
