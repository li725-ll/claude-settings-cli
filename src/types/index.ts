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

export interface TemplateVariable {
  key: string;
  description: string;
  defaultValue?: string;
  required: boolean;
  sensitive?: boolean;
}

export interface Template {
  name: string;
  description: string;
  isBuiltin: boolean;
  settings: Settings;
  variables: TemplateVariable[];
}
