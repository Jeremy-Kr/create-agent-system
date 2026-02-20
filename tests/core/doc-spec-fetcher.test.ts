import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUNDLED_DOC_SPEC } from '../../src/core/doc-spec.js';
import { fetchDocSpec } from '../../src/core/doc-spec-fetcher.js';

describe('doc-spec-fetcher', () => {
  const originalEnv = process.env.CONTEXT7_API_KEY;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    process.env.CONTEXT7_API_KEY = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns bundled spec when no API key is set', async () => {
    delete process.env.CONTEXT7_API_KEY;
    const spec = await fetchDocSpec();
    expect(spec).toEqual(BUNDLED_DOC_SPEC);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns bundled spec on network error', async () => {
    process.env.CONTEXT7_API_KEY = 'test-key';
    mockFetch.mockRejectedValue(new Error('Network error'));
    const spec = await fetchDocSpec();
    expect(spec).toEqual(BUNDLED_DOC_SPEC);
  });

  it('returns bundled spec on non-ok response', async () => {
    process.env.CONTEXT7_API_KEY = 'test-key';
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });
    const spec = await fetchDocSpec();
    expect(spec).toEqual(BUNDLED_DOC_SPEC);
  });

  it('returns bundled spec when response lacks required fields', async () => {
    process.env.CONTEXT7_API_KEY = 'test-key';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ skill: {} }),
    });
    const spec = await fetchDocSpec();
    expect(spec).toEqual(BUNDLED_DOC_SPEC);
  });

  it('merges API response with bundled spec on success', async () => {
    process.env.CONTEXT7_API_KEY = 'test-key';
    const remoteData = {
      version: '2026-03-01',
      agent: {
        ...BUNDLED_DOC_SPEC.agent,
        validColors: ['blue', 'cyan', 'green', 'yellow', 'magenta', 'red', 'orange'],
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(remoteData),
    });

    const spec = await fetchDocSpec();
    expect(spec.source).toBe('context7');
    expect(spec.version).toBe('2026-03-01');
    expect(spec.agent.validColors).toContain('orange');
    // Bundled fields are preserved for non-overridden sections
    expect(spec.skill).toEqual(BUNDLED_DOC_SPEC.skill);
  });

  it('sends correct authorization header', async () => {
    process.env.CONTEXT7_API_KEY = 'my-secret-key';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: '2026-03-01', agent: BUNDLED_DOC_SPEC.agent }),
    });

    await fetchDocSpec();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/claude-code/spec'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-secret-key',
        }),
      }),
    );
  });

  it('uses AbortController signal for timeout', async () => {
    process.env.CONTEXT7_API_KEY = 'test-key';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: '2026-03-01', agent: BUNDLED_DOC_SPEC.agent }),
    });

    await fetchDocSpec();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('returns bundled spec on AbortError (timeout)', async () => {
    process.env.CONTEXT7_API_KEY = 'test-key';
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    mockFetch.mockRejectedValue(abortError);

    const spec = await fetchDocSpec();
    expect(spec).toEqual(BUNDLED_DOC_SPEC);
  });
});
