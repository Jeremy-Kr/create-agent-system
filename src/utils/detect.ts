import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TechStackInfo } from '../types/config.js';
import { dirExists, fileExists } from './fs.js';

export async function detectPackageManager(
  targetDir: string,
): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
  if (await fileExists(join(targetDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await fileExists(join(targetDir, 'yarn.lock'))) return 'yarn';
  if (await fileExists(join(targetDir, 'bun.lockb'))) return 'bun';
  return 'npm';
}

export async function detectTechStack(targetDir: string): Promise<TechStackInfo> {
  const pkgPath = join(targetDir, 'package.json');
  if (!(await fileExists(pkgPath))) {
    return {};
  }

  const raw = await readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(raw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const result: TechStackInfo = {};

  // Framework detection (priority order)
  if (allDeps.next) result.framework = 'next';
  else if (allDeps.nuxt) result.framework = 'nuxt';
  else if (allDeps.vue) result.framework = 'vue';
  else if (allDeps.react) result.framework = 'react';

  // Language detection
  if (allDeps.typescript || (await fileExists(join(targetDir, 'tsconfig.json')))) {
    result.language = 'typescript';
  }

  // CSS framework detection
  if (allDeps.tailwindcss) result.cssFramework = 'tailwindcss';

  // Package manager detection
  const pm = await detectPackageManager(targetDir);
  if (pm !== 'npm') result.packageManager = pm;

  return result;
}

export async function isExistingProject(targetDir: string): Promise<boolean> {
  return (
    (await fileExists(join(targetDir, 'package.json'))) ||
    (await dirExists(join(targetDir, '.git')))
  );
}
