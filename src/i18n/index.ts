import { en } from './en.js';
import { ko } from './ko.js';
import type { Locale, Messages } from './types.js';

const messages: Record<Locale, Messages> = { en, ko };
let currentLocale: Locale = 'en';

export function initI18n(locale?: Locale): void {
  currentLocale = locale ?? 'en';
}

export function t(key: keyof Messages, vars?: Record<string, string | number>): string {
  let msg = messages[currentLocale][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return msg;
}

export function getLocale(): Locale {
  return currentLocale;
}

export type { Locale, Messages };
