import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'node:path';
import { PROJECTS_DIR, encodeProjectDir, decodeProjectDir } from '../core/paths.js';
import { readJsonSafe } from '../utils/safe-json.js';
import { success } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { t } from '../i18n.js';

export const projectCommand = new Command('project')
  .description(t('project_desc'));

projectCommand
  .command('list')
  .description(t('project_list_desc'))
  .action(async () => {
    try {
      if (!(await fs.pathExists(PROJECTS_DIR))) {
        console.log(chalk.dim(t('project_none')));
        return;
      }

      const entries = await fs.readdir(PROJECTS_DIR);
      const projects = entries.filter((e) =>
        fs.pathExistsSync(path.join(PROJECTS_DIR, e)),
      );

      console.log('');
      if (projects.length === 0) {
        console.log(chalk.dim(t('project_none')));
      }
      for (const encoded of projects) {
        const dir = decodeProjectDir(encoded);
        console.log(`  ${chalk.white(dir)}`);
      }
      console.log('');
    } catch (err) {
      handleError(err);
    }
  });

projectCommand
  .command('show <dir>')
  .description(t('project_show_desc'))
  .action(async (dir: string) => {
    try {
      const encoded = encodeProjectDir(path.resolve(dir));
      const projectDir = path.join(PROJECTS_DIR, encoded);

      if (!(await fs.pathExists(projectDir))) {
        console.log(chalk.dim(t('project_no_config', { dir })));
        return;
      }

      const files = await fs.readdir(projectDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      console.log('');
      for (const file of jsonFiles) {
        const filePath = path.join(projectDir, file);
        const data = await readJsonSafe(filePath);
        console.log(chalk.cyan(`  ${file}:`));
        console.log(`  ${JSON.stringify(data, null, 4)}`);
      }
      console.log('');
    } catch (err) {
      handleError(err);
    }
  });
