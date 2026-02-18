import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RegistryIndex } from '../../src/types/registry.js';

// Mock os.homedir() to use temp dir for cache
let tempHome: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => tempHome,
  };
});

// Dynamic import after mock setup
const {
  clearCache,
  fetchItemContent,
  fetchItemManifest,
  fetchRegistryIndex,
  getCacheDir,
  getRegistryBaseUrl,
} = await import('../../src/core/registry-client.js');

const VALID_INDEX: RegistryIndex = {
  version: 1,
  updatedAt: '2026-02-18T00:00:00Z',
  agents: [
    {
      name: 'test-agent',
      description: 'Test agent',
      author: 'test',
      version: '1.0.0',
      tags: ['test'],
      path: 'agents/test-agent',
    },
  ],
  skills: [],
  presets: [],
};

const VALID_MANIFEST = {
  name: 'test-agent',
  displayName: 'Test Agent',
  description: 'A test agent',
  author: 'test',
  version: '1.0.0',
  tags: ['test'],
  type: 'agent' as const,
};

function mockFetchOk(body: unknown, headers?: Record<string, string>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    headers: new Headers(headers),
  });
}

function mockFetchFail(status = 500) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Internal Server Error',
    json: () => Promise.reject(new Error('fail')),
    text: () => Promise.reject(new Error('fail')),
    headers: new Headers(),
  });
}

describe('Registry Client (TICKET-046)', () => {
  beforeEach(async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'cas-test-'));
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    if (tempHome) {
      await rm(tempHome, { recursive: true, force: true });
    }
  });

  describe('getRegistryBaseUrl', () => {
    it('should return default URL when env var is not set', () => {
      delete process.env.CAS_REGISTRY_URL;
      const url = getRegistryBaseUrl();
      expect(url).toContain('github');
      expect(url).toContain('create-agent-system');
    });

    it('should return env var value when CAS_REGISTRY_URL is set', () => {
      process.env.CAS_REGISTRY_URL = 'https://custom-registry.example.com';
      const url = getRegistryBaseUrl();
      expect(url).toBe('https://custom-registry.example.com');
      delete process.env.CAS_REGISTRY_URL;
    });
  });

  describe('getCacheDir', () => {
    it('should return path under homedir', () => {
      const dir = getCacheDir();
      expect(dir).toContain(tempHome);
      expect(dir).toContain('cache');
    });
  });

  describe('fetchRegistryIndex', () => {
    it('should fetch and return valid index', async () => {
      global.fetch = mockFetchOk(VALID_INDEX);

      const index = await fetchRegistryIndex({ skipCache: true });
      expect(index.version).toBe(1);
      expect(index.agents).toHaveLength(1);
      expect(index.agents[0].name).toBe('test-agent');
    });

    it('should cache index after fetch', async () => {
      global.fetch = mockFetchOk(VALID_INDEX);

      await fetchRegistryIndex({ skipCache: true });

      // Second call should use cache (fetch should only be called once)
      const index2 = await fetchRegistryIndex();
      expect(index2.version).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should re-fetch when cache is expired', async () => {
      // Write stale cache
      const cacheDir = getCacheDir();
      await mkdir(cacheDir, { recursive: true });
      await writeFile(join(cacheDir, 'registry.json'), JSON.stringify(VALID_INDEX), 'utf-8');
      await writeFile(
        join(cacheDir, 'registry.meta.json'),
        JSON.stringify({ fetchedAt: Date.now() - 2 * 60 * 60 * 1000 }), // 2 hours ago
        'utf-8',
      );

      const updatedIndex = { ...VALID_INDEX, version: 2 };
      global.fetch = mockFetchOk(updatedIndex);

      const index = await fetchRegistryIndex();
      expect(index.version).toBe(2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to stale cache when fetch fails', async () => {
      // Write stale cache
      const cacheDir = getCacheDir();
      await mkdir(cacheDir, { recursive: true });
      await writeFile(join(cacheDir, 'registry.json'), JSON.stringify(VALID_INDEX), 'utf-8');
      await writeFile(
        join(cacheDir, 'registry.meta.json'),
        JSON.stringify({ fetchedAt: Date.now() - 2 * 60 * 60 * 1000 }),
        'utf-8',
      );

      global.fetch = mockFetchFail();

      const index = await fetchRegistryIndex();
      expect(index.version).toBe(1); // stale cache
    });

    it('should throw when fetch fails and no cache exists', async () => {
      global.fetch = mockFetchFail();

      await expect(fetchRegistryIndex({ skipCache: true })).rejects.toThrow(
        /Failed to fetch registry index/,
      );
    });

    it('should throw when response is not valid RegistryIndex', async () => {
      global.fetch = mockFetchOk({ invalid: 'data' });

      await expect(fetchRegistryIndex({ skipCache: true })).rejects.toThrow(
        /Invalid registry index format/,
      );
    });

    it('should store etag from response headers', async () => {
      global.fetch = mockFetchOk(VALID_INDEX, { etag: '"abc123"' });

      await fetchRegistryIndex({ skipCache: true });

      const metaPath = join(getCacheDir(), 'registry.meta.json');
      const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
      expect(meta.etag).toBe('"abc123"');
    });
  });

  describe('fetchItemManifest', () => {
    it('should fetch and return valid manifest', async () => {
      global.fetch = mockFetchOk(VALID_MANIFEST);

      const manifest = await fetchItemManifest('agents/test-agent');
      expect(manifest.name).toBe('test-agent');
      expect(manifest.type).toBe('agent');
    });

    it('should cache manifest after fetch', async () => {
      global.fetch = mockFetchOk(VALID_MANIFEST);

      await fetchItemManifest('agents/test-agent');

      // Second call should use cache
      const manifest2 = await fetchItemManifest('agents/test-agent');
      expect(manifest2.name).toBe('test-agent');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw on invalid manifest format', async () => {
      global.fetch = mockFetchOk({ name: 'test' }); // missing required fields

      await expect(fetchItemManifest('agents/bad')).rejects.toThrow(/Invalid manifest format/);
    });

    it('should throw on HTTP error', async () => {
      global.fetch = mockFetchFail(404);

      await expect(fetchItemManifest('agents/missing')).rejects.toThrow(/HTTP 404/);
    });
  });

  describe('fetchItemContent', () => {
    it('should fetch and return content string', async () => {
      const content = '# Test Agent\nThis is a test.';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(content),
        headers: new Headers(),
      });

      const result = await fetchItemContent('agents/test-agent', 'agent.md');
      expect(result).toBe(content);
    });

    it('should cache content after fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('cached content'),
        headers: new Headers(),
      });

      await fetchItemContent('agents/test-agent', 'agent.md');

      // Second call should use cache
      const result2 = await fetchItemContent('agents/test-agent', 'agent.md');
      expect(result2).toBe('cached content');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw on HTTP error', async () => {
      global.fetch = mockFetchFail(404);

      await expect(fetchItemContent('agents/missing', 'agent.md')).rejects.toThrow(/HTTP 404/);
    });
  });

  describe('clearCache', () => {
    it('should remove cache directory', async () => {
      const cacheDir = getCacheDir();
      await mkdir(cacheDir, { recursive: true });
      await writeFile(join(cacheDir, 'test.json'), '{}', 'utf-8');

      await clearCache();

      const { stat } = await import('node:fs/promises');
      await expect(stat(cacheDir)).rejects.toThrow();
    });

    it('should not throw when cache directory does not exist', async () => {
      await expect(clearCache()).resolves.toBeUndefined();
    });
  });
});
