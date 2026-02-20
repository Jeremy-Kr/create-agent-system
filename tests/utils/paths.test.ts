import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PRESETS_DIR, TEMPLATES_DIR } from '../../src/utils/paths.js';

describe('paths', () => {
  it('PRESETS_DIR should point to existing directory', () => {
    expect(existsSync(PRESETS_DIR)).toBe(true);
  });

  it('TEMPLATES_DIR should point to existing directory', () => {
    expect(existsSync(TEMPLATES_DIR)).toBe(true);
  });

  it('PRESETS_DIR should end with "presets"', () => {
    expect(PRESETS_DIR).toMatch(/presets$/);
  });

  it('TEMPLATES_DIR should end with "templates"', () => {
    expect(TEMPLATES_DIR).toMatch(/templates$/);
  });
});
