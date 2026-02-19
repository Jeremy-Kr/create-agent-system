export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isValidModel(value: unknown): value is 'opus' | 'sonnet' | 'haiku' {
  return value === 'opus' || value === 'sonnet' || value === 'haiku';
}
