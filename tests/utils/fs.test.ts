import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dirExists, ensureDir, fileExists, writeFileSafe } from '../../src/utils/fs.js';

describe('File System Utilities (TICKET-003)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cas-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('fileExists', () => {
    it('should return true for an existing file', async () => {
      const filePath = join(tempDir, 'existing.txt');
      await writeFile(filePath, 'hello');
      expect(await fileExists(filePath)).toBe(true);
    });

    it('should return false for a non-existing file', async () => {
      const filePath = join(tempDir, 'nonexistent.txt');
      expect(await fileExists(filePath)).toBe(false);
    });
  });

  describe('dirExists', () => {
    it('should return true for an existing directory', async () => {
      const dirPath = join(tempDir, 'existing-dir');
      await mkdir(dirPath);
      expect(await dirExists(dirPath)).toBe(true);
    });

    it('should return false for a non-existing directory', async () => {
      const dirPath = join(tempDir, 'nonexistent-dir');
      expect(await dirExists(dirPath)).toBe(false);
    });
  });

  describe('ensureDir', () => {
    it('should create a directory recursively', async () => {
      const dirPath = join(tempDir, 'a', 'b', 'c');
      await ensureDir(dirPath);
      expect(await dirExists(dirPath)).toBe(true);
    });

    it('should be idempotent (no error on existing directory)', async () => {
      const dirPath = join(tempDir, 'idempotent-dir');
      await mkdir(dirPath);
      await expect(ensureDir(dirPath)).resolves.toBeUndefined();
    });
  });

  describe('writeFileSafe', () => {
    it('should write a file and return { written: true, skipped: false }', async () => {
      const filePath = join(tempDir, 'new-file.txt');
      const result = await writeFileSafe(filePath, 'content');
      expect(result).toEqual({ written: true, skipped: false, existed: false });

      const { readFile } = await import('node:fs/promises');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('content');
    });

    it('should skip if file exists and overwrite is false', async () => {
      const filePath = join(tempDir, 'existing-file.txt');
      await writeFile(filePath, 'original');
      const result = await writeFileSafe(filePath, 'new content', false);
      expect(result).toEqual({ written: false, skipped: true, existed: true });

      const { readFile } = await import('node:fs/promises');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('original');
    });

    it('should overwrite if overwrite is true', async () => {
      const filePath = join(tempDir, 'overwrite-file.txt');
      await writeFile(filePath, 'original');
      const result = await writeFileSafe(filePath, 'overwritten', true);
      expect(result).toEqual({ written: true, skipped: false, existed: true });

      const { readFile } = await import('node:fs/promises');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('overwritten');
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = join(tempDir, 'nested', 'dir', 'file.txt');
      const result = await writeFileSafe(filePath, 'nested content');
      expect(result).toEqual({ written: true, skipped: false, existed: false });

      const { readFile } = await import('node:fs/promises');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('nested content');
    });

    it('should return existed: false for new files', async () => {
      const filePath = join(tempDir, 'brand-new.txt');
      const result = await writeFileSafe(filePath, 'content');
      expect(result.existed).toBe(false);
    });

    it('should return existed: true when file exists and overwritten', async () => {
      const filePath = join(tempDir, 'existing-for-existed.txt');
      await writeFile(filePath, 'original');
      const result = await writeFileSafe(filePath, 'new', true);
      expect(result.existed).toBe(true);
    });

    it('should return existed: true when file exists and skipped', async () => {
      const filePath = join(tempDir, 'existing-for-skip.txt');
      await writeFile(filePath, 'original');
      const result = await writeFileSafe(filePath, 'new', false);
      expect(result.existed).toBe(true);
    });
  });
});
