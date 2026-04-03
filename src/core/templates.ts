import fs from 'fs-extra';
import { TEMPLATES_DIR, templatePath, scanTemplateNames } from './paths.js';
import { ConfigWriter } from './writer.js';
import { readJsonSafeSync } from '../utils/safe-json.js';
import type { Settings } from '../schema/settings.js';
import type { Template, TemplateVariable } from '../types/index.js';

const BUILTIN_TEMPLATES: Template[] = [
  {
    name: 'api-proxy',
    description: '国内 API 代理 (兼容 Anthropic API)',
    isBuiltin: true,
    settings: {
      env: {
        ANTHROPIC_API_KEY: '{{API_KEY}}',
        ANTHROPIC_BASE_URL: '{{BASE_URL}}',
      },
    },
    variables: [
      {
        key: 'API_KEY',
        description: '代理服务的 API Key',
        required: true,
        sensitive: true,
      },
      {
        key: 'BASE_URL',
        description: '代理服务的 Base URL',
        defaultValue: 'http://localhost:3000',
        required: true,
      },
    ],
  },
  {
    name: 'custom-model',
    description: '自定义模型配置',
    isBuiltin: true,
    settings: {
      env: {
        ANTHROPIC_DEFAULT_SONNET_MODEL: '{{SONNET_MODEL}}',
        ANTHROPIC_DEFAULT_OPUS_MODEL: '{{OPUS_MODEL}}',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: '{{HAIKU_MODEL}}',
      },
    },
    variables: [
      {
        key: 'SONNET_MODEL',
        description: 'Sonnet 模型 ID',
        defaultValue: 'claude-sonnet-4-20250514',
        required: false,
      },
      {
        key: 'OPUS_MODEL',
        description: 'Opus 模型 ID',
        defaultValue: 'claude-opus-4-20250514',
        required: false,
      },
      {
        key: 'HAIKU_MODEL',
        description: 'Haiku 模型 ID',
        defaultValue: 'claude-haiku-35-20241022',
        required: false,
      },
    ],
  },
  {
    name: 'proxy-with-models',
    description: '代理服务 + 自定义模型',
    isBuiltin: true,
    settings: {
      env: {
        ANTHROPIC_API_KEY: '{{API_KEY}}',
        ANTHROPIC_BASE_URL: '{{BASE_URL}}',
        ANTHROPIC_DEFAULT_SONNET_MODEL: '{{SONNET_MODEL}}',
      },
    },
    variables: [
      {
        key: 'API_KEY',
        description: '代理服务的 API Key',
        required: true,
        sensitive: true,
      },
      {
        key: 'BASE_URL',
        description: '代理服务的 Base URL',
        required: true,
      },
      {
        key: 'SONNET_MODEL',
        description: 'Sonnet 模型 ID',
        required: false,
      },
    ],
  },
  {
    name: 'permissive',
    description: '宽松权限 + 跳过危险模式提示',
    isBuiltin: true,
    settings: {
      env: {},
      permissions: { defaultMode: 'bypassPermissions' },
      skipDangerousModePermissionPrompt: true,
    },
    variables: [],
  },
];

export class TemplateManager {
  static listAll(): Template[] {
    return [...BUILTIN_TEMPLATES, ...this.listCustom()];
  }

  static listBuiltin(): Template[] {
    return BUILTIN_TEMPLATES;
  }

  static listCustom(): Template[] {
    const names = scanTemplateNames();
    return names.map((name) => this.readCustom(name)).filter(Boolean) as Template[];
  }

  static readCustom(name: string): Template | null {
    try {
      const raw = readJsonSafeSync<Record<string, unknown>>(templatePath(name));
      return { ...raw, name, isBuiltin: false } as Template;
    } catch {
      return null;
    }
  }

  static find(name: string): Template | undefined {
    const builtin = BUILTIN_TEMPLATES.find((t) => t.name === name);
    if (builtin) return builtin;
    return this.readCustom(name) ?? undefined;
  }

  static async saveAsTemplate(
    name: string,
    settings: Settings,
    variables: TemplateVariable[],
    description?: string,
  ): Promise<void> {
    await fs.ensureDir(TEMPLATES_DIR);
    const template = {
      name,
      description: description ?? `Custom template: ${name}`,
      settings,
      variables,
    };
    await ConfigWriter.atomicWrite(templatePath(name), template);
  }

  static async deleteTemplate(name: string): Promise<void> {
    await fs.remove(templatePath(name));
  }

  static extractVariables(settings: Settings): string[] {
    const vars = new Set<string>();
    const walk = (obj: unknown) => {
      if (typeof obj === 'string') {
        const matches = obj.matchAll(/\{\{(\w+)\}\}/g);
        for (const m of matches) vars.add(m[1]);
      } else if (typeof obj === 'object' && obj !== null) {
        for (const v of Object.values(obj)) walk(v);
      }
    };
    walk(settings);
    return [...vars];
  }

  static renderSettings(
    template: Template,
    values: Record<string, string>,
  ): Settings {
    const replace = (obj: unknown): unknown => {
      if (typeof obj === 'string') {
        return obj.replace(
          /\{\{(\w+)\}\}/g,
          (_, key) => values[key] ?? `{{${key}}}`,
        );
      }
      if (Array.isArray(obj)) return obj.map(replace);
      if (typeof obj === 'object' && obj !== null) {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          result[k] = replace(v);
        }
        return result;
      }
      return obj;
    };
    return replace(structuredClone(template.settings)) as Settings;
  }
}
