import { execFile, spawn } from 'node:child_process';

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
    console.log(
      'Claude Code CLI not found. Install it from https://docs.anthropic.com/en/docs/claude-code and try again.',
    );
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
        console.log(`Claude Code exited with code ${code}`);
      }
      resolve();
    });

    child.on('error', () => {
      resolve();
    });
  });
}
