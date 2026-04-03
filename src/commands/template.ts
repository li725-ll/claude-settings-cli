import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { TemplateManager } from '../core/templates.js';
import { ConfigWriter } from '../core/writer.js';
import { ConfigReader } from '../core/reader.js';
import { success, spinner } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export const templateCommand = new Command('template')
  .description('Manage configuration templates');

templateCommand
  .command('list')
  .description('List all available templates')
  .action(() => {
    const templates = TemplateManager.listAll();
    if (templates.length === 0) {
      console.log(chalk.dim('  No templates found.'));
      return;
    }

    console.log('');
    for (const t of templates) {
      const tag = t.isBuiltin
        ? chalk.blue('[builtin]')
        : chalk.yellow('[custom] ');
      console.log(`  ${tag} ${chalk.white(t.name.padEnd(20))} ${chalk.dim(`- ${t.description}`)}`);
    }
    console.log('');
  });

templateCommand
  .command('apply <name>')
  .description('Apply a template to create a preset')
  .option('-p, --preset <name>', 'Preset name to create')
  .action(async (name: string, opts: { preset?: string }) => {
    try {
      const template = TemplateManager.find(name);
      if (!template) {
        handleError(new Error(`Template "${name}" not found. Run "ccc template list" to see available templates.`));
        return;
      }

      const values: Record<string, string> = {};
      for (const v of template.variables) {
        const { val } = await inquirer.prompt([
          {
            type: v.sensitive ? 'password' : 'input',
            name: 'val',
            message: `${v.description} (${v.key}):${v.defaultValue ? ` [${v.defaultValue}]` : ''}`,
            default: v.defaultValue,
            validate: (input: string) => {
              if (v.required && !input.trim()) return `${v.key} is required`;
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
            message: 'Preset name:',
            validate: (v: string) => {
              if (!v.trim()) return 'Name is required';
              if (presets.includes(v.trim())) return 'Preset already exists';
              return true;
            },
          },
        ]);
        presetName = answer.presetName.trim();
      }

      const finalName = presetName!;
      const s = spinner(`Creating preset "${finalName}" from template "${template.name}"...`);
      await ConfigWriter.savePreset(finalName, rendered);
      s.succeed(`Created preset "${finalName}" from template "${template.name}"`);
    } catch (err) {
      handleError(err);
    }
  });

templateCommand
  .command('save <name>')
  .description('Save current settings as a template')
  .option('-d, --description <desc>', 'Template description')
  .action(async (name: string, opts: { description?: string }) => {
    try {
      if (TemplateManager.listBuiltin().some((t) => t.name === name)) {
        handleError(new Error(`Cannot overwrite builtin template "${name}"`));
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
        success(`Saved template "${name}"`);
        return;
      }

      const { selected } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selected',
          message: 'Select env variables to make into template variables:',
          choices: envKeys.map((k) => ({ name: k, value: k })),
        },
      ]);

      const variables = [];
      for (const key of selected) {
        const { desc, sensitive } = await inquirer.prompt([
          {
            type: 'input',
            name: 'desc',
            message: `Description for ${key}:`,
            default: key,
          },
          {
            type: 'confirm',
            name: 'sensitive',
            message: `Is ${key} sensitive? (will mask input)`,
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
      success(`Saved template "${name}"`);
    } catch (err) {
      handleError(err);
    }
  });

templateCommand
  .command('delete <name>')
  .description('Delete a custom template')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (name: string, opts: { yes?: boolean }) => {
    try {
      const template = TemplateManager.find(name);
      if (!template) {
        handleError(new Error(`Template "${name}" not found`));
        return;
      }
      if (template.isBuiltin) {
        handleError(new Error(`Cannot delete builtin template "${name}"`));
        return;
      }

      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete template "${name}"?`,
            default: false,
          },
        ]);
        if (!confirm) {
          console.log(chalk.dim('Cancelled.'));
          return;
        }
      }

      await TemplateManager.deleteTemplate(name);
      success(`Deleted template "${name}"`);
    } catch (err) {
      handleError(err);
    }
  });

templateCommand
  .command('view <name>')
  .description('View template details')
  .action(async (name: string) => {
    try {
      const template = TemplateManager.find(name);
      if (!template) {
        handleError(new Error(`Template "${name}" not found`));
        return;
      }

      console.log('');
      console.log(chalk.bold(`  ${template.name}`));
      console.log(`  ${chalk.dim(template.description)}`);
      if (template.isBuiltin) {
        console.log(`  ${chalk.blue('[builtin]')}`);
      }

      if (template.variables.length > 0) {
        console.log('');
        console.log(chalk.bold('  Variables:'));
        for (const v of template.variables) {
          const parts = [`  - ${v.key}`];
          parts.push(chalk.dim(`(${v.description})`));
          if (v.defaultValue) parts.push(chalk.dim(`default: ${v.defaultValue}`));
          if (v.required) parts.push(chalk.red('required'));
          if (v.sensitive) parts.push(chalk.yellow('sensitive'));
          console.log(parts.join(' '));
        }
      }

      console.log('');
      console.log(chalk.bold('  Settings:'));
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
