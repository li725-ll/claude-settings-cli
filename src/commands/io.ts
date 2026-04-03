import { Command } from 'commander';
import fs from 'fs-extra';
import { ConfigReader } from '../core/reader.js';
import { ConfigWriter } from '../core/writer.js';
import { readJsonSafe } from '../utils/safe-json.js';
import { success, spinner } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { t } from '../i18n.js';
import type { ExportData } from '../types/index.js';

export const ioCommand = new Command('export')
  .description(t('io_export_desc'))
  .option('-o, --output <file>', t('io_output_opt'))
  .option('--include-plugins', t('io_include_plugins_opt'))
  .action(async (opts: { output?: string; includePlugins?: boolean }) => {
    try {
      const s = spinner(t('io_exporting'));
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

      s.succeed(t('io_exported', { path: outputPath }));
    } catch (err) {
      handleError(err);
    }
  });

export const importCommand = new Command('import')
  .description(t('io_import_desc'))
  .argument('<file>', t('io_file_arg'))
  .option('-m, --mode <mode>', t('io_mode_opt'), 'merge')
  .action(async (file: string, opts: { mode: string }) => {
    try {
      const s = spinner(t('io_importing'));
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

      s.succeed(t('io_imported', { file }));
    } catch (err) {
      handleError(err);
    }
  });
