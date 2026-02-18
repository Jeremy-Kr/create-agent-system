import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { getMigrationPath, runMigration } from '../../src/core/migrator.js';
import { detectVersion } from '../../src/core/version-detector.js';
import { CONFIG_FILE_NAME } from '../../src/utils/constants.js';

describe('Migration Integration (EPIC-20)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `cas-test-mint-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should migrate full chain v0.1 → v1.0', async () => {
    // Set up v0.1 project
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await mkdir(join(tempDir, '.claude', 'skills', 'scoring'), { recursive: true });
    await writeFile(
      join(tempDir, '.claude', 'agents', 'po-pm.md'),
      '---\nname: po-pm\n---',
      'utf-8',
    );
    await writeFile(
      join(tempDir, '.claude', 'agents', 'backend-dev.md'),
      '---\nname: backend-dev\n---',
      'utf-8',
    );
    await writeFile(
      join(tempDir, '.claude', 'skills', 'scoring', 'SKILL.md'),
      '# Scoring',
      'utf-8',
    );
    await writeFile(join(tempDir, 'CLAUDE.md'), '# Project', 'utf-8');

    // Detect initial version
    const detection = await detectVersion(tempDir);
    expect(detection.version).toBe('0.1');

    // Run migration
    const steps = getMigrationPath('0.1', '1.0');
    expect(steps).toHaveLength(2);

    const result = await runMigration(steps, { targetDir: tempDir, dryRun: false });
    expect(result.changes).toHaveLength(2);

    // Verify final state
    const content = await readFile(join(tempDir, CONFIG_FILE_NAME), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.version).toBe('1.0');
    expect(parsed.language).toBe('en');
    expect(parsed.skills).toContain('scoring');
  });

  it('should produce no file changes in dry run (single step)', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await writeFile(
      join(tempDir, '.claude', 'agents', 'po-pm.md'),
      '---\nname: po-pm\n---',
      'utf-8',
    );

    const steps = getMigrationPath('0.1', '0.2');
    const result = await runMigration(steps, { targetDir: tempDir, dryRun: true });

    expect(result.changes.length).toBeGreaterThan(0);

    const { fileExists } = await import('../../src/utils/fs.js');
    expect(await fileExists(join(tempDir, CONFIG_FILE_NAME))).toBe(false);
  });

  it('should detect version after migration', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await writeFile(
      join(tempDir, '.claude', 'agents', 'po-pm.md'),
      '---\nname: po-pm\n---',
      'utf-8',
    );

    const steps = getMigrationPath('0.1', '1.0');
    await runMigration(steps, { targetDir: tempDir, dryRun: false });

    const detection = await detectVersion(tempDir);
    expect(detection.version).toBe('1.0');
  });

  it('should handle already-current version gracefully', async () => {
    await writeFile(
      join(tempDir, CONFIG_FILE_NAME),
      'version: "1.0"\nlanguage: en\nagents: {}\nworkflow: {}\nskills: []',
      'utf-8',
    );

    const detection = await detectVersion(tempDir);
    expect(detection.version).toBe('1.0');

    const steps = getMigrationPath('1.0', '1.0');
    expect(steps).toHaveLength(0);
  });

  it('should preserve agent data through full migration', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    for (const agent of [
      'po-pm',
      'architect',
      'cto',
      'designer',
      'test-writer',
      'frontend-dev',
      'backend-dev',
      'qa-reviewer',
    ]) {
      await writeFile(
        join(tempDir, '.claude', 'agents', `${agent}.md`),
        `---\nname: ${agent}\n---`,
        'utf-8',
      );
    }

    const steps = getMigrationPath('0.1', '1.0');
    await runMigration(steps, { targetDir: tempDir, dryRun: false });

    const content = await readFile(join(tempDir, CONFIG_FILE_NAME), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    const agents = parsed.agents as Record<string, { enabled: boolean }>;

    expect(agents['po-pm'].enabled).toBe(true);
    expect(agents['qa-reviewer'].enabled).toBe(true);
    expect(parsed.version).toBe('1.0');
  });
});
