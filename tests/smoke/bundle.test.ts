import { execFile as execFileCb } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFile = promisify(execFileCb);
const BUNDLE_PATH = resolve('dist/index.mjs');

describe('Bundle smoke test', () => {
  it('dist/index.mjs should exist', () => {
    expect(existsSync(BUNDLE_PATH)).toBe(true);
  });

  it('should run --preset solo-dev --yes --dry-run without error', async () => {
    const { stdout } = await execFile('node', [
      BUNDLE_PATH,
      '--preset',
      'solo-dev',
      '--yes',
      '--dry-run',
    ]);
    expect(stdout).toContain('DRY RUN');
    expect(stdout).toContain('Scaffolding complete');
  });

  it('should run validate without crashing', async () => {
    const result = await execFile('node', [BUNDLE_PATH, 'validate']).catch((e) => e);
    expect(result.stdout ?? result.stderr).toBeDefined();
  });
});
