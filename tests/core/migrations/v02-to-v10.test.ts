import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { v02ToV10 } from '../../../src/core/migrations/v02-to-v10.js';
import { CONFIG_FILE_NAME } from '../../../src/utils/constants.js';

describe('Migration v0.2 → v1.0 (EPIC-20)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `cas-test-m02-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const baseConfig = `version: "0.2"
project_name: test-app
base_preset: solo-dev
agents:
  po-pm: { enabled: true, model: opus }
workflow:
  review_max_rounds: 0
  qa_mode: lite
  visual_qa_level: 1
  epic_based: false
skills:
  - scoring
`;

  it('should update version from 0.2 to 1.0', async () => {
    await writeFile(join(tempDir, CONFIG_FILE_NAME), baseConfig, 'utf-8');
    await v02ToV10.migrate({ targetDir: tempDir, dryRun: false });

    const content = await readFile(join(tempDir, CONFIG_FILE_NAME), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.version).toBe('1.0');
  });

  it('should add language field', async () => {
    await writeFile(join(tempDir, CONFIG_FILE_NAME), baseConfig, 'utf-8');
    await v02ToV10.migrate({ targetDir: tempDir, dryRun: false });

    const content = await readFile(join(tempDir, CONFIG_FILE_NAME), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.language).toBe('en');
  });

  it('should preserve existing config data', async () => {
    await writeFile(join(tempDir, CONFIG_FILE_NAME), baseConfig, 'utf-8');
    await v02ToV10.migrate({ targetDir: tempDir, dryRun: false });

    const content = await readFile(join(tempDir, CONFIG_FILE_NAME), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.project_name).toBe('test-app');
    expect(parsed.base_preset).toBe('solo-dev');
    expect(parsed.skills).toContain('scoring');
  });

  it('should not overwrite existing language field', async () => {
    const configWithLang = baseConfig + 'language: ko\n';
    await writeFile(join(tempDir, CONFIG_FILE_NAME), configWithLang, 'utf-8');
    await v02ToV10.migrate({ targetDir: tempDir, dryRun: false });

    const content = await readFile(join(tempDir, CONFIG_FILE_NAME), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.language).toBe('ko');
  });

  it('should not modify files in dry run', async () => {
    await writeFile(join(tempDir, CONFIG_FILE_NAME), baseConfig, 'utf-8');
    const result = await v02ToV10.migrate({ targetDir: tempDir, dryRun: true });

    expect(result.changes).toHaveLength(1);

    const content = await readFile(join(tempDir, CONFIG_FILE_NAME), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.version).toBe('0.2');
  });

  it('should return descriptive changes', async () => {
    await writeFile(join(tempDir, CONFIG_FILE_NAME), baseConfig, 'utf-8');
    const result = await v02ToV10.migrate({ targetDir: tempDir, dryRun: false });

    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].action).toBe('modified');
    expect(result.changes[0].file).toBe(CONFIG_FILE_NAME);
  });
});
