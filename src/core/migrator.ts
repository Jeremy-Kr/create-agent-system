export interface MigrationStep {
  from: string;
  to: string;
  description: string;
  migrate: (ctx: MigrationContext) => Promise<MigrationResult>;
}

export interface MigrationContext {
  targetDir: string;
  dryRun: boolean;
}

export interface MigrationChange {
  file: string;
  action: 'created' | 'modified';
  description: string;
}

export interface MigrationResult {
  changes: MigrationChange[];
  warnings: string[];
}

import { v01ToV02 } from './migrations/v01-to-v02.js';
import { v02ToV10 } from './migrations/v02-to-v10.js';

const migrations: MigrationStep[] = [v01ToV02, v02ToV10];

export function getMigrationPath(from: string, to: string): MigrationStep[] {
  const fromIdx = migrations.findIndex((m) => m.from === from);
  const toIdx = migrations.findIndex((m) => m.to === to);

  if (fromIdx === -1 || toIdx === -1 || fromIdx > toIdx) {
    return [];
  }

  return migrations.slice(fromIdx, toIdx + 1);
}

export async function runMigration(
  steps: MigrationStep[],
  ctx: MigrationContext,
): Promise<MigrationResult> {
  const allChanges: MigrationChange[] = [];
  const allWarnings: string[] = [];

  for (const step of steps) {
    const result = await step.migrate(ctx);
    allChanges.push(...result.changes);
    allWarnings.push(...result.warnings);
  }

  return { changes: allChanges, warnings: allWarnings };
}
