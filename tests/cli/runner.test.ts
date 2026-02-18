import { describe, expect, it, vi } from 'vitest';

// Mock child_process before importing runner
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

import * as cp from 'node:child_process';
import { isClaudeCodeInstalled } from '../../src/cli/runner.js';

const mockedExecFile = vi.mocked(cp.execFile);

describe('CLI Runner (TICKET-016)', () => {
  describe('isClaudeCodeInstalled', () => {
    it('should return true when claude --version succeeds', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, callback) => {
        if (typeof callback === 'function') {
          callback(null, 'claude 1.0.0', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      const result = await isClaudeCodeInstalled();
      expect(result).toBe(true);
      expect(mockedExecFile).toHaveBeenCalledWith('claude', ['--version'], expect.any(Function));
    });

    it('should return false when claude is not found', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('command not found'), '', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      const result = await isClaudeCodeInstalled();
      expect(result).toBe(false);
    });
  });
});
