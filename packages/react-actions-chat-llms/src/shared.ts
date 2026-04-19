export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export function getFetchImplementation(fetchImpl?: FetchLike): FetchLike {
  const resolvedFetch = fetchImpl ?? globalThis.fetch;

  if (!resolvedFetch) {
    throw new Error(
      'No fetch implementation was available for the text generation request.'
    );
  }

  return resolvedFetch;
}

export async function parseJsonResponse<T>(
  response: Response
): Promise<T | null> {
  const responseText = await response.text();

  if (responseText.trim() === '') {
    return null;
  }

  return JSON.parse(responseText) as T;
}

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
