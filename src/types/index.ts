export interface Settings {
  env: Record<string, string>;
  permissions?: {
    defaultMode?: 'default' | 'bypassPermissions' | 'acceptEdits';
  };
  enabledPlugins?: Record<string, boolean>;
  language?: string;
  alwaysThinkingEnabled?: boolean;
  skipDangerousModePermissionPrompt?: boolean;
  [key: string]: unknown;
}

export interface InstalledPlugins {
  version: number;
  plugins: Record<string, PluginEntry[]>;
}

export interface PluginEntry {
  scope: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha: string;
}

export interface Blocklist {
  [pluginId: string]: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  settings: Settings;
  presets: Record<string, Settings>;
  plugins?: {
    installed: InstalledPlugins;
    blocklist: Blocklist;
  };
}
