import chalk from 'chalk';
import { t } from '../i18n.js';

export function diffObjects(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  prefix = '',
): string[] {
  const lines: string[] = [];
  const allKeys = new Set([
    ...Object.keys(obj1),
    ...Object.keys(obj2),
  ]);

  for (const key of [...allKeys].sort()) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (!(key in obj1)) {
      lines.push(chalk.green(`  + ${fullPath}: ${JSON.stringify(val2)}`));
    } else if (!(key in obj2)) {
      lines.push(chalk.red(`  - ${fullPath}: ${JSON.stringify(val1)}`));
    } else if (
      typeof val1 === 'object' &&
      typeof val2 === 'object' &&
      val1 !== null &&
      val2 !== null &&
      !Array.isArray(val1) &&
      !Array.isArray(val2)
    ) {
      lines.push(
        ...diffObjects(
          val1 as Record<string, unknown>,
          val2 as Record<string, unknown>,
          fullPath,
        ),
      );
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      lines.push(chalk.red(`  - ${fullPath}: ${JSON.stringify(val1)}`));
      lines.push(chalk.green(`  + ${fullPath}: ${JSON.stringify(val2)}`));
    }
  }

  return lines;
}

export function printDiff(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  label1 = 'current',
  label2 = 'target',
): void {
  const lines = diffObjects(obj1, obj2);
  if (lines.length === 0) {
    console.log(chalk.dim(t('diff_no_differences')));
  } else {
    console.log(chalk.dim(t('diff_comparing', { label1, label2 })));
    for (const line of lines) {
      console.log(line);
    }
  }
}
