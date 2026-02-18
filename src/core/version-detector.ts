import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { t } from '../i18n/index.js';
import { CONFIG_FILE_NAME } from '../utils/constants.js';
import { dirExists, fileExists } from '../utils/fs.js';

export type DetectedVersion = '0.1' | '0.2' | '1.0';

export interface DetectionResult {
  version: DetectedVersion;
  configPath?: string;
  hasAgentsDir: boolean;
  hasClaudeMd: boolean;
}

export async function detectVersion(targetDir: string): Promise<DetectionResult> {
  const configPath = join(targetDir, CONFIG_FILE_NAME);
  const hasAgentsDir = await dirExists(join(targetDir, '.claude', 'agents'));
  const hasClaudeMd = await fileExists(join(targetDir, 'CLAUDE.md'));

  if (await fileExists(configPath)) {
    const content = await readFile(configPath, 'utf-8');
    const raw = parseYaml(content) as Record<string, unknown>;
    const version = raw?.version as string | undefined;

    if (version === '1.0') {
      return { version: '1.0', configPath, hasAgentsDir, hasClaudeMd };
    }
    return { version: '0.2', configPath, hasAgentsDir, hasClaudeMd };
  }

  if (hasAgentsDir) {
    return { version: '0.1', hasAgentsDir, hasClaudeMd };
  }

  throw new Error(t('migrate.error_no_project'));
}
