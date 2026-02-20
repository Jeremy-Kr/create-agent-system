import { BUNDLED_DOC_SPEC, type DocSpec } from './doc-spec.js';

const CONTEXT7_API_URL = 'https://context7.com/api/v2';
const FETCH_TIMEOUT_MS = 10_000;

export async function fetchDocSpec(): Promise<DocSpec> {
  const apiKey = process.env.CONTEXT7_API_KEY;
  if (!apiKey) {
    return BUNDLED_DOC_SPEC;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(`${CONTEXT7_API_URL}/claude-code/spec`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return BUNDLED_DOC_SPEC;
    }

    const data = (await response.json()) as Partial<DocSpec>;

    // Validate the response has minimum required structure
    if (!data.agent || !data.version) {
      return BUNDLED_DOC_SPEC;
    }

    return { ...BUNDLED_DOC_SPEC, ...data, source: 'context7' };
  } catch {
    // Network error, timeout, or parse error — fallback to bundled
    return BUNDLED_DOC_SPEC;
  }
}
