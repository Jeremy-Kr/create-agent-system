import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { CONFIG_FILE_NAME } from '../../utils/constants.js';
import type { MigrationContext, MigrationResult, MigrationStep } from '../migrator.js';

export const v02ToV10: MigrationStep = {
  from: '0.2',
  to: '1.0',
  description: 'Update config version to 1.0 and add language field',

  async migrate(ctx: MigrationContext): Promise<MigrationResult> {
    const { targetDir, dryRun } = ctx;
    const changes: MigrationResult['changes'] = [];
    const warnings: string[] = [];

    const configPath = join(targetDir, CONFIG_FILE_NAME);
    const content = await readFile(configPath, 'utf-8');
    const raw = parseYaml(content) as Record<string, unknown>;

    raw.version = '1.0';

    if (!raw.language) {
      raw.language = 'en';
    }

    if (!dryRun) {
      const yamlContent = stringifyYaml(raw, { lineWidth: 120 });
      await writeFile(configPath, yamlContent, 'utf-8');
    }

    changes.push({
      file: CONFIG_FILE_NAME,
      action: 'modified',
      description: 'Updated version 0.2 → 1.0, added language field',
    });

    return { changes, warnings };
  },
};
