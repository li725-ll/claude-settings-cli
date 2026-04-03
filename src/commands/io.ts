import { Command } from 'commander';
import fs from 'fs-extra';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { readJsonSafe } from '../utils/safe-json.js';
import { success, spinner } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import type { ExportData } from '../types/index.js';

export const ioCommand = new Command('export')
  .description('Export configuration to a file')
  .option('-o, --output <file>', 'Output file path')
  .option('--include-plugins', 'Include plugin data')
  .action(async (opts: { output?: string; includePlugins?: boolean }) => {
    try {
      const s = spinner('Exporting configuration...');
      const settings = ConfigReader.readSettings();
      const presets = ConfigReader.listPresets();

      const presetData: Record<string, unknown> = {};
      for (const name of presets) {
        presetData[name] = ConfigReader.readPreset(name);
      }

      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings,
        presets: presetData as ExportData['presets'],
      };

      if (opts.includePlugins) {
        exportData.plugins = {
          installed: ConfigReader.readInstalledPlugins() ?? { version: 2, plugins: {} },
          blocklist: ConfigReader.readBlocklist(),
        };
      }

      const date = new Date().toISOString().slice(0, 10);
      const outputPath = opts.output ?? `ccc-export-${date}.json`;
      await fs.writeJson(outputPath, exportData, { spaces: 2 });

      s.succeed(`Configuration exported to ${outputPath}`);
    } catch (err) {
      handleError(err);
    }
  });

export const importCommand = new Command('import')
  .description('Import configuration from a file')
  .argument('<file>', 'Configuration file to import')
  .option('-m, --mode <mode>', 'Import mode: merge or replace', 'merge')
  .action(async (file: string, opts: { mode: string }) => {
    try {
      const s = spinner('Importing configuration...');
      const data = (await readJsonSafe(file)) as ExportData;

      if (opts.mode === 'replace') {
        await ConfigWriter.writeSettings(data.settings);
      } else {
        const current = ConfigReader.readSettings();
        const merged = { ...current, ...data.settings };
        await ConfigWriter.writeSettings(merged);
      }

      if (data.presets) {
        for (const [name, preset] of Object.entries(data.presets)) {
          await ConfigWriter.savePreset(
            name,
            preset as ExportData['presets'][string],
          );
        }
      }

      s.succeed(`Configuration imported from ${file}`);
    } catch (err) {
      handleError(err);
    }
  });
