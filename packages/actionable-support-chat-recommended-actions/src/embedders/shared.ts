/**
 * Vector type used for embedding-based search.
 */
export type EmbeddingVector = readonly number[];

/**
 * Describes whether text is being embedded as a query or a document.
 */
export type EmbeddingInputType = 'query' | 'document';

export interface EmbedTextOptions {
  readonly inputType?: EmbeddingInputType | undefined;
}

/**
 * Generic text embedder contract used by the vector search flow.
 */
export interface TextEmbedder {
  readonly embedText: (
    text: string,
    options?: EmbedTextOptions
  ) => Promise<EmbeddingVector>;
  readonly embedTexts?:
    | ((
        texts: readonly string[],
        options?: EmbedTextOptions
      ) => Promise<readonly EmbeddingVector[]>)
    | undefined;
}

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export async function embedTexts(
  embedder: TextEmbedder,
  texts: readonly string[],
  inputType: EmbeddingInputType
): Promise<readonly EmbeddingVector[]> {
  if (embedder.embedTexts) {
    return embedder.embedTexts(texts, {
      inputType,
    });
  }

  return Promise.all(
    texts.map(text =>
      embedder.embedText(text, {
        inputType,
      })
    )
  );
}

export function getFetchImplementation(fetchImpl?: FetchLike): FetchLike {
  const resolvedFetch = fetchImpl ?? globalThis.fetch;

  if (!resolvedFetch) {
    throw new Error(
      'No fetch implementation was available for the text embedder request.'
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
