import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { TemplateManager } from '../core/templates.js';
import { ConfigWriter } from '../core/writer.js';
import { ConfigReader } from '../core/reader.js';
import { success, spinner } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { t } from '../i18n.js';

export const templateCommand = new Command('template')
  .description(t('template_desc'));

templateCommand
  .command('list')
  .description(t('template_list_desc'))
  .action(() => {
    const templates = TemplateManager.listAll();
    if (templates.length === 0) {
      console.log(chalk.dim(t('template_no_templates')));
      return;
    }

    console.log('');
    for (const tmpl of templates) {
      const tag = tmpl.isBuiltin
        ? chalk.blue(t('template_builtin_tag'))
        : chalk.yellow(t('template_custom_tag') + ' ');
      console.log(`  ${tag} ${chalk.white(tmpl.name.padEnd(20))} ${chalk.dim(`- ${tmpl.description}`)}`);
    }
    console.log('');
  });

templateCommand
  .command('apply <name>')
  .description(t('template_apply_desc'))
  .option('-p, --preset <name>', t('template_preset_opt_desc'))
  .action(async (name: string, opts: { preset?: string }) => {
    try {
      const template = TemplateManager.find(name);
      if (!template) {
        handleError(new Error(t('template_not_found', { name })));
        return;
      }

      const values: Record<string, string> = {};
      for (const v of template.variables) {
        const defaultVal = v.defaultValue ? ` [${v.defaultValue}]` : '';
        const { val } = await inquirer.prompt([
          {
            type: v.sensitive ? 'password' : 'input',
            name: 'val',
            message: t('template_var_prompt', { desc: v.description, key: v.key, defaultVal }),
            default: v.defaultValue,
            validate: (input: string) => {
              if (v.required && !input.trim()) return t('template_var_required', { key: v.key });
              return true;
            },
          },
        ]);
        values[v.key] = val.trim() || v.defaultValue || '';
      }

      const rendered = TemplateManager.renderSettings(template, values);

      let presetName = opts.preset;
      if (!presetName) {
        const presets = ConfigReader.listPresets();
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'presetName',
            message: t('template_preset_name_prompt'),
            validate: (v: string) => {
              if (!v.trim()) return t('template_name_required');
              if (presets.includes(v.trim())) return t('template_preset_exists');
              return true;
            },
          },
        ]);
        presetName = answer.presetName.trim();
      }

      const finalName = presetName!;
      const s = spinner(t('template_creating', { name: finalName, tmpl: template.name }));
      await ConfigWriter.savePreset(finalName, rendered);
      s.succeed(t('template_created', { name: finalName, tmpl: template.name }));
    } catch (err) {
      handleError(err);
    }
  });

templateCommand
  .command('save <name>')
  .description(t('template_save_desc'))
  .option('-d, --description <desc>', t('template_description_opt'))
  .action(async (name: string, opts: { description?: string }) => {
    try {
      if (TemplateManager.listBuiltin().some((tmpl) => tmpl.name === name)) {
        handleError(new Error(t('template_overwrite_builtin', { name })));
        return;
      }

      const settings = ConfigReader.readSettings();
      const envKeys = Object.keys(settings.env);

      if (envKeys.length === 0) {
        await TemplateManager.saveAsTemplate(
          name,
          settings,
          [],
          opts.description,
        );
        success(t('template_saved', { name }));
        return;
      }

      const { selected } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selected',
          message: t('template_select_vars'),
          choices: envKeys.map((k) => ({ name: k, value: k })),
        },
      ]);

      const variables = [];
      for (const key of selected) {
        const { desc, sensitive } = await inquirer.prompt([
          {
            type: 'input',
            name: 'desc',
            message: t('template_var_desc_prompt', { key }),
            default: key,
          },
          {
            type: 'confirm',
            name: 'sensitive',
            message: t('template_var_sensitive', { key }),
            default: false,
          },
        ]);
        variables.push({
          key,
          description: desc,
          required: true,
          sensitive,
        });
      }

      const templateSettings = structuredClone(settings);
      for (const v of variables) {
        templateSettings.env[v.key] = `{{${v.key}}}`;
      }

      await TemplateManager.saveAsTemplate(
        name,
        templateSettings,
        variables,
        opts.description,
      );
      success(t('template_saved', { name }));
    } catch (err) {
      handleError(err);
    }
  });

templateCommand
  .command('delete <name>')
  .description(t('template_delete_desc'))
  .option('-y, --yes', t('template_delete_yes'))
  .action(async (name: string, opts: { yes?: boolean }) => {
    try {
      const template = TemplateManager.find(name);
      if (!template) {
        handleError(new Error(t('template_not_found_simple', { name })));
        return;
      }
      if (template.isBuiltin) {
        handleError(new Error(t('template_delete_builtin', { name })));
        return;
      }

      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: t('template_delete_confirm', { name }),
            default: false,
          },
        ]);
        if (!confirm) {
          console.log(chalk.dim(t('cancelled')));
          return;
        }
      }

      await TemplateManager.deleteTemplate(name);
      success(t('template_deleted', { name }));
    } catch (err) {
      handleError(err);
    }
  });

templateCommand
  .command('view <name>')
  .description(t('template_view_desc'))
  .action(async (name: string) => {
    try {
      const template = TemplateManager.find(name);
      if (!template) {
        handleError(new Error(t('template_not_found_simple', { name })));
        return;
      }

      console.log('');
      console.log(chalk.bold(`  ${template.name}`));
      console.log(`  ${chalk.dim(template.description)}`);
      if (template.isBuiltin) {
        console.log(`  ${chalk.blue(t('template_builtin_tag'))}`);
      }

      if (template.variables.length > 0) {
        console.log('');
        console.log(chalk.bold(t('template_variables_header')));
        for (const v of template.variables) {
          const parts = [`  - ${v.key}`];
          parts.push(chalk.dim(`(${v.description})`));
          if (v.defaultValue) parts.push(chalk.dim(`default: ${v.defaultValue}`));
          if (v.required) parts.push(chalk.red(t('template_required')));
          if (v.sensitive) parts.push(chalk.yellow(t('template_sensitive')));
          console.log(parts.join(' '));
        }
      }

      console.log('');
      console.log(chalk.bold(t('template_settings_header')));
      for (const [k, v] of Object.entries(template.settings.env ?? {})) {
        console.log(`  - ${k}: ${v}`);
      }
      if (template.settings.permissions) {
        console.log(`  - permissions: ${JSON.stringify(template.settings.permissions)}`);
      }
      console.log('');
    } catch (err) {
      handleError(err);
    }
  });
