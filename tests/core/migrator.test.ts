import { describe, expect, it } from 'vitest';
import type { MigrationContext, MigrationStep } from '../../src/core/migrator.js';
import { getMigrationPath, runMigration } from '../../src/core/migrator.js';

describe('Migrator Engine (EPIC-20)', () => {
  describe('getMigrationPath', () => {
    it('should return steps for 0.1 → 0.2', () => {
      const steps = getMigrationPath('0.1', '0.2');
      expect(steps).toHaveLength(1);
      expect(steps[0].from).toBe('0.1');
      expect(steps[0].to).toBe('0.2');
    });

    it('should return steps for 0.2 → 1.0', () => {
      const steps = getMigrationPath('0.2', '1.0');
      expect(steps).toHaveLength(1);
      expect(steps[0].from).toBe('0.2');
      expect(steps[0].to).toBe('1.0');
    });

    it('should return full chain for 0.1 → 1.0', () => {
      const steps = getMigrationPath('0.1', '1.0');
      expect(steps).toHaveLength(2);
      expect(steps[0].from).toBe('0.1');
      expect(steps[1].to).toBe('1.0');
    });

    it('should return empty array when already at target', () => {
      const steps = getMigrationPath('1.0', '1.0');
      expect(steps).toEqual([]);
    });

    it('should return empty array for unknown versions', () => {
      const steps = getMigrationPath('9.9', '10.0');
      expect(steps).toEqual([]);
    });
  });

  describe('runMigration', () => {
    it('should aggregate changes from all steps', async () => {
      const mockSteps: MigrationStep[] = [
        {
          from: '0.1',
          to: '0.2',
          description: 'step 1',
          migrate: async () => ({
            changes: [{ file: 'a.yaml', action: 'created', description: 'created config' }],
            warnings: ['warn1'],
          }),
        },
        {
          from: '0.2',
          to: '1.0',
          description: 'step 2',
          migrate: async () => ({
            changes: [{ file: 'a.yaml', action: 'modified', description: 'updated version' }],
            warnings: [],
          }),
        },
      ];

      const ctx: MigrationContext = { targetDir: '/tmp/test', dryRun: true };
      const result = await runMigration(mockSteps, ctx);

      expect(result.changes).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
    });

    it('should apply steps in order', async () => {
      const order: string[] = [];
      const mockSteps: MigrationStep[] = [
        {
          from: '0.1',
          to: '0.2',
          description: 'first',
          migrate: async () => {
            order.push('first');
            return { changes: [], warnings: [] };
          },
        },
        {
          from: '0.2',
          to: '1.0',
          description: 'second',
          migrate: async () => {
            order.push('second');
            return { changes: [], warnings: [] };
          },
        },
      ];

      await runMigration(mockSteps, { targetDir: '/tmp', dryRun: true });
      expect(order).toEqual(['first', 'second']);
    });

    it('should return empty result for no steps', async () => {
      const result = await runMigration([], { targetDir: '/tmp', dryRun: true });
      expect(result.changes).toEqual([]);
      expect(result.warnings).toEqual([]);
    });
  });
});
