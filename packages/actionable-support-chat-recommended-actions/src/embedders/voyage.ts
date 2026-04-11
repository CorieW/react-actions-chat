import {
  type EmbeddingInputType,
  type EmbeddingVector,
  type FetchLike,
  type TextEmbedder,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from "./shared";

export interface VoyageTextEmbedderConfig {
  readonly apiKey: string;
  readonly model?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly outputDimension?: 256 | 512 | 1024 | 2048 | undefined;
  readonly truncation?: boolean | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly fetch?: FetchLike | undefined;
}

interface VoyageEmbeddingsResponse {
  readonly embeddings?: readonly (readonly number[])[];
  readonly data?: readonly {
    readonly embedding?: readonly number[];
  }[];
  readonly detail?: string;
  readonly error?: {
    readonly message?: string;
  };
}

const DEFAULT_VOYAGE_BASE_URL = "https://api.voyageai.com/v1";
const DEFAULT_VOYAGE_MODEL = "voyage-4-large";

function mapVoyageInputType(
  inputType: EmbeddingInputType | undefined,
): "query" | "document" {
  return inputType === "query" ? "query" : "document";
}

/**
 * Creates a text embedder backed by Voyage's embeddings endpoint.
 */
export function createVoyageTextEmbedder(
  config: VoyageTextEmbedderConfig,
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
  const embeddingsUrl = `${baseUrl.replace(/\/$/, "")}/embeddings`;

  const embedTextsWithVoyage = async (
    texts: readonly string[],
    inputType?: EmbeddingInputType,
  ): Promise<readonly EmbeddingVector[]> => {
    const response = await requestFetch(embeddingsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
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
          `Voyage embeddings request failed with status ${response.status}.`,
        ),
      );
    }

    const embeddings =
      data?.embeddings ?? data?.data?.map((item) => item.embedding ?? []);

    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error(
        "Voyage embeddings response did not include one embedding per input text.",
      );
    }

    return embeddings;
  };

  return {
    embedText: async (text, options) => {
      const [embedding] = await embedTextsWithVoyage(
        [text],
        options?.inputType,
      );

      if (!embedding) {
        throw new Error(
          "Voyage did not return an embedding for the input text.",
        );
      }

      return embedding;
    },
    embedTexts: async (texts, options) => {
      return embedTextsWithVoyage(texts, options?.inputType);
    },
  };
}
