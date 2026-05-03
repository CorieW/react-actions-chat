import {
  type EmbeddingVector,
  type FetchLike,
  type TextEmbedder,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from './shared';

/**
 * Configuration for the OpenAI text embedder.
 */
export interface OpenAITextEmbedderConfig {
  /**
   * Provider API key used for authenticated requests.
   */
  readonly apiKey: string;
  /**
   * Provider model identifier used for generation or embeddings.
   */
  readonly model?: string | undefined;
  /**
   * Base URL used when making provider requests.
   */
  readonly baseUrl?: string | undefined;
  /**
   * Requested embedding dimension count for OpenAI models that support it.
   */
  readonly dimensions?: number | undefined;
  /**
   * OpenAI organization identifier sent with embedding requests.
   */
  readonly organization?: string | undefined;
  /**
   * OpenAI project identifier sent with embedding requests.
   */
  readonly project?: string | undefined;
  /**
   * Additional headers sent with provider requests.
   */
  readonly headers?: Readonly<Record<string, string>> | undefined;
  /**
   * Fetch implementation used for HTTP requests.
   */
  readonly fetch?: FetchLike | undefined;
}

/**
 * Provider response shape returned by the OpenAI embeddings endpoint.
 */
interface OpenAIEmbeddingsResponse {
  /**
   * Provider response data returned by the request.
   */
  readonly data?: readonly {
    /**
     * Vector embedding generated for the text.
     */
    readonly embedding?: readonly number[];
  }[];
  /**
   * Error value raised by the operation.
   */
  readonly error?: {
    /**
     * Message object handled by this contract.
     */
    readonly message?: string;
  };
}

/**
 * Default OpenAI API base URL used by the text embedder.
 */
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
/**
 * Default OpenAI embedding model used by the text embedder.
 */
const DEFAULT_OPENAI_MODEL = 'text-embedding-3-large';

/**
 * Creates a text embedder backed by OpenAI's embeddings endpoint.
 *
 * @param config - OpenAI API credentials, model, endpoint, headers, and fetch override.
 */
export function createOpenAITextEmbedder(
  config: OpenAITextEmbedderConfig
): TextEmbedder {
  const {
    apiKey,
    baseUrl = DEFAULT_OPENAI_BASE_URL,
    dimensions,
    fetch: fetchImpl,
    headers,
    model = DEFAULT_OPENAI_MODEL,
    organization,
    project,
  } = config;
  const requestFetch = getFetchImplementation(fetchImpl);
  const embeddingsUrl = `${baseUrl.replace(/\/$/, '')}/embeddings`;

  const embedTextsWithOpenAI = async (
    texts: readonly string[]
  ): Promise<readonly EmbeddingVector[]> => {
    const response = await requestFetch(embeddingsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(organization ? { 'OpenAI-Organization': organization } : {}),
        ...(project ? { 'OpenAI-Project': project } : {}),
        ...headers,
      },
      body: JSON.stringify({
        input: texts,
        model,
        ...(dimensions ? { dimensions } : {}),
      }),
    });
    const data = await parseJsonResponse<OpenAIEmbeddingsResponse>(response);

    if (!response.ok) {
      throw new Error(
        extractProviderErrorMessage(
          data,
          `OpenAI embeddings request failed with status ${response.status}.`
        )
      );
    }

    if (!data?.data || data.data.length !== texts.length) {
      throw new Error(
        'OpenAI embeddings response did not include one embedding per input text.'
      );
    }

    return data.data.map(item => item.embedding ?? []);
  };

  return {
    embedText: async text => {
      const [embedding] = await embedTextsWithOpenAI([text]);

      if (!embedding || embedding.length === 0) {
        throw new Error(
          'OpenAI did not return an embedding for the input text.'
        );
      }

      return embedding;
    },
    embedTexts: embedTextsWithOpenAI,
  };
}
