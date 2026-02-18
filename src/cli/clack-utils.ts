import * as clack from '@clack/prompts';
import { t } from '../i18n/index.js';

export function cancelGuard<T>(value: T | symbol): T {
  if (clack.isCancel(value)) {
    clack.cancel(t('prompt.cancel'));
    process.exit(0);
  }
  return value as T;
}
