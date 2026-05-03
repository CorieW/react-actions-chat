/**
 * Minimal fetch-compatible function signature used by package clients.
 *
 * @param input - Request input passed to fetch.
 * @param init - Request initialization options passed to fetch.
 */
export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

/**
 * Returns the configured fetch implementation or the global fetch fallback.
 *
 * @param fetchImpl - Optional fetch implementation override.
 */
export function getFetchImplementation(fetchImpl?: FetchLike): FetchLike {
  const resolvedFetch = fetchImpl ?? globalThis.fetch;

  if (!resolvedFetch) {
    throw new Error(
      'No fetch implementation was available for the text generation request.'
    );
  }

  return resolvedFetch;
}

/**
 * Parses a JSON response body, returning null for empty bodies.
 *
 * @param response - Fetch response to parse.
 */
export async function parseJsonResponse<T>(
  response: Response
): Promise<T | null> {
  const responseText = await response.text();

  if (responseText.trim() === '') {
    return null;
  }

  return JSON.parse(responseText) as T;
}

/**
 * Extracts the most useful provider error message from a response payload.
 *
 * @param data - Response payload to inspect.
 * @param fallbackMessage - Fallback error message used when no provider message is found.
 */
export function extractProviderErrorMessage(
  data: unknown,
  fallbackMessage: string
): string {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    data.error &&
    typeof data.error === 'object' &&
    'message' in data.error &&
    typeof data.error.message === 'string'
  ) {
    return data.error.message;
  }

  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return fallbackMessage;
}
