import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PLUGIN_DIR = resolve(import.meta.dirname, '../../plugin');

describe('Plugin Manifest (TICKET-061)', () => {
  const manifestPath = resolve(PLUGIN_DIR, '.claude-plugin/plugin.json');

  it('should have plugin.json file', () => {
    const content = readFileSync(manifestPath, 'utf-8');
    expect(content).toBeTruthy();
  });

  it('should be valid JSON', () => {
    const content = readFileSync(manifestPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should have required fields: name, version, description, license', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('version');
    expect(manifest).toHaveProperty('description');
    expect(manifest).toHaveProperty('license');
  });

  it('should have version matching package.json', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const pkg = JSON.parse(readFileSync(resolve(PLUGIN_DIR, '../package.json'), 'utf-8'));
    expect(manifest.version).toBe(pkg.version);
  });

  it('should have author field with name', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.author).toHaveProperty('name');
  });

  it('should have keywords array', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(Array.isArray(manifest.keywords)).toBe(true);
    expect(manifest.keywords.length).toBeGreaterThan(0);
  });
});
