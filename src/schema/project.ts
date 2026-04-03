import { z } from 'zod';

export const ProjectConfigSchema = z
  .object({
    allowedTools: z.array(z.string()).optional(),
    ignorePatterns: z.array(z.string()).optional(),
    mcpServers: z.record(z.string(), z.unknown()).optional(),
    permissions: z
      .object({
        defaultMode: z
          .enum(['default', 'bypassPermissions', 'acceptEdits'])
          .optional(),
      })
      .optional(),
  })
  .passthrough();

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
