import * as clack from '@clack/prompts';
import { getMigrationPath, runMigration } from '../core/migrator.js';
import { validate } from '../core/validator.js';
import { detectVersion } from '../core/version-detector.js';
import { t } from '../i18n/index.js';
import { displayValidationResults } from './prompts.js';

export async function runMigrationFlow(
  targetDir: string,
  options: {
    dryRun?: boolean;
    targetVersion?: string;
    yes?: boolean;
  },
): Promise<void> {
  const detection = await detectVersion(targetDir);
  const target = options.targetVersion ?? '1.0';

  clack.log.info(t('migrate.detected', { current: detection.version, target }));

  const steps = getMigrationPath(detection.version, target);

  if (steps.length === 0) {
    clack.log.info(t('migrate.no_changes'));
    return;
  }

  if (options.dryRun) {
    clack.log.info(t('migrate.dry_run'));
    const result = await runMigration(steps, { targetDir, dryRun: true });
    for (const change of result.changes) {
      clack.log.info(`  ${change.action}: ${change.file} — ${change.description}`);
    }
    return;
  }

  // Show changes
  clack.log.info(t('migrate.changes'));
  for (const step of steps) {
    clack.log.info(`  ${step.from} → ${step.to}: ${step.description}`);
  }

  // Confirm
  if (!options.yes) {
    const confirmed = await clack.confirm({
      message: t('migrate.apply_confirm'),
      initialValue: true,
    });
    if (clack.isCancel(confirmed) || !confirmed) {
      clack.cancel(t('prompt.cancel'));
      return;
    }
  }

  // Run migration
  const result = await runMigration(steps, { targetDir, dryRun: false });
  for (const change of result.changes) {
    clack.log.info(`  ${change.action}: ${change.file} — ${change.description}`);
  }

  // Validate
  const validationResult = await validate(targetDir);
  displayValidationResults(validationResult);

  clack.log.success(t('migrate.complete'));
}
