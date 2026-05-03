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
 * Configuration for the voyage text embedder.
 */
export interface VoyageTextEmbedderConfig {
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
  readonly outputDimension?: 256 | 512 | 1024 | 2048 | undefined;
  /**
   * Voyage truncation strategy for long inputs.
   */
  readonly truncation?: boolean | undefined;
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
 * Provider response shape returned by the voyage embeddings endpoint.
 */
interface VoyageEmbeddingsResponse {
  /**
   * Vector embeddings returned for the input texts.
   */
  readonly embeddings?: readonly (readonly number[])[];
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
   * Detail formatter or detail content used by the flow.
   */
  readonly detail?: string;
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
 * Default Voyage API base URL used by the text embedder.
 */
const DEFAULT_VOYAGE_BASE_URL = 'https://api.voyageai.com/v1';
/**
 * Default Voyage embedding model used by the text embedder.
 */
const DEFAULT_VOYAGE_MODEL = 'voyage-4-large';

/**
 * Maps the shared embedding input type to Voyage request values.
 *
 * @param inputType - Input role or input control type to map.
 */
function mapVoyageInputType(
  inputType: EmbeddingInputType | undefined
): 'query' | 'document' {
  return inputType === 'query' ? 'query' : 'document';
}

/**
 * Creates a text embedder backed by Voyage's embeddings endpoint.
 *
 * @param config - Voyage API credentials, model, endpoint, headers, and fetch override.
 */
export function createVoyageTextEmbedder(
  config: VoyageTextEmbedderConfig
): TextEmbedder {
  const {
    apiKey,
    baseUrl = DEFAULT_VOYAGE_BASE_URL,
    fetch: fetchImpl,
    headers,
    model = DEFAULT_VOYAGE_MODEL,
    outputDimension,
    truncation,
  } = config;
  const requestFetch = getFetchImplementation(fetchImpl);
  const embeddingsUrl = `${baseUrl.replace(/\/$/, '')}/embeddings`;

  const embedTextsWithVoyage = async (
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
        input: texts,
        model,
        input_type: mapVoyageInputType(inputType),
        ...(outputDimension ? { output_dimension: outputDimension } : {}),
        ...(truncation !== undefined ? { truncation } : {}),
      }),
    });
    const data = await parseJsonResponse<VoyageEmbeddingsResponse>(response);

    if (!response.ok) {
      throw new Error(
        extractProviderErrorMessage(
          data,
          `Voyage embeddings request failed with status ${response.status}.`
        )
      );
    }

    const embeddings =
      data?.embeddings ?? data?.data?.map(item => item.embedding ?? []);

    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error(
        'Voyage embeddings response did not include one embedding per input text.'
      );
    }

    return embeddings;
  };

  return {
    embedText: async (text, options) => {
      const [embedding] = await embedTextsWithVoyage(
        [text],
        options?.inputType
      );

      if (!embedding || embedding.length === 0) {
        throw new Error(
          'Voyage did not return an embedding for the input text.'
        );
      }

      return embedding;
    },
    embedTexts: async (texts, options) => {
      return embedTextsWithVoyage(texts, options?.inputType);
    },
  };
}
