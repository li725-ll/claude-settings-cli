export type Lang = 'zh' | 'en';

export function detectLang(): Lang {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  return locale.startsWith('zh') ? 'zh' : 'en';
}

export const lang: Lang = detectLang();

export function t(key: string, params?: Record<string, string | number>): string {
  const msg = (MESSAGES as Record<string, Record<Lang, string>>)[key]?.[lang] ?? key;
  if (!params) return msg;
  return msg.replace(/\$\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? ''));
}

const MESSAGES: Record<string, Record<Lang, string>> = {
  // ── Program (index.ts) ──
  prog_desc: {
    zh: 'Claude Code Config - 管理你的 Claude Code 配置',
    en: 'Claude Code Config - manage your Claude Code configuration',
  },
  prog_current_desc: {
    zh: '显示当前活动配置摘要',
    en: 'Show current active configuration summary',
  },
  prog_active_preset: {
    zh: '  活动预设: ${name}',
    en: '  Active preset: ${name}',
  },
  prog_active_preset_custom: {
    zh: '  活动预设: (自定义)',
    en: '  Active preset: (custom)',
  },
  prog_base_url: {
    zh: '  代理地址: ${url}',
    en: '  Base URL: ${url}',
  },
  prog_models: {
    zh: '  模型: ${models}',
    en: '  Models: ${models}',
  },
  prog_token: {
    zh: '  令牌: ${token}',
    en: '  Token: ${token}',
  },
  prog_plugins: {
    zh: '  插件: ${count} 个已启用',
    en: '  Plugins: ${count} enabled',
  },
  prog_no_settings: {
    zh: '  未找到 settings.json。',
    en: '  No settings.json found.',
  },

  // ── Preset command (preset.ts) ──
  preset_desc: {
    zh: '管理配置预设',
    en: 'Manage configuration presets',
  },
  preset_list_desc: {
    zh: '列出所有可用预设',
    en: 'List all available presets',
  },
  preset_no_presets: {
    zh: '  未找到预设。',
    en: '  No presets found.',
  },
  preset_create_hint: {
    zh: '  使用以下命令创建: ccc preset save <名称>',
    en: '  Create one with: ccc preset save <name>',
  },
  preset_active_label: {
    zh: '${name} (活动)',
    en: '${name} (active)',
  },
  preset_use_desc: {
    zh: '切换到指定预设',
    en: 'Switch to a preset',
  },
  preset_no_backup_desc: {
    zh: '跳过当前设置的备份',
    en: 'Skip backup of current settings',
  },
  preset_switching: {
    zh: '正在切换到预设 "${name}"...',
    en: 'Switching to preset "${name}"...',
  },
  preset_switched: {
    zh: '已切换到预设 "${name}"',
    en: 'Switched to preset "${name}"',
  },
  preset_save_desc: {
    zh: '将当前设置保存为预设',
    en: 'Save current settings as a preset',
  },
  preset_from_desc: {
    zh: '从指定文件保存，而非当前设置',
    en: 'Save from a specific file instead of current settings',
  },
  preset_saved: {
    zh: '已将当前设置保存为预设 "${name}"',
    en: 'Saved current settings as preset "${name}"',
  },
  preset_delete_desc: {
    zh: '删除预设',
    en: 'Delete a preset',
  },
  preset_yes_desc: {
    zh: '跳过确认',
    en: 'Skip confirmation',
  },
  preset_delete_confirm: {
    zh: '确定要删除预设 "${name}" 吗？',
    en: 'Are you sure you want to delete preset "${name}"?',
  },
  preset_deleted: {
    zh: '已删除预设 "${name}"',
    en: 'Deleted preset "${name}"',
  },
  preset_rename_desc: {
    zh: '重命名预设',
    en: 'Rename a preset',
  },
  preset_renamed: {
    zh: '已将预设 "${oldName}" 重命名为 "${newName}"',
    en: 'Renamed preset "${oldName}" → "${newName}"',
  },
  preset_diff_desc: {
    zh: '比较两个预设',
    en: 'Compare two presets',
  },

  // ── Config command (config.ts) ──
  config_desc: {
    zh: '获取/设置/显示配置值',
    en: 'Get/set/show configuration values',
  },
  config_show_desc: {
    zh: '显示当前配置',
    en: 'Show current configuration',
  },
  config_full_desc: {
    zh: '显示敏感值（不遮盖）',
    en: 'Show sensitive values without masking',
  },
  config_get_desc: {
    zh: '获取配置值（如 env.ANTHROPIC_BASE_URL）',
    en: 'Get a configuration value (e.g., env.ANTHROPIC_BASE_URL)',
  },
  config_not_set: {
    zh: '${path} 未设置',
    en: '${path} is not set',
  },
  config_set_desc: {
    zh: '设置配置值',
    en: 'Set a configuration value',
  },
  config_set_success: {
    zh: '已设置 ${path} = ${value}',
    en: 'Set ${path} = ${value}',
  },
  config_unset_desc: {
    zh: '移除配置值',
    en: 'Remove a configuration value',
  },
  config_unset_success: {
    zh: '已移除 ${path}',
    en: 'Removed ${path}',
  },

  // ── Template command (template.ts) ──
  template_desc: {
    zh: '管理配置模板',
    en: 'Manage configuration templates',
  },
  template_list_desc: {
    zh: '列出所有可用模板',
    en: 'List all available templates',
  },
  template_no_templates: {
    zh: '  未找到模板。',
    en: '  No templates found.',
  },
  template_builtin_tag: {
    zh: '[内置]',
    en: '[builtin]',
  },
  template_custom_tag: {
    zh: '[自定义]',
    en: '[custom]',
  },
  template_apply_desc: {
    zh: '应用模板创建预设',
    en: 'Apply a template to create a preset',
  },
  template_preset_opt_desc: {
    zh: '要创建的预设名称',
    en: 'Preset name to create',
  },
  template_not_found: {
    zh: '模板 "${name}" 未找到。运行 "ccc template list" 查看可用模板。',
    en: 'Template "${name}" not found. Run "ccc template list" to see available templates.',
  },
  template_var_prompt: {
    zh: '${desc} (${key}):${defaultVal}',
    en: '${desc} (${key}):${defaultVal}',
  },
  template_var_required: {
    zh: '${key} 是必填项',
    en: '${key} is required',
  },
  template_preset_name_prompt: {
    zh: '预设名称:',
    en: 'Preset name:',
  },
  template_name_required: {
    zh: '名称不能为空',
    en: 'Name is required',
  },
  template_preset_exists: {
    zh: '预设已存在',
    en: 'Preset already exists',
  },
  template_creating: {
    zh: '正在从模板 "${tmpl}" 创建预设 "${name}"...',
    en: 'Creating preset "${name}" from template "${tmpl}"...',
  },
  template_created: {
    zh: '已从模板 "${tmpl}" 创建预设 "${name}"',
    en: 'Created preset "${name}" from template "${tmpl}"',
  },
  template_save_desc: {
    zh: '将当前设置保存为模板',
    en: 'Save current settings as a template',
  },
  template_description_opt: {
    zh: '模板描述',
    en: 'Template description',
  },
  template_overwrite_builtin: {
    zh: '不能覆盖内置模板 "${name}"',
    en: 'Cannot overwrite builtin template "${name}"',
  },
  template_saved: {
    zh: '已保存模板 "${name}"',
    en: 'Saved template "${name}"',
  },
  template_select_vars: {
    zh: '选择要作为模板变量的环境变量:',
    en: 'Select env variables to make into template variables:',
  },
  template_var_desc_prompt: {
    zh: '${key} 的描述:',
    en: 'Description for ${key}:',
  },
  template_var_sensitive: {
    zh: '${key} 是否敏感？（将遮盖输入）',
    en: 'Is ${key} sensitive? (will mask input)',
  },
  template_delete_desc: {
    zh: '删除自定义模板',
    en: 'Delete a custom template',
  },
  template_delete_yes: {
    zh: '跳过确认',
    en: 'Skip confirmation',
  },
  template_not_found_simple: {
    zh: '模板 "${name}" 未找到',
    en: 'Template "${name}" not found',
  },
  template_delete_builtin: {
    zh: '不能删除内置模板 "${name}"',
    en: 'Cannot delete builtin template "${name}"',
  },
  template_delete_confirm: {
    zh: '确定要删除模板 "${name}" 吗？',
    en: 'Are you sure you want to delete template "${name}"?',
  },
  template_deleted: {
    zh: '已删除模板 "${name}"',
    en: 'Deleted template "${name}"',
  },
  template_view_desc: {
    zh: '查看模板详情',
    en: 'View template details',
  },
  template_variables_header: {
    zh: '  变量:',
    en: '  Variables:',
  },
  template_required: {
    zh: '必填',
    en: 'required',
  },
  template_sensitive: {
    zh: '敏感',
    en: 'sensitive',
  },
  template_settings_header: {
    zh: '  设置:',
    en: '  Settings:',
  },

  // ── IO command (io.ts) ──
  io_export_desc: {
    zh: '导出配置到文件',
    en: 'Export configuration to a file',
  },
  io_output_opt: {
    zh: '输出文件路径',
    en: 'Output file path',
  },
  io_include_plugins_opt: {
    zh: '包含插件数据',
    en: 'Include plugin data',
  },
  io_exporting: {
    zh: '正在导出配置...',
    en: 'Exporting configuration...',
  },
  io_exported: {
    zh: '配置已导出到 ${path}',
    en: 'Configuration exported to ${path}',
  },
  io_import_desc: {
    zh: '从文件导入配置',
    en: 'Import configuration from a file',
  },
  io_file_arg: {
    zh: '要导入的配置文件',
    en: 'Configuration file to import',
  },
  io_mode_opt: {
    zh: '导入模式: merge（合并）或 replace（替换）',
    en: 'Import mode: merge or replace',
  },
  io_importing: {
    zh: '正在导入配置...',
    en: 'Importing configuration...',
  },
  io_imported: {
    zh: '配置已从 ${file} 导入',
    en: 'Configuration imported from ${file}',
  },

  // ── Backup command (backup.ts) ──
  backup_desc: {
    zh: '管理备份',
    en: 'Manage backups',
  },
  backup_list_desc: {
    zh: '列出可用备份',
    en: 'List available backups',
  },
  backup_no_backups: {
    zh: '  未找到备份。',
    en: '  No backups found.',
  },
  backup_restore_desc: {
    zh: '恢复备份（未指定名称时进入交互模式）',
    en: 'Restore a backup (interactive if no name provided)',
  },
  backup_select_prompt: {
    zh: '选择要恢复的备份:',
    en: 'Select a backup to restore:',
  },
  backup_restored: {
    zh: '已恢复备份 "${name}"',
    en: 'Restored backup "${name}"',
  },

  // ── Plugin command (plugin.ts) ──
  plugin_desc: {
    zh: '管理插件',
    en: 'Manage plugins',
  },
  plugin_list_desc: {
    zh: '列出所有已安装插件',
    en: 'List all installed plugins',
  },
  plugin_none: {
    zh: '  未安装插件。',
    en: '  No plugins installed.',
  },
  plugin_blocked: {
    zh: '已阻止',
    en: 'blocked',
  },
  plugin_enabled: {
    zh: '已启用',
    en: 'enabled',
  },
  plugin_disabled: {
    zh: '已禁用',
    en: 'disabled',
  },
  plugin_entry: {
    zh: '  ${id} v${version} (${status})',
    en: '  ${id} v${version} (${status})',
  },
  plugin_enable_desc: {
    zh: '启用插件',
    en: 'Enable a plugin',
  },
  plugin_enabled_success: {
    zh: '已启用插件 "${id}"',
    en: 'Enabled plugin "${id}"',
  },
  plugin_disable_desc: {
    zh: '禁用插件',
    en: 'Disable a plugin',
  },
  plugin_disabled_success: {
    zh: '已禁用插件 "${id}"',
    en: 'Disabled plugin "${id}"',
  },

  // ── Project command (project.ts) ──
  project_desc: {
    zh: '管理项目级配置',
    en: 'Manage project-level configuration',
  },
  project_list_desc: {
    zh: '列出所有有配置的项目',
    en: 'List all projects with configuration',
  },
  project_none: {
    zh: '  未找到项目。',
    en: '  No projects found.',
  },
  project_show_desc: {
    zh: '显示项目配置',
    en: 'Show project configuration',
  },
  project_no_config: {
    zh: '  未找到 ${dir} 的配置。',
    en: '  No configuration found for ${dir}',
  },

  // ── REPL (repl.ts) ──
  repl_banner: {
    zh: '  Claude Code Config (ccc)',
    en: '  Claude Code Config (ccc)',
  },
  repl_hint: {
    zh: '  输入 /help 查看可用命令',
    en: '  Type /help for available commands',
  },
  repl_prompt: {
    zh: '>',
    en: '>',
  },
  repl_bye: {
    zh: '  再见！',
    en: '  Bye!',
  },
  repl_aborted: {
    zh: '  已取消，返回主界面。',
    en: '  Aborted, returning to main prompt.',
  },
  repl_unknown_cmd: {
    zh: '  未知命令: /${cmd}',
    en: '  Unknown command: /${cmd}',
  },
  repl_error: {
    zh: '  错误: ${msg}',
    en: '  Error: ${msg}',
  },
  repl_unknown_input: {
    zh: '  未知输入: ${input}',
    en: '  Unknown input: ${input}',
  },
  repl_help_title: {
    zh: '  可用命令:',
    en: '  Available commands:',
  },
  repl_help_preset: {
    zh: '  /preset    - 列出和切换预设',
    en: '  /preset    - List and switch presets',
  },
  repl_help_template: {
    zh: '  /template  - 列出和应用模板',
    en: '  /template  - List and apply templates',
  },
  repl_help_create: {
    zh: '  /create    - 引导式创建新预设',
    en: '  /create    - Guided creation of a new preset',
  },
  repl_help_edit: {
    zh: '  /edit      - 编辑已有预设',
    en: '  /edit      - Edit an existing preset',
  },
  repl_help_delete: {
    zh: '  /delete    - 删除已有预设',
    en: '  /delete    - Delete an existing preset',
  },
  repl_help_current: {
    zh: '  /current   - 显示当前配置',
    en: '  /current   - Show current config',
  },
  repl_help_help: {
    zh: '  /help      - 显示此帮助',
    en: '  /help      - Show this help',
  },
  repl_help_quit: {
    zh: '  /quit      - 退出',
    en: '  /quit      - Exit',
  },
  repl_no_presets: {
    zh: '  未找到预设。',
    en: '  No presets found.',
  },
  repl_use_template_hint: {
    zh: '  使用 /template 从模板创建一个。',
    en: '  Use /template to create one from a template.',
  },
  repl_active_marker: {
    zh: '    ● ${name}  ← 活动',
    en: '    ● ${name}  ← active',
  },
  repl_inactive_marker: {
    zh: '    ○ ${name}',
    en: '    ○ ${name}',
  },
  repl_select_preset: {
    zh: '选择要切换的预设:',
    en: 'Select a preset to switch:',
  },
  repl_already_active: {
    zh: '  已经是活动状态。',
    en: '  Already active.',
  },
  repl_switching: {
    zh: '正在切换到 "${name}"...',
    en: 'Switching to "${name}"...',
  },
  repl_switched: {
    zh: '已切换到预设 "${name}"',
    en: 'Switched to preset "${name}"',
  },
  repl_no_templates: {
    zh: '  未找到模板。',
    en: '  No templates found.',
  },
  repl_select_template: {
    zh: '选择要应用的模板:',
    en: 'Select a template to apply:',
  },
  repl_creating: {
    zh: '正在创建预设 "${name}"...',
    en: 'Creating preset "${name}"...',
  },
  repl_created: {
    zh: '已从模板 "${tmpl}" 创建预设 "${name}"',
    en: 'Created preset "${name}" from template "${tmpl}"',
  },
  repl_delete_select: {
    zh: '选择要删除的预设:',
    en: 'Select a preset to delete:',
  },
  repl_delete_confirm: {
    zh: '确认删除预设 "${name}"？此操作不可撤销。',
    en: 'Delete preset "${name}"? This cannot be undone.',
  },
  repl_deleted: {
    zh: '已删除预设 "${name}"',
    en: 'Deleted preset "${name}"',
  },

  // ── Interactive menu (interactive.ts) ──
  interactive_presets_header: {
    zh: '  ── 预设 ──',
    en: '  ── Presets ──',
  },
  interactive_none: {
    zh: '  （无）',
    en: '  (none)',
  },
  interactive_what_to_do: {
    zh: '你想做什么？',
    en: 'What do you want to do?',
  },
  interactive_switch: {
    zh: '▶  切换预设',
    en: '▶  Switch preset',
  },
  interactive_add: {
    zh: '＋  添加新预设',
    en: '＋  Add new preset',
  },
  interactive_edit: {
    zh: '✎  编辑预设',
    en: '✎  Edit preset',
  },
  interactive_delete: {
    zh: '✕  删除预设',
    en: '✕  Delete preset',
  },
  interactive_view: {
    zh: '◉  查看预设详情',
    en: '◉  View preset details',
  },
  interactive_quit: {
    zh: '←  退出',
    en: '←  Quit',
  },
  interactive_bye: {
    zh: '再见！',
    en: 'Bye!',
  },
  interactive_error: {
    zh: '  错误: ${msg}',
    en: '  Error: ${msg}',
  },
  interactive_no_presets_switch: {
    zh: '  没有可切换的预设。请先添加一个。',
    en: '  No presets to switch. Add one first.',
  },
  interactive_select_switch: {
    zh: '选择要切换到的预设:',
    en: 'Select a preset to switch to:',
  },
  interactive_no_presets_edit: {
    zh: '  没有可编辑的预设。',
    en: '  No presets to edit.',
  },
  interactive_no_presets_delete: {
    zh: '  没有可删除的预设。',
    en: '  No presets to delete.',
  },
  interactive_no_presets_view: {
    zh: '  没有可查看的预设。',
    en: '  No presets to view.',
  },
  interactive_create_from: {
    zh: '创建预设来源:',
    en: 'Create preset from:',
  },
  interactive_from_current: {
    zh: '当前 settings.json',
    en: 'Current settings.json',
  },
  interactive_from_copy: {
    zh: '从现有预设复制',
    en: 'Copy from existing preset',
  },
  interactive_from_file: {
    zh: '从文件导入',
    en: 'From a file',
  },
  interactive_copy_which: {
    zh: '从哪个预设复制？',
    en: 'Copy from which preset?',
  },
  interactive_new_preset_name: {
    zh: '新预设名称:',
    en: 'New preset name:',
  },
  interactive_created_from: {
    zh: '已从 "${src}" 创建预设 "${name}"',
    en: 'Created preset "${name}" from "${src}"',
  },
  interactive_file_path: {
    zh: '文件路径:',
    en: 'File path:',
  },
  interactive_path_required: {
    zh: '路径不能为空',
    en: 'Path is required',
  },
  interactive_created_from_file: {
    zh: '已从文件创建预设 "${name}"',
    en: 'Created preset "${name}" from file',
  },
  interactive_saved_current: {
    zh: '已将当前设置保存为预设 "${name}"',
    en: 'Saved current settings as preset "${name}"',
  },
  interactive_select_edit: {
    zh: '选择要编辑的预设:',
    en: 'Select a preset to edit:',
  },
  interactive_editing: {
    zh: '编辑预设 "${name}":',
    en: 'Editing preset "${name}":',
  },
  interactive_modify_field: {
    zh: '修改字段',
    en: 'Modify a field',
  },
  interactive_add_env: {
    zh: '添加新环境变量',
    en: 'Add new env variable',
  },
  interactive_remove_field: {
    zh: '移除字段',
    en: 'Remove a field',
  },
  interactive_select_modify: {
    zh: '选择要修改的字段:',
    en: 'Select field to modify:',
  },
  interactive_new_value: {
    zh: '${field} 的新值:',
    en: 'New value for ${field}:',
  },
  interactive_updated: {
    zh: '已更新 ${field}',
    en: 'Updated ${field}',
  },
  interactive_env_name: {
    zh: '环境变量名:',
    en: 'ENV variable name:',
  },
  interactive_key_required: {
    zh: '键不能为空',
    en: 'Key is required',
  },
  interactive_value_prompt: {
    zh: '值:',
    en: 'Value:',
  },
  interactive_value_required: {
    zh: '值不能为空',
    en: 'Value is required',
  },
  interactive_added_env: {
    zh: '已添加 env.${key}',
    en: 'Added env.${key}',
  },
  interactive_select_remove: {
    zh: '选择要移除的字段:',
    en: 'Select field to remove:',
  },
  interactive_removed: {
    zh: '已移除 ${field}',
    en: 'Removed ${field}',
  },
  interactive_select_delete: {
    zh: '选择要删除的预设:',
    en: 'Select a preset to delete:',
  },
  interactive_delete_confirm: {
    zh: '删除预设 "${name}"？此操作不可撤销。',
    en: 'Delete preset "${name}"? This cannot be undone.',
  },
  interactive_cancelled: {
    zh: '  已取消。',
    en: '  Cancelled.',
  },
  interactive_deleted: {
    zh: '已删除预设 "${name}"',
    en: 'Deleted preset "${name}"',
  },
  interactive_select_view: {
    zh: '选择要查看的预设:',
    en: 'Select a preset to view:',
  },
  interactive_plugins_count: {
    zh: '  ${count} 个已启用',
    en: '  ${count} enabled',
  },

  // ── Shared ──
  cancelled: {
    zh: '已取消。',
    en: 'Cancelled.',
  },

  // ── Errors (errors.ts) ──
  err_preset_not_found: {
    zh: '预设 "${name}" 未找到。运行 "ccc preset list" 查看可用预设。',
    en: 'Preset "${name}" not found. Run "ccc preset list" to see available presets.',
  },
  err_invalid_config: {
    zh: '${filePath} 中的配置无效:\n${message}',
    en: 'Invalid config in ${filePath}:\n${message}',
  },
  err_read_failed: {
    zh: '读取 ${filePath} 失败: ${cause}',
    en: 'Failed to read ${filePath}: ${cause}',
  },
  err_write_failed: {
    zh: '写入 ${filePath} 失败: ${cause}',
    en: 'Failed to write ${filePath}: ${cause}',
  },
  err_unknown: {
    zh: '未知错误',
    en: 'unknown error',
  },
  err_handle_error: {
    zh: '错误: ${msg}',
    en: 'Error: ${msg}',
  },
  err_handle_unknown: {
    zh: '未知错误: ${msg}',
    en: 'Unknown error: ${msg}',
  },

  // ── Utils (safe-json.ts, backup.ts) ──
  util_file_not_found: {
    zh: '文件未找到',
    en: 'File not found',
  },
  util_backup_not_found: {
    zh: '备份 "${name}" 未找到',
    en: 'Backup "${name}" not found',
  },

  // ── Core (switcher.ts, diff.ts, writer.ts) ──
  switcher_no_changes: {
    zh: '  配置无变更。',
    en: '  No changes in configuration.',
  },
  diff_no_differences: {
    zh: '  未发现差异。',
    en: '  No differences found.',
  },
  diff_comparing: {
    zh: '  比较 ${label1} → ${label2}:\n',
    en: '  Comparing ${label1} → ${label2}:\n',
  },
  writer_preset_not_found: {
    zh: '预设 "${name}" 未找到',
    en: 'Preset "${name}" not found',
  },
  writer_preset_already_exists: {
    zh: '预设 "${name}" 已存在',
    en: 'Preset "${name}" already exists',
  },

  // ── Builtin template descriptions (templates.ts) ──
  tmpl_builtin_api_proxy_desc: {
    zh: '国内 API 代理 (兼容 Anthropic API)',
    en: 'Domestic API proxy (compatible with Anthropic API)',
  },
  tmpl_builtin_api_proxy_key_desc: {
    zh: '代理服务的 API Key',
    en: 'API Key for the proxy service',
  },
  tmpl_builtin_api_proxy_url_desc: {
    zh: '代理服务的 Base URL',
    en: 'Base URL for the proxy service',
  },
  tmpl_builtin_custom_model_desc: {
    zh: '自定义模型配置',
    en: 'Custom model configuration',
  },
  tmpl_builtin_sonnet_desc: {
    zh: 'Sonnet 模型 ID',
    en: 'Sonnet model ID',
  },
  tmpl_builtin_opus_desc: {
    zh: 'Opus 模型 ID',
    en: 'Opus model ID',
  },
  tmpl_builtin_haiku_desc: {
    zh: 'Haiku 模型 ID',
    en: 'Haiku model ID',
  },
  tmpl_builtin_proxy_models_desc: {
    zh: '代理服务 + 自定义模型',
    en: 'Proxy + custom models',
  },
  tmpl_builtin_permissive_desc: {
    zh: '宽松权限 + 跳过危险模式提示',
    en: 'Permissive permissions + skip dangerous mode prompt',
  },
  tmpl_custom_desc: {
    zh: '自定义模板: ${name}',
    en: 'Custom template: ${name}',
  },

  // ── Create command (create.ts) ──
  create_desc: {
    zh: '引导式创建新预设',
    en: 'Guided creation of a new preset',
  },
  create_preset_name_prompt: {
    zh: '预设名称:',
    en: 'Preset name:',
  },
  create_name_required: {
    zh: '名称不能为空',
    en: 'Name is required',
  },
  create_name_exists: {
    zh: '预设 "${name}" 已存在',
    en: 'Preset "${name}" already exists',
  },
  create_optional_hint: {
    zh: '（可选，按回车跳过）',
    en: '(optional, press Enter to skip)',
  },
  create_default_hint: {
    zh: '（按回车使用默认值）',
    en: '(press Enter for default)',
  },
  create_skip_option: {
    zh: '跳过此字段',
    en: 'Skip this field',
  },
  create_field_example: {
    zh: '示例: ${example}',
    en: 'Example: ${example}',
  },
  create_summary_header: {
    zh: '  ── 配置摘要 ──',
    en: '  ── Configuration Summary ──',
  },
  create_confirm: {
    zh: '确认保存？',
    en: 'Confirm and save?',
  },
  create_saved: {
    zh: '已创建预设 "${name}"',
    en: 'Created preset "${name}"',
  },
  create_cancelled: {
    zh: '已取消创建。',
    en: 'Creation cancelled.',
  },
  // Field descriptions
  create_field_header: {
    zh: '${key}',
    en: '${key}',
  },
  create_api_key_desc: {
    zh: 'Anthropic API 密钥，用于身份验证',
    en: 'API key for Anthropic API authentication',
  },
  create_api_key_example: {
    zh: 'sk-ant-api03-xxxxxx',
    en: 'sk-ant-api03-xxxxxx',
  },
  create_auth_token_desc: {
    zh: 'Auth 令牌，某些代理服务需要此令牌而非 API Key',
    en: 'Auth token, some proxy services require this instead of API Key',
  },
  create_auth_token_example: {
    zh: 'sk-xxxxxx',
    en: 'sk-xxxxxx',
  },
  create_base_url_desc: {
    zh: 'API 代理地址，用于转发请求到 Anthropic 或兼容服务',
    en: 'API proxy URL for forwarding requests to Anthropic or compatible services',
  },
  create_base_url_example: {
    zh: 'https://api.example.com',
    en: 'https://api.example.com',
  },
  create_sonnet_model_desc: {
    zh: '默认 Sonnet 模型 ID',
    en: 'Default Sonnet model ID',
  },
  create_opus_model_desc: {
    zh: '默认 Opus 模型 ID',
    en: 'Default Opus model ID',
  },
  create_haiku_model_desc: {
    zh: '默认 Haiku 模型 ID',
    en: 'Default Haiku model ID',
  },
  create_permissions_desc: {
    zh: '权限模式 — default=正常询问, bypassPermissions=跳过所有权限, acceptEdits=自动接受编辑',
    en: 'Permission mode — default=normal prompts, bypassPermissions=skip all, acceptEdits=auto-accept edits',
  },
  create_language_desc: {
    zh: '界面语言设置',
    en: 'Interface language',
  },
  create_language_example: {
    zh: 'zh / en',
    en: 'zh / en',
  },
  create_thinking_desc: {
    zh: '是否始终启用思维链模式',
    en: 'Always enable thinking chain mode',
  },
  create_dangerous_desc: {
    zh: '是否跳过危险模式的权限提示',
    en: 'Skip permission prompts for dangerous mode',
  },

  // ── Edit command (edit.ts) ──
  edit_desc: {
    zh: '编辑已有预设',
    en: 'Edit an existing preset',
  },
  edit_no_presets: {
    zh: '  没有可编辑的预设。',
    en: '  No presets to edit.',
  },
  edit_select: {
    zh: '选择要编辑的预设:',
    en: 'Select a preset to edit:',
  },
  edit_preset_not_found: {
    zh: '预设 "${name}" 未找到',
    en: 'Preset "${name}" not found',
  },
  edit_header: {
    zh: '  ── 编辑预设 "${name}" ──',
    en: '  ── Editing preset "${name}" ──',
  },
  edit_no_fields: {
    zh: '  （无字段）',
    en: '  (no fields)',
  },
  edit_what_to_do: {
    zh: '要做什么？',
    en: 'What do you want to do?',
  },
  edit_modify: {
    zh: '修改已有字段',
    en: 'Modify a field',
  },
  edit_add_env: {
    zh: '添加/覆盖环境变量',
    en: 'Add/overwrite env variable',
  },
  edit_remove: {
    zh: '删除字段',
    en: 'Remove a field',
  },
  edit_view: {
    zh: '查看当前状态',
    en: 'View current state',
  },
  edit_save: {
    zh: '保存并退出',
    en: 'Save and exit',
  },
  edit_discard: {
    zh: '放弃修改',
    en: 'Discard changes',
  },
  edit_select_modify: {
    zh: '选择要修改的字段:',
    en: 'Select field to modify:',
  },
  edit_new_value: {
    zh: '${field} 的新值:',
    en: 'New value for ${field}:',
  },
  edit_updated: {
    zh: '已更新 ${field}',
    en: 'Updated ${field}',
  },
  edit_env_key: {
    zh: '环境变量名:',
    en: 'ENV variable name:',
  },
  edit_env_key_required: {
    zh: '变量名不能为空',
    en: 'Variable name is required',
  },
  edit_env_value: {
    zh: '值:',
    en: 'Value:',
  },
  edit_env_value_required: {
    zh: '值不能为空',
    en: 'Value is required',
  },
  edit_env_added: {
    zh: '已设置 env.${key}',
    en: 'Set env.${key}',
  },
  edit_select_remove: {
    zh: '选择要删除的字段:',
    en: 'Select field to remove:',
  },
  edit_removed: {
    zh: '已删除 ${field}',
    en: 'Removed ${field}',
  },
  edit_saved: {
    zh: '已保存预设 "${name}"',
    en: 'Saved preset "${name}"',
  },
  edit_discarded: {
    zh: '已放弃修改。',
    en: 'Changes discarded.',
  },
  edit_plugins_count: {
    zh: '  ${count} 个已启用插件',
    en: '  ${count} plugins enabled',
  },
};
