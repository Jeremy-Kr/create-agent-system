import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectVersion } from '../../src/core/version-detector.js';
import { CONFIG_FILE_NAME } from '../../src/utils/constants.js';

describe('Version Detector (EPIC-20)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(
      tmpdir(),
      `cas-test-vdetect-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should detect v0.1 when agents dir exists but no config', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    const result = await detectVersion(tempDir);
    expect(result.version).toBe('0.1');
    expect(result.hasAgentsDir).toBe(true);
    expect(result.configPath).toBeUndefined();
  });

  it('should detect v0.2 when config has version 0.2', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await writeFile(
      join(tempDir, CONFIG_FILE_NAME),
      'version: "0.2"\nagents: {}\nworkflow: {}\nskills: []',
      'utf-8',
    );
    const result = await detectVersion(tempDir);
    expect(result.version).toBe('0.2');
    expect(result.configPath).toBe(join(tempDir, CONFIG_FILE_NAME));
  });

  it('should detect v1.0 when config has version 1.0', async () => {
    await writeFile(
      join(tempDir, CONFIG_FILE_NAME),
      'version: "1.0"\nlanguage: en\nagents: {}\nworkflow: {}\nskills: []',
      'utf-8',
    );
    const result = await detectVersion(tempDir);
    expect(result.version).toBe('1.0');
    expect(result.configPath).toBe(join(tempDir, CONFIG_FILE_NAME));
  });

  it('should default to v0.2 when config exists but has no version field', async () => {
    await writeFile(
      join(tempDir, CONFIG_FILE_NAME),
      'agents: {}\nworkflow: {}\nskills: []',
      'utf-8',
    );
    const result = await detectVersion(tempDir);
    expect(result.version).toBe('0.2');
  });

  it('should throw when no project found', async () => {
    await expect(detectVersion(tempDir)).rejects.toThrow();
  });

  it('should report hasClaudeMd correctly', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await writeFile(join(tempDir, 'CLAUDE.md'), '# Project', 'utf-8');
    const result = await detectVersion(tempDir);
    expect(result.hasClaudeMd).toBe(true);
  });

  it('should report hasClaudeMd as false when missing', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    const result = await detectVersion(tempDir);
    expect(result.hasClaudeMd).toBe(false);
  });

  it('should report hasAgentsDir correctly with config', async () => {
    await mkdir(join(tempDir, '.claude', 'agents'), { recursive: true });
    await writeFile(join(tempDir, CONFIG_FILE_NAME), 'version: "0.2"', 'utf-8');
    const result = await detectVersion(tempDir);
    expect(result.hasAgentsDir).toBe(true);
  });

  it('should report hasAgentsDir as false when missing', async () => {
    await writeFile(join(tempDir, CONFIG_FILE_NAME), 'version: "0.2"', 'utf-8');
    const result = await detectVersion(tempDir);
    expect(result.hasAgentsDir).toBe(false);
  });

  it('should detect v0.2 even without agents dir when config exists', async () => {
    await writeFile(join(tempDir, CONFIG_FILE_NAME), 'version: "0.2"', 'utf-8');
    const result = await detectVersion(tempDir);
    expect(result.version).toBe('0.2');
  });
});
