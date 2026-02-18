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

    it('should parse validate --quiet', () => {
      const result = parseArgs(['validate', '--quiet']);
      expect(result.command).toBe('validate');
      expect(result.quiet).toBe(true);
    });

    it('should parse validate -q shorthand', () => {
      const result = parseArgs(['validate', '-q']);
      expect(result.command).toBe('validate');
      expect(result.quiet).toBe(true);
    });

    it('should parse validate with target and --quiet', () => {
      const result = parseArgs(['validate', '/some/path', '--quiet']);
      expect(result.command).toBe('validate');
      expect(result.quiet).toBe(true);
      expect(result.target).toContain('some/path');
    });

    it('should default quiet to false for validate', () => {
      const result = parseArgs(['validate']);
      expect(result.quiet).toBeFalsy();
    });
  });

  describe('diff subcommand', () => {
    it('should parse diff command with two presets', () => {
      const result = parseArgs(['diff', 'solo-dev', 'full-team']);
      expect(result.command).toBe('diff');
      expect(result.diffArgs).toEqual(['solo-dev', 'full-team']);
    });

    it('should throw when diff has no arguments', () => {
      expect(() => parseArgs(['diff'])).toThrow(/Usage.*diff/);
    });

    it('should throw when diff has only one argument', () => {
      expect(() => parseArgs(['diff', 'solo-dev'])).toThrow(/Usage.*diff/);
    });
  });

  describe('v0.2.0 options', () => {
    it('should parse --save-config', () => {
      const result = parseArgs(['--save-config']);
      expect(result.saveConfig).toBe(true);
    });

    it('should parse --config', () => {
      const result = parseArgs(['--config', '/path/to/config.yaml']);
      expect(result.config).toBe('/path/to/config.yaml');
    });

    it('should parse --ignore-config', () => {
      const result = parseArgs(['--ignore-config']);
      expect(result.ignoreConfig).toBe(true);
    });

    it('should default new flags to false/undefined', () => {
      const result = parseArgs([]);
      expect(result.saveConfig).toBeFalsy();
      expect(result.config).toBeUndefined();
      expect(result.ignoreConfig).toBeFalsy();
    });
  });

  describe('add subcommand (v0.3.0)', () => {
    it('should parse add with single name', () => {
      const result = parseArgs(['add', 'devops-engineer']);
      expect(result.command).toBe('add');
      expect(result.addNames).toEqual(['devops-engineer']);
    });

    it('should parse add with multiple names', () => {
      const result = parseArgs(['add', 'devops-engineer', 'security-reviewer']);
      expect(result.command).toBe('add');
      expect(result.addNames).toEqual(['devops-engineer', 'security-reviewer']);
    });

    it('should parse add with --type', () => {
      const result = parseArgs(['add', 'devops-engineer', '--type', 'agent']);
      expect(result.registryType).toBe('agent');
    });

    it('should parse add with --force', () => {
      const result = parseArgs(['add', 'devops-engineer', '--force']);
      expect(result.force).toBe(true);
    });

    it('should parse add with --yes', () => {
      const result = parseArgs(['add', 'devops-engineer', '--yes']);
      expect(result.yes).toBe(true);
    });

    it('should parse add with -y shorthand', () => {
      const result = parseArgs(['add', 'devops-engineer', '-y']);
      expect(result.yes).toBe(true);
    });

    it('should throw when add has no names', () => {
      expect(() => parseArgs(['add'])).toThrow(/Usage.*add/);
    });

    it('should throw for invalid --type value', () => {
      expect(() => parseArgs(['add', 'foo', '--type', 'invalid'])).toThrow(/Invalid --type/);
    });
  });

  describe('search subcommand (v0.3.0)', () => {
    it('should parse search with query', () => {
      const result = parseArgs(['search', 'devops']);
      expect(result.command).toBe('search');
      expect(result.searchQuery).toBe('devops');
    });

    it('should parse search with --type', () => {
      const result = parseArgs(['search', 'devops', '--type', 'agent']);
      expect(result.registryType).toBe('agent');
    });

    it('should parse search with --tag', () => {
      const result = parseArgs(['search', 'devops', '--tag', 'ci-cd']);
      expect(result.tag).toBe('ci-cd');
    });

    it('should join multi-word search query', () => {
      const result = parseArgs(['search', 'api', 'design']);
      expect(result.searchQuery).toBe('api design');
    });

    it('should throw when search has no query', () => {
      expect(() => parseArgs(['search'])).toThrow(/Usage.*search/);
    });
  });

  describe('list subcommand (v0.3.0)', () => {
    it('should parse list with no options', () => {
      const result = parseArgs(['list']);
      expect(result.command).toBe('list');
    });

    it('should parse list with --type', () => {
      const result = parseArgs(['list', '--type', 'skill']);
      expect(result.registryType).toBe('skill');
    });

    it('should parse list with --installed', () => {
      const result = parseArgs(['list', '--installed']);
      expect(result.installed).toBe(true);
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

  describe('--lang option', () => {
    it('should parse --lang ko', () => {
      const result = parseArgs(['--lang', 'ko']);
      expect(result.lang).toBe('ko');
    });

    it('should parse --lang en', () => {
      const result = parseArgs(['--lang', 'en']);
      expect(result.lang).toBe('en');
    });

    it('should parse -l shorthand', () => {
      const result = parseArgs(['-l', 'ko']);
      expect(result.lang).toBe('ko');
    });

    it('should throw for invalid --lang value', () => {
      expect(() => parseArgs(['--lang', 'fr'])).toThrow(/--lang must be/);
    });
  });

  describe('option combinations', () => {
    it('should parse --dry-run --save-config --no-run together', () => {
      const result = parseArgs(['--dry-run', '--save-config', '--no-run']);
      expect(result.dryRun).toBe(true);
      expect(result.saveConfig).toBe(true);
      expect(result.noRun).toBe(true);
    });

    it('should parse all options combined', () => {
      const result = parseArgs([
        '--preset',
        'solo-dev',
        '--project-name',
        'test',
        '--yes',
        '--no-run',
        '--dry-run',
        '--save-config',
        '--lang',
        'ko',
      ]);
      expect(result.preset).toBe('solo-dev');
      expect(result.projectName).toBe('test');
      expect(result.yes).toBe(true);
      expect(result.noRun).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.saveConfig).toBe(true);
      expect(result.lang).toBe('ko');
    });
  });
});
