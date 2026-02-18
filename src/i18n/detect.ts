import type { Locale } from './types.js';

export function detectSystemLocale(): Locale {
  const lang = process.env.LANG || process.env.LC_ALL || '';
  if (lang.startsWith('ko')) return 'ko';
  return 'en';
}
