# claude-settings-cli

CLI tool to manage Claude Code configuration presets. Switch between different API providers, manage plugins, and export/import your settings.

## Install

```bash
npm install -g claude-settings-cli
```

Or use directly with npx:

```bash
npx claude-settings-cli preset list
```

## Commands

### Preset Management

```bash
# List all presets (mark current active)
ccc preset list

# Switch to a preset
ccc preset use deepseek

# Save current settings as a preset
ccc preset save my-preset

# Delete a preset
ccc preset delete my-preset

# Rename a preset
ccc preset rename old-name new-name

# Compare two presets
ccc preset diff deepseek glm
```

### Configuration

```bash
# Show current config (sensitive values masked)
ccc config show

# Show full config without masking
ccc config show --full

# Get a config value
ccc config get env.ANTHROPIC_BASE_URL

# Set a config value
ccc config set env.ANTHROPIC_BASE_URL "https://api.example.com"
ccc config set language English
ccc config set alwaysThinkingEnabled true

# Remove a config value
ccc config unset env.CUSTOM_VAR
```

### Plugins

```bash
# List installed plugins
ccc plugin list

# Enable/disable a plugin
ccc plugin enable swift-lsp@claude-plugins-official
ccc plugin disable clangd-lsp@claude-plugins-official
```

### Projects

```bash
# List projects with configuration
ccc project list

# Show a project's configuration
ccc project show /path/to/project
```

### Export/Import

```bash
# Export all config to a file
ccc export

# Export with plugins data
ccc export --include-plugins --output my-config.json

# Import config (merge mode by default)
ccc import my-config.json

# Import with replace mode
ccc import my-config.json --mode replace
```

### Backup

```bash
# List backups
ccc backup list

# Restore a backup (interactive selection)
ccc backup restore
```

### Current Status

```bash
# Show current active preset and key settings
ccc current
```

## How It Works

Claude Code reads its global configuration from `~/.claude/settings.json`. This tool manages preset files named `settings-{name}.json` in the same directory.

- `ccc preset use deepseek` copies `settings-deepseek.json` → `settings.json`
- `ccc preset save my-preset` copies `settings.json` → `settings-my-preset.json`
- Every write to `settings.json` creates an automatic backup first

## Development

```bash
git clone <repo-url>
cd claude-settings-cli
npm install
npm run build
npm run dev -- preset list
```

### Run Tests

```bash
npm test
```

## License

MIT
