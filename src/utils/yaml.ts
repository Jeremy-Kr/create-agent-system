import { parse as parseYaml } from 'yaml';
import { isRecord } from './type-guards.js';

export function safeParseYaml(content: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = parseYaml(content);
  } catch {
    throw new Error(`Failed to parse ${label}: YAML syntax error`);
  }

  if (!isRecord(parsed)) {
    throw new Error(
      `Failed to parse ${label}: malformed YAML (expected an object, got ${typeof parsed})`,
    );
  }

  return parsed;
}
