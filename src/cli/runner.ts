import { execFile, spawn } from 'node:child_process';
import * as clack from '@clack/prompts';
import { t } from '../i18n/index.js';

export async function isClaudeCodeInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('claude', ['--version'], (error) => {
      resolve(!error);
    });
  });
}

export async function runClaudeCode(targetDir: string): Promise<void> {
  const installed = await isClaudeCodeInstalled();
  if (!installed) {
    clack.log.warn(t('runner.claude_not_found'));
    return;
  }

  return new Promise((resolve) => {
    const child = spawn('claude', ['--permission-mode', 'plan'], {
      cwd: targetDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
      },
    });

    child.on('close', (code) => {
      if (code && code !== 0) {
        clack.log.warn(t('runner.claude_exit_code', { code: String(code) }));
      }
      resolve();
    });

    child.on('error', (err) => {
      clack.log.warn(err.message);
      resolve();
    });
  });
}
