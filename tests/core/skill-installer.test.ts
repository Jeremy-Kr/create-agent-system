import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SkillName } from '../../src/types/config.js';

// Mock child_process before importing skill-installer.
// NOTE: The implementation uses execFile (NOT exec) to prevent shell injection,
// which is the secure approach per TICKET-009.
vi.mock('node:child_process', () => {
  const fn = vi.fn();
  return { execFile: fn };
});

import * as cp from 'node:child_process';
import { installFindSkills, installSkill, installSkills } from '../../src/core/skill-installer.js';

const mockedExecFile = vi.mocked(cp.execFile);

describe('Skill Installer (TICKET-009)', () => {
  let targetDir: string;

  beforeEach(async () => {
    targetDir = await mkdtemp(join(tmpdir(), 'skill-installer-test-'));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(targetDir, { recursive: true, force: true });
  });

  describe('installSkill', () => {
    it('should call execFile with correct arguments', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      const result = await installSkill('scoring', targetDir);
      expect(result.success).toBe(true);
      expect(result.skillName).toBe('scoring');
      expect(mockedExecFile).toHaveBeenCalledWith(
        'npx',
        ['@anthropic/skills', 'add', 'scoring'],
        expect.objectContaining({ cwd: targetDir }),
        expect.any(Function),
      );
    });

    it('should reject invalid skill names', async () => {
      const result = await installSkill('invalid-skill' as SkillName, targetDir);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid/i);
      expect(mockedExecFile).not.toHaveBeenCalled();
    });

    it('should return failure on network error without throwing', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Network timeout'), '', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      const result = await installSkill('scoring', targetDir);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should set timeout of 30s per skill', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, opts, callback) => {
        expect(opts).toHaveProperty('timeout');
        expect((opts as { timeout: number }).timeout).toBeLessThanOrEqual(30_000);
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      await installSkill('scoring', targetDir);
      expect(mockedExecFile).toHaveBeenCalled();
    });
  });

  describe('installSkills', () => {
    it('should install find-skills first before other skills', async () => {
      const callOrder: string[] = [];

      mockedExecFile.mockImplementation((_cmd, args, _opts, callback) => {
        const skillArg = (args as string[])[2];
        callOrder.push(skillArg);
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      await installSkills(['scoring', 'tdd-workflow'], targetDir);

      expect(callOrder[0]).toBe('find-skills');
      expect(callOrder).toContain('scoring');
      expect(callOrder).toContain('tdd-workflow');
    });

    it('should process all skills even if some fail', async () => {
      mockedExecFile.mockImplementation((_cmd, args, _opts, callback) => {
        const skillArg = (args as string[])[2];
        if (typeof callback === 'function') {
          if (skillArg === 'scoring') {
            callback(new Error('Failed to install'), '', '');
          } else {
            callback(null, '', '');
          }
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      const results = await installSkills(['scoring', 'tdd-workflow'], targetDir);

      expect(results.length).toBeGreaterThanOrEqual(2);

      const scoringResult = results.find((r) => r.skillName === 'scoring');
      expect(scoringResult?.success).toBe(false);

      const tddResult = results.find((r) => r.skillName === 'tdd-workflow');
      expect(tddResult?.success).toBe(true);
    });

    it('should return results for all requested skills', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      const skills: SkillName[] = ['scoring', 'tdd-workflow', 'cr-process'];
      const results = await installSkills(skills, targetDir);

      for (const skill of skills) {
        const result = results.find((r) => r.skillName === skill);
        expect(result).toBeDefined();
        expect(result?.success).toBe(true);
      }
    });
  });

  describe('installFindSkills', () => {
    it('should install find-skills meta-skill', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      const result = await installFindSkills(targetDir);
      expect(result.success).toBe(true);
      expect(result.skillName).toBe('find-skills');
      expect(mockedExecFile).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining(['find-skills']),
        expect.objectContaining({ cwd: targetDir }),
        expect.any(Function),
      );
    });
  });

  describe('targetDir validation', () => {
    it('should throw when targetDir does not exist', async () => {
      await expect(installSkill('scoring', '/nonexistent/dir/path')).rejects.toThrow(/not exist/i);
    });

    it('should throw from installFindSkills when targetDir does not exist', async () => {
      await expect(installFindSkills('/nonexistent/dir/path')).rejects.toThrow(/not exist/i);
    });
  });

  describe('fallback to bundled templates', () => {
    it('should fall back to bundled templates when npx fails', async () => {
      mockedExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('npx not available'), '', '');
        }
        return {} as ReturnType<typeof cp.execFile>;
      });

      const result = await installSkill('scoring', targetDir);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('skillName', 'scoring');
    });
  });
});
