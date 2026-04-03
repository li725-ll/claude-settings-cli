import { z } from 'zod';

export const SENSITIVE_KEYS = [
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_API_KEY',
  'API_KEY',
  'SECRET',
];

export const SettingsSchema = z.object({
  env: z.record(z.string(), z.string()).default({}),
  permissions: z
    .object({
      defaultMode: z
        .enum(['default', 'bypassPermissions', 'acceptEdits'])
        .optional(),
    })
    .optional(),
  enabledPlugins: z.record(z.string(), z.boolean()).optional(),
  language: z.string().optional(),
  alwaysThinkingEnabled: z.boolean().optional(),
  skipDangerousModePermissionPrompt: z.boolean().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export function maskValue(key: string, value: string): string {
  if (SENSITIVE_KEYS.some((k) => key.toUpperCase().includes(k))) {
    if (value.length <= 8) return '****';
    return value.slice(0, 4) + '****';
  }
  return value;
}
