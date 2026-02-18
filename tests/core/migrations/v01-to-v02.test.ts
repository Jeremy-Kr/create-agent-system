import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { v01ToV02 } from '../../../src/core/migrations/v01-to-v02.js';

describe('Migration v0.1 → v0.2 (EPIC-20)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `cas-test-m01-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should create config from existing agents', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
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
      join(tempDir, '.claude', 'agents', 'test-writer.md'),
      '---\nname: test-writer\n---',
      'utf-8',
    );

    const result = await v01ToV02.migrate({ targetDir: tempDir, dryRun: false });

    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].action).toBe('created');
    expect(result.changes[0].file).toBe('agent-system.config.yaml');

    const content = await readFile(join(tempDir, 'agent-system.config.yaml'), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.version).toBe('0.2');
  });

  it('should detect agents correctly in config', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
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

    await v01ToV02.migrate({ targetDir: tempDir, dryRun: false });

    const content = await readFile(join(tempDir, 'agent-system.config.yaml'), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    const agents = parsed.agents as Record<string, { enabled: boolean }>;
    expect(agents['po-pm'].enabled).toBe(true);
    expect(agents['backend-dev'].enabled).toBe(true);
    expect(agents.architect.enabled).toBe(false);
  });

  it('should handle minimal agent setup', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await writeFile(
      join(tempDir, '.claude', 'agents', 'po-pm.md'),
      '---\nname: po-pm\n---',
      'utf-8',
    );

    const result = await v01ToV02.migrate({ targetDir: tempDir, dryRun: false });
    expect(result.changes).toHaveLength(1);

    const content = await readFile(join(tempDir, 'agent-system.config.yaml'), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.base_preset).toBe('solo-dev');
  });

  it('should detect skills', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await mkdir(join(tempDir, '.claude', 'skills', 'scoring'), { recursive: true });
    await writeFile(
      join(tempDir, '.claude', 'skills', 'scoring', 'SKILL.md'),
      '# Scoring',
      'utf-8',
    );
    await writeFile(
      join(tempDir, '.claude', 'agents', 'po-pm.md'),
      '---\nname: po-pm\n---',
      'utf-8',
    );

    await v01ToV02.migrate({ targetDir: tempDir, dryRun: false });

    const content = await readFile(join(tempDir, 'agent-system.config.yaml'), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    expect(parsed.skills).toContain('scoring');
  });

  it('should not write files in dry run mode', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await writeFile(
      join(tempDir, '.claude', 'agents', 'po-pm.md'),
      '---\nname: po-pm\n---',
      'utf-8',
    );

    const result = await v01ToV02.migrate({ targetDir: tempDir, dryRun: true });
    expect(result.changes).toHaveLength(1);

    const { fileExists } = await import('../../../src/utils/fs.js');
    expect(await fileExists(join(tempDir, 'agent-system.config.yaml'))).toBe(false);
  });

  it('should ignore non-agent .md files', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await writeFile(
      join(tempDir, '.claude', 'agents', 'random-file.md'),
      '# not an agent',
      'utf-8',
    );
    await writeFile(
      join(tempDir, '.claude', 'agents', 'po-pm.md'),
      '---\nname: po-pm\n---',
      'utf-8',
    );

    await v01ToV02.migrate({ targetDir: tempDir, dryRun: false });

    const content = await readFile(join(tempDir, 'agent-system.config.yaml'), 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown>;
    const agents = parsed.agents as Record<string, { enabled: boolean }>;
    expect(agents['po-pm'].enabled).toBe(true);
    // random-file should not be in agents (not a known agent name)
    expect(agents['random-file']).toBeUndefined();
  });
});
