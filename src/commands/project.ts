import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'node:path';
import { PROJECTS_DIR, encodeProjectDir, decodeProjectDir } from '../core/paths.js';
import { readJsonSafe } from '../utils/safe-json.js';
import { success } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export const projectCommand = new Command('project')
  .description('Manage project-level configuration');

projectCommand
  .command('list')
  .description('List all projects with configuration')
  .action(async () => {
    try {
      if (!(await fs.pathExists(PROJECTS_DIR))) {
        console.log(chalk.dim('  No projects found.'));
        return;
      }

      const entries = await fs.readdir(PROJECTS_DIR);
      const projects = entries.filter((e) =>
        fs.pathExistsSync(path.join(PROJECTS_DIR, e)),
      );

      console.log('');
      if (projects.length === 0) {
        console.log(chalk.dim('  No projects found.'));
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
  .description('Show project configuration')
  .action(async (dir: string) => {
    try {
      const encoded = encodeProjectDir(path.resolve(dir));
      const projectDir = path.join(PROJECTS_DIR, encoded);

      if (!(await fs.pathExists(projectDir))) {
        console.log(chalk.dim(`  No configuration found for ${dir}`));
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
