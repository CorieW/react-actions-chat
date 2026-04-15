import {
  type EmbeddingInputType,
  type EmbeddingVector,
  type FetchLike,
  type TextEmbedder,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from './shared';

export interface GeminiTextEmbedderConfig {
  readonly apiKey: string;
  readonly model?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly outputDimensionality?: number | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly fetch?: FetchLike | undefined;
}

interface GeminiEmbeddingItem {
  readonly values?: readonly number[];
}

interface GeminiEmbeddingsResponse {
  readonly embeddings?: readonly GeminiEmbeddingItem[];
  readonly embedding?: GeminiEmbeddingItem;
  readonly error?: {
    readonly message?: string;
  };
}

const DEFAULT_GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-embedding-001';

function normalizeGeminiModel(model: string): string {
  return model.startsWith('models/') ? model : `models/${model}`;
}

function mapGeminiTaskType(
  inputType: EmbeddingInputType | undefined
): 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' {
  return inputType === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';
}

/**
 * Creates a text embedder backed by the Gemini embeddings endpoint.
 */
export function createGeminiTextEmbedder(
  config: GeminiTextEmbedderConfig
): TextEmbedder {
  const {
    apiKey,
    baseUrl = DEFAULT_GEMINI_BASE_URL,
    fetch: fetchImpl,
    headers,
    model = DEFAULT_GEMINI_MODEL,
    outputDimensionality,
  } = config;
  const requestFetch = getFetchImplementation(fetchImpl);
  const normalizedModel = normalizeGeminiModel(model);
  const embeddingsUrl = `${baseUrl.replace(
    /\/$/,
    ''
  )}/${normalizedModel}:embedContent`;

  const embedTextsWithGemini = async (
    texts: readonly string[],
    inputType?: EmbeddingInputType
  ): Promise<readonly EmbeddingVector[]> => {
    const response = await requestFetch(embeddingsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        ...headers,
      },
      body: JSON.stringify({
        model: normalizedModel,
        content: {
          parts: texts.map(text => ({
            text,
          })),
        },
        taskType: mapGeminiTaskType(inputType),
        ...(outputDimensionality
          ? { output_dimensionality: outputDimensionality }
          : {}),
      }),
    });
    const data = await parseJsonResponse<GeminiEmbeddingsResponse>(response);

    if (!response.ok) {
      throw new Error(
        extractProviderErrorMessage(
          data,
          `Gemini embeddings request failed with status ${response.status}.`
        )
      );
    }

    const embeddings =
      data?.embeddings ?? (data?.embedding ? [data.embedding] : undefined);

    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error(
        'Gemini embeddings response did not include one embedding per input text.'
      );
    }

    return embeddings.map(item => item.values ?? []);
  };

  return {
    embedText: async (text, options) => {
      const [embedding] = await embedTextsWithGemini(
        [text],
        options?.inputType
      );

      if (!embedding || embedding.length === 0) {
        throw new Error(
          'Gemini did not return an embedding for the input text.'
        );
      }

      return embedding;
    },
    embedTexts: async (texts, options) => {
      return embedTextsWithGemini(texts, options?.inputType);
    },
  };
}
