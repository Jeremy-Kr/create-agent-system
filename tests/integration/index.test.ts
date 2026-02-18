import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadPreset } from '../../src/core/preset-loader.js';
import { scaffold } from '../../src/core/scaffolder.js';
import { initI18n } from '../../src/i18n/index.js';
import { detectTechStack } from '../../src/utils/detect.js';
import { fileExists } from '../../src/utils/fs.js';

describe('Index integration (non-interactive scaffold)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cas-index-'));
    initI18n('en');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should scaffold with solo-dev preset', async () => {
    const preset = await loadPreset('solo-dev');
    const techStack = await detectTechStack(tempDir);
    const result = await scaffold({
      preset,
      projectName: 'test-project',
      targetDir: tempDir,
      techStack,
      dryRun: false,
      overwrite: false,
    });
    expect(result.files.length).toBeGreaterThan(0);
    expect(await fileExists(join(tempDir, 'CLAUDE.md'))).toBe(true);
  });

  it('should create agent files based on preset', async () => {
    const preset = await loadPreset('full-team');
    const techStack = await detectTechStack(tempDir);
    await scaffold({
      preset,
      projectName: 'full-project',
      targetDir: tempDir,
      techStack,
      dryRun: false,
      overwrite: false,
    });
    expect(await fileExists(join(tempDir, '.claude', 'agents', 'po-pm.md'))).toBe(true);
    expect(await fileExists(join(tempDir, '.claude', 'agents', 'architect.md'))).toBe(true);
    expect(await fileExists(join(tempDir, '.claude', 'agents', 'qa-reviewer.md'))).toBe(true);
  });

  it('should work in dry-run mode without creating files', async () => {
    const preset = await loadPreset('solo-dev');
    const techStack = await detectTechStack(tempDir);
    const result = await scaffold({
      preset,
      projectName: 'dry-project',
      targetDir: tempDir,
      techStack,
      dryRun: true,
      overwrite: false,
    });
    expect(result.files.length).toBeGreaterThan(0);
    expect(await fileExists(join(tempDir, 'CLAUDE.md'))).toBe(false);
  });
});
