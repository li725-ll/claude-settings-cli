import { z } from 'zod';

export const PluginEntrySchema = z.object({
  scope: z.string(),
  installPath: z.string(),
  version: z.string(),
  installedAt: z.string(),
  lastUpdated: z.string(),
  gitCommitSha: z.string(),
});

export const InstalledPluginsSchema = z.object({
  version: z.number(),
  plugins: z.record(z.string(), z.array(PluginEntrySchema)),
});

export const BlocklistSchema = z.record(z.string(), z.string());
