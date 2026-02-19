import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/i18n/index.js';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    message: vi.fn(),
  },
  confirm: vi.fn(),
}));

// Mock migrator
vi.mock('../../src/core/migrator.js', () => ({
  getMigrationPath: vi.fn(),
  runMigration: vi.fn(),
}));

// Mock version-detector
vi.mock('../../src/core/version-detector.js', () => ({
  detectVersion: vi.fn(),
}));

// Mock validator
vi.mock('../../src/core/validator.js', () => ({
  validate: vi.fn(),
}));

// Mock prompts (displayValidationResults)
vi.mock('../../src/cli/prompts.js', () => ({
  displayValidationResults: vi.fn(),
}));

import * as clack from '@clack/prompts';
import { runMigrationFlow } from '../../src/cli/migration-prompts.js';
import { getMigrationPath, runMigration } from '../../src/core/migrator.js';
import { validate } from '../../src/core/validator.js';
import { detectVersion } from '../../src/core/version-detector.js';

describe('migration-prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initI18n('en');
  });

  it('should show no changes when migration path is empty', async () => {
    vi.mocked(detectVersion).mockResolvedValue({ version: '1.0', features: [] });
    vi.mocked(getMigrationPath).mockReturnValue([]);

    await runMigrationFlow('/tmp/test', {});

    expect(clack.log.info).toHaveBeenCalledWith(
      expect.stringContaining('No migration changes needed'),
    );
    expect(runMigration).not.toHaveBeenCalled();
  });

  it('should run dry-run without confirmation', async () => {
    vi.mocked(detectVersion).mockResolvedValue({ version: '0.1', features: [] });
    vi.mocked(getMigrationPath).mockReturnValue([
      { from: '0.1', to: '0.2', description: 'Update format', migrate: vi.fn() },
    ]);
    vi.mocked(runMigration).mockResolvedValue({
      changes: [{ action: 'modified', file: 'CLAUDE.md', description: 'Updated' }],
    });

    await runMigrationFlow('/tmp/test', { dryRun: true });

    expect(runMigration).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ dryRun: true }),
    );
    expect(clack.confirm).not.toHaveBeenCalled();
  });

  it('should confirm before applying migration', async () => {
    vi.mocked(detectVersion).mockResolvedValue({ version: '0.1', features: [] });
    vi.mocked(getMigrationPath).mockReturnValue([
      { from: '0.1', to: '0.2', description: 'Update format', migrate: vi.fn() },
    ]);
    vi.mocked(clack.confirm).mockResolvedValueOnce(true);
    vi.mocked(runMigration).mockResolvedValue({
      changes: [{ action: 'modified', file: 'CLAUDE.md', description: 'Updated' }],
    });
    vi.mocked(validate).mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      stats: { agentCount: 1, skillCount: 0, fileCount: 2 },
    });

    await runMigrationFlow('/tmp/test', {});

    expect(clack.confirm).toHaveBeenCalled();
    expect(runMigration).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ dryRun: false }),
    );
    expect(clack.log.success).toHaveBeenCalled();
  });

  it('should cancel when user declines confirmation', async () => {
    vi.mocked(detectVersion).mockResolvedValue({ version: '0.1', features: [] });
    vi.mocked(getMigrationPath).mockReturnValue([
      { from: '0.1', to: '0.2', description: 'Update format', migrate: vi.fn() },
    ]);
    vi.mocked(clack.confirm).mockResolvedValueOnce(false);

    await runMigrationFlow('/tmp/test', {});

    expect(clack.cancel).toHaveBeenCalled();
    expect(runMigration).toHaveBeenCalledTimes(0);
  });

  it('should skip confirmation with --yes flag', async () => {
    vi.mocked(detectVersion).mockResolvedValue({ version: '0.1', features: [] });
    vi.mocked(getMigrationPath).mockReturnValue([
      { from: '0.1', to: '0.2', description: 'Update format', migrate: vi.fn() },
    ]);
    vi.mocked(runMigration).mockResolvedValue({
      changes: [{ action: 'modified', file: 'CLAUDE.md', description: 'Updated' }],
    });
    vi.mocked(validate).mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      stats: { agentCount: 1, skillCount: 0, fileCount: 2 },
    });

    await runMigrationFlow('/tmp/test', { yes: true });

    expect(clack.confirm).not.toHaveBeenCalled();
    expect(runMigration).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ dryRun: false }),
    );
  });
});
