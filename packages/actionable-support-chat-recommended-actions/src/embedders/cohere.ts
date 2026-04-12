import {
  type EmbeddingInputType,
  type EmbeddingVector,
  type FetchLike,
  type TextEmbedder,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from './shared';

export interface CohereTextEmbedderConfig {
  readonly apiKey: string;
  readonly model?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly outputDimension?: 256 | 512 | 1024 | 1536 | undefined;
  readonly truncate?: 'NONE' | 'START' | 'END' | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly fetch?: FetchLike | undefined;
}

interface CohereEmbeddingsResponse {
  readonly embeddings?: {
    readonly float?: readonly (readonly number[])[];
  };
  readonly message?: string;
}

const DEFAULT_COHERE_BASE_URL = 'https://api.cohere.com/v2';
const DEFAULT_COHERE_MODEL = 'embed-v4.0';

function mapCohereInputType(inputType: EmbeddingInputType | undefined): string {
  return inputType === 'query' ? 'search_query' : 'search_document';
}

/**
 * Creates a text embedder backed by Cohere's embed API.
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
