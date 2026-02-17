import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detectPackageManager,
  detectTechStack,
  isExistingProject,
} from '../../src/utils/detect.js';

describe('Detection Utilities (TICKET-003)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cas-detect-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('detectPackageManager', () => {
    it('should detect pnpm from pnpm-lock.yaml', async () => {
      await writeFile(join(tempDir, 'pnpm-lock.yaml'), '');
      expect(await detectPackageManager(tempDir)).toBe('pnpm');
    });

    it('should detect yarn from yarn.lock', async () => {
      await writeFile(join(tempDir, 'yarn.lock'), '');
      expect(await detectPackageManager(tempDir)).toBe('yarn');
    });

    it('should detect bun from bun.lockb', async () => {
      await writeFile(join(tempDir, 'bun.lockb'), '');
      expect(await detectPackageManager(tempDir)).toBe('bun');
    });

    it('should default to npm when no lock file exists', async () => {
      expect(await detectPackageManager(tempDir)).toBe('npm');
    });

    it('should prioritize pnpm over yarn and bun', async () => {
      await writeFile(join(tempDir, 'pnpm-lock.yaml'), '');
      await writeFile(join(tempDir, 'yarn.lock'), '');
      await writeFile(join(tempDir, 'bun.lockb'), '');
      expect(await detectPackageManager(tempDir)).toBe('pnpm');
    });
  });

  describe('detectTechStack', () => {
    it('should detect framework from package.json dependencies', async () => {
      const pkg = {
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
          tailwindcss: '^4.0.0',
        },
      };
      await writeFile(join(tempDir, 'package.json'), JSON.stringify(pkg));
      await writeFile(join(tempDir, 'pnpm-lock.yaml'), '');

      const result = await detectTechStack(tempDir);
      expect(result.framework).toBe('next');
      expect(result.packageManager).toBe('pnpm');
    });

    it('should detect typescript when tsconfig.json exists', async () => {
      const pkg = { dependencies: { react: '^19.0.0' } };
      await writeFile(join(tempDir, 'package.json'), JSON.stringify(pkg));
      await writeFile(join(tempDir, 'tsconfig.json'), '{}');

      const result = await detectTechStack(tempDir);
      expect(result.language).toBe('typescript');
    });

    it('should detect tailwindcss', async () => {
      const pkg = {
        devDependencies: { tailwindcss: '^4.0.0' },
      };
      await writeFile(join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await detectTechStack(tempDir);
      expect(result.cssFramework).toBe('tailwindcss');
    });

    it('should return default TechStackInfo if no package.json exists', async () => {
      const result = await detectTechStack(tempDir);
      expect(result).toBeDefined();
      expect(result.framework).toBeUndefined();
      expect(result.language).toBeUndefined();
      expect(result.packageManager).toBeUndefined();
      expect(result.cssFramework).toBeUndefined();
    });
  });

  describe('isExistingProject', () => {
    it('should return true if package.json exists', async () => {
      await writeFile(join(tempDir, 'package.json'), '{}');
      expect(await isExistingProject(tempDir)).toBe(true);
    });

    it('should return true if .git directory exists', async () => {
      await mkdir(join(tempDir, '.git'));
      expect(await isExistingProject(tempDir)).toBe(true);
    });

    it('should return false if neither package.json nor .git exists', async () => {
      expect(await isExistingProject(tempDir)).toBe(false);
    });
  });
});
