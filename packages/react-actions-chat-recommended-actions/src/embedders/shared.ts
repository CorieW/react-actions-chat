/**
 * Vector type used for embedding-based search.
 */
export type EmbeddingVector = readonly number[];

/**
 * Describes whether text is being embedded as a query or a document.
 */
export type EmbeddingInputType = 'query' | 'document';

/**
 * Options passed to text embedding calls.
 */
export interface EmbedTextOptions {
  /**
   * Input mode used when collecting user input.
   */
  readonly inputType?: EmbeddingInputType | undefined;
}

/**
 * Generic text embedder contract used by the vector search flow.
 */
export interface TextEmbedder {
  /**
   * Handles embed text.
   *
   * @param text - Text to embed.
   * @param options - Select options to apply.
   */
  readonly embedText: (
    text: string,
    options?: EmbedTextOptions
  ) => Promise<EmbeddingVector>;
  /**
   * Handles embed texts.
   *
   * @param texts - Text values to embed.
   * @param options - Select options to apply.
   */
  readonly embedTexts?:
    | ((
        texts: readonly string[],
        options?: EmbedTextOptions
      ) => Promise<readonly EmbeddingVector[]>)
    | undefined;
}

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
 * Embeds a batch of text inputs, using provider batch support when available.
 *
 * @param embedder - Text embedder used to create embeddings.
 * @param texts - Text values to embed.
 * @param inputType - Input role or input control type to map.
 */
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

/**
 * Returns the configured fetch implementation or the global fetch fallback.
 *
 * @param fetchImpl - Optional fetch implementation override.
 */
export function getFetchImplementation(fetchImpl?: FetchLike): FetchLike {
  const resolvedFetch = fetchImpl ?? globalThis.fetch;

  if (!resolvedFetch) {
    throw new Error(
      'No fetch implementation was available for the text embedder request.'
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
