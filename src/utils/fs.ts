import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const s = await stat(dirPath);
    return s.isDirectory();
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function writeFileSafe(
  filePath: string,
  content: string,
  overwrite?: boolean,
): Promise<{ written: boolean; skipped: boolean; existed: boolean }> {
  const existed = await fileExists(filePath);
  if (existed && !overwrite) {
    return { written: false, skipped: true, existed };
  }
  await ensureDir(dirname(filePath));
  await writeFile(filePath, content, 'utf-8');
  return { written: true, skipped: false, existed };
}
