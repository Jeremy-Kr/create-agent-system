import { describe, expect, it } from 'vitest';
import { parseArgs } from '../../src/cli/args.js';

describe('CLI Args (TICKET-014)', () => {
  describe('default command', () => {
    it('should default to scaffold command with no args', () => {
      const result = parseArgs([]);
      expect(result.command).toBe('scaffold');
    });

    it('should have undefined optional fields when no args given', () => {
      const result = parseArgs([]);
      expect(result.preset).toBeUndefined();
      expect(result.projectName).toBeUndefined();
      expect(result.dryRun).toBeFalsy();
      expect(result.yes).toBeFalsy();
    });
  });

  describe('scaffold options', () => {
    it('should parse --preset', () => {
      const result = parseArgs(['--preset', 'solo-dev']);
      expect(result.preset).toBe('solo-dev');
    });

    it('should parse -p shorthand', () => {
      const result = parseArgs(['-p', 'full-team']);
      expect(result.preset).toBe('full-team');
    });

    it('should parse --project-name', () => {
      const result = parseArgs(['--project-name', 'my-app']);
      expect(result.projectName).toBe('my-app');
    });

    it('should parse -n shorthand', () => {
      const result = parseArgs(['-n', 'test-project']);
      expect(result.projectName).toBe('test-project');
    });

    it('should parse --dry-run', () => {
      const result = parseArgs(['--dry-run']);
      expect(result.dryRun).toBe(true);
    });

    it('should parse --yes', () => {
      const result = parseArgs(['--yes', '--preset', 'solo-dev']);
      expect(result.yes).toBe(true);
    });

    it('should parse -y shorthand', () => {
      const result = parseArgs(['-y', '-p', 'solo-dev']);
      expect(result.yes).toBe(true);
    });

    it('should parse --no-run', () => {
      const result = parseArgs(['--no-run']);
      expect(result.noRun).toBe(true);
    });

    it('should parse --target with absolute path', () => {
      const result = parseArgs(['--target', '/tmp/test-project']);
      expect(result.target).toBe('/tmp/test-project');
    });

    it('should resolve --target relative path to absolute', () => {
      const result = parseArgs(['--target', './some-dir']);
      expect(result.target).toMatch(/^\//); // absolute path
    });

    it('should parse combined options', () => {
      const result = parseArgs([
        '--preset',
        'solo-dev',
        '--project-name',
        'my-app',
        '--yes',
        '--no-run',
      ]);
      expect(result.preset).toBe('solo-dev');
      expect(result.projectName).toBe('my-app');
      expect(result.yes).toBe(true);
      expect(result.noRun).toBe(true);
    });
  });

  describe('validate subcommand', () => {
    it('should parse validate command', () => {
      const result = parseArgs(['validate']);
      expect(result.command).toBe('validate');
    });

    it('should parse validate with target', () => {
      const result = parseArgs(['validate', '/tmp/project']);
      expect(result.command).toBe('validate');
      expect(result.target).toBe('/tmp/project');
    });
  });

  describe('validation', () => {
    it('should throw when --yes is used without --preset', () => {
      expect(() => parseArgs(['--yes'])).toThrow(/--yes requires --preset/);
    });

    it('should NOT throw when --yes is used with --preset', () => {
      expect(() => parseArgs(['--yes', '--preset', 'solo-dev'])).not.toThrow();
    });
  });
});
