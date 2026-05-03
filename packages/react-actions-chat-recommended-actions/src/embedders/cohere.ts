import {
  type EmbeddingInputType,
  type EmbeddingVector,
  type FetchLike,
  type TextEmbedder,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from './shared';

/**
 * Configuration for the cohere text embedder.
 */
export interface CohereTextEmbedderConfig {
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
   * Expected embedding vector dimension returned by the provider.
   */
  readonly outputDimension?: 256 | 512 | 1024 | 1536 | undefined;
  /**
   * Cohere truncation strategy for long inputs.
   */
  readonly truncate?: 'NONE' | 'START' | 'END' | undefined;
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
 * Provider response shape returned by the cohere embeddings endpoint.
 */
interface CohereEmbeddingsResponse {
  /**
   * Vector embeddings returned for the input texts.
   */
  readonly embeddings?: {
    /**
     * Single numeric component of the returned embedding vector.
     */
    readonly float?: readonly (readonly number[])[];
  };
  /**
   * Message object handled by this contract.
   */
  readonly message?: string;
}

/**
 * Default Cohere API base URL used by the text embedder.
 */
const DEFAULT_COHERE_BASE_URL = 'https://api.cohere.com/v2';
/**
 * Default Cohere embedding model used by the text embedder.
 */
const DEFAULT_COHERE_MODEL = 'embed-v4.0';

/**
 * Maps the shared embedding input type to Cohere request values.
 *
 * @param inputType - Input role or input control type to map.
 */
function mapCohereInputType(inputType: EmbeddingInputType | undefined): string {
  return inputType === 'query' ? 'search_query' : 'search_document';
}

/**
 * Creates a text embedder backed by Cohere's embed API.
 *
 * @param config - Cohere API credentials, model, endpoint, headers, and fetch override.
 */
export function createCohereTextEmbedder(
  config: CohereTextEmbedderConfig
): TextEmbedder {
  const {
    apiKey,
    baseUrl = DEFAULT_COHERE_BASE_URL,
    fetch: fetchImpl,
    headers,
    model = DEFAULT_COHERE_MODEL,
    outputDimension,
    truncate,
  } = config;
  const requestFetch = getFetchImplementation(fetchImpl);
  const embeddingsUrl = `${baseUrl.replace(/\/$/, '')}/embed`;

  const embedTextsWithCohere = async (
    texts: readonly string[],
    inputType?: EmbeddingInputType
  ): Promise<readonly EmbeddingVector[]> => {
    const response = await requestFetch(embeddingsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        model,
        input_type: mapCohereInputType(inputType),
        texts,
        embedding_types: ['float'],
        ...(outputDimension ? { output_dimension: outputDimension } : {}),
        ...(truncate ? { truncate } : {}),
      }),
    });
    const data = await parseJsonResponse<CohereEmbeddingsResponse>(response);

    if (!response.ok) {
      throw new Error(
        extractProviderErrorMessage(
          data,
          `Cohere embed request failed with status ${response.status}.`
        )
      );
    }

    const embeddings = data?.embeddings?.float;
    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error(
        'Cohere embeddings response did not include one float embedding per input text.'
      );
    }

    return embeddings;
  };

  return {
    embedText: async (text, options) => {
      const [embedding] = await embedTextsWithCohere(
        [text],
        options?.inputType
      );

      if (!embedding || embedding.length === 0) {
        throw new Error(
          'Cohere did not return an embedding for the input text.'
        );
      }

      return embedding;
    },
    embedTexts: async (texts, options) => {
      return embedTextsWithCohere(texts, options?.inputType);
    },
  };
}
