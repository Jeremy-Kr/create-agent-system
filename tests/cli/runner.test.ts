import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/i18n/index.js';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  log: {
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock child_process before importing runner
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

import * as cp from 'node:child_process';
import * as clack from '@clack/prompts';
import { isClaudeCodeInstalled, runClaudeCode } from '../../src/cli/runner.js';

const mockedExecFile = vi.mocked(cp.execFile);
const mockedSpawn = vi.mocked(cp.spawn);

function mockClaudeInstalled() {
  mockedExecFile.mockImplementation((_cmd, _args, callback) => {
    if (typeof callback === 'function') {
      callback(null, 'claude 1.0.0', '');
    }
    return {} as ReturnType<typeof cp.execFile>;
  });
}

function mockClaudeNotInstalled() {
  mockedExecFile.mockImplementation((_cmd, _args, callback) => {
    if (typeof callback === 'function') {
      callback(new Error('command not found'), '', '');
    }
    return {} as ReturnType<typeof cp.execFile>;
  });
}

describe('CLI Runner (TICKET-016)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initI18n('en');
  });

  describe('isClaudeCodeInstalled', () => {
    it('should return true when claude --version succeeds', async () => {
      mockClaudeInstalled();

      const result = await isClaudeCodeInstalled();
      expect(result).toBe(true);
      expect(mockedExecFile).toHaveBeenCalledWith('claude', ['--version'], expect.any(Function));
    });

    it('should return false when claude is not found', async () => {
      mockClaudeNotInstalled();

      const result = await isClaudeCodeInstalled();
      expect(result).toBe(false);
    });
  });

  describe('runClaudeCode', () => {
    it('should warn when claude is not installed', async () => {
      mockClaudeNotInstalled();

      await runClaudeCode('/tmp/test');

      expect(clack.log.warn).toHaveBeenCalledWith(expect.stringContaining('Claude Code'));
      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it('should spawn claude with correct args and env', async () => {
      mockClaudeInstalled();

      const fakeProcess = new EventEmitter() as ChildProcess;
      mockedSpawn.mockReturnValue(fakeProcess);

      const promise = runClaudeCode('/tmp/test');

      // Wait for async isClaudeCodeInstalled to resolve
      await vi.waitFor(() => expect(mockedSpawn).toHaveBeenCalled());

      expect(mockedSpawn).toHaveBeenCalledWith('claude', ['--permission-mode', 'plan'], {
        cwd: '/tmp/test',
        stdio: 'inherit',
        env: expect.objectContaining({
          CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
        }),
      });

      fakeProcess.emit('close', 0);
      await promise;
    });

    it('should warn on non-zero exit code', async () => {
      mockClaudeInstalled();

      const fakeProcess = new EventEmitter() as ChildProcess;
      mockedSpawn.mockReturnValue(fakeProcess);

      const promise = runClaudeCode('/tmp/test');
      await vi.waitFor(() => expect(mockedSpawn).toHaveBeenCalled());

      fakeProcess.emit('close', 1);
      await promise;

      expect(clack.log.warn).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('should handle spawn error gracefully', async () => {
      mockClaudeInstalled();

      const fakeProcess = new EventEmitter() as ChildProcess;
      mockedSpawn.mockReturnValue(fakeProcess);

      const promise = runClaudeCode('/tmp/test');
      await vi.waitFor(() => expect(mockedSpawn).toHaveBeenCalled());

      fakeProcess.emit('error', new Error('spawn failed'));
      await promise;

      expect(clack.log.warn).toHaveBeenCalledWith('spawn failed');
    });
  });
});
