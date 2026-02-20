import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Cannot find package root (no package.json found)');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = findPackageRoot(__dirname);

export const PRESETS_DIR = join(PACKAGE_ROOT, 'presets');
export const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');
