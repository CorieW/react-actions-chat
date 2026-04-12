import {
  type EmbeddingVector,
  type FetchLike,
  type TextEmbedder,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from './shared';

export interface OpenAITextEmbedderConfig {
  readonly apiKey: string;
  readonly model?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly dimensions?: number | undefined;
  readonly organization?: string | undefined;
  readonly project?: string | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly fetch?: FetchLike | undefined;
}

interface OpenAIEmbeddingsResponse {
  readonly data?: readonly {
    readonly embedding?: readonly number[];
  }[];
  readonly error?: {
    readonly message?: string;
  };
}

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_OPENAI_MODEL = 'text-embedding-3-large';

/**
 * Creates a text embedder backed by OpenAI's embeddings endpoint.
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
