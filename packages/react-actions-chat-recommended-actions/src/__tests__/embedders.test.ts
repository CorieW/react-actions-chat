import { describe, expect, it, vi } from 'vitest';
import {
  createCohereTextEmbedder,
  createOpenAITextEmbedder,
  createVoyageTextEmbedder,
  embedTexts,
  type TextEmbedder,
} from 'react-actions-chat-recommended-actions';
import {
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from '../embedders/shared';

interface CohereEmbeddingsRequestBody {
  readonly input_type: string;
  readonly texts: readonly string[];
}

interface VoyageEmbeddingsRequestBody {
  readonly input_type: string;
}

type FetchMock = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

function getRequestBody(init?: RequestInit): string {
  if (typeof init?.body !== 'string') {
    throw new Error('Expected request body to be a JSON string.');
  }

  return init.body;
}

function parseRequestBody<T>(init?: RequestInit): T {
  return JSON.parse(getRequestBody(init)) as T;
}

describe('Built-in Embedders', () => {
  it('uses batch embedding when available and falls back to embedText otherwise', async () => {
    const batchEmbedTexts = vi.fn((texts: readonly string[]) =>
      Promise.resolve(texts.map((text, index) => [text.length, index] as const))
    );
    const batchEmbedder: TextEmbedder = {
      embedText: () => {
        throw new Error('Batch path should be preferred.');
      },
      embedTexts: batchEmbedTexts,
    };
    const singleEmbedText = vi.fn((text: string) =>
      Promise.resolve([text.length] as const)
    );
    const singleEmbedder: TextEmbedder = {
      embedText: singleEmbedText,
    };

    await expect(
      embedTexts(batchEmbedder, ['hello', 'bye'], 'document')
    ).resolves.toEqual([
      [5, 0],
      [3, 1],
    ]);
    expect(batchEmbedTexts).toHaveBeenCalledWith(['hello', 'bye'], {
      inputType: 'document',
    });

    await expect(
      embedTexts(singleEmbedder, ['alpha', 'beta'], 'query')
    ).resolves.toEqual([[5], [4]]);
    expect(singleEmbedText).toHaveBeenNthCalledWith(1, 'alpha', {
      inputType: 'query',
    });
    expect(singleEmbedText).toHaveBeenNthCalledWith(2, 'beta', {
      inputType: 'query',
    });
  });

  it('handles shared fetch and response parsing helpers', async () => {
    const originalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', undefined);

    expect(() => getFetchImplementation()).toThrow(
      'No fetch implementation was available for the text embedder request.'
    );

    globalThis.fetch = originalFetch;

    await expect(
      parseJsonResponse<{ ok: boolean }>(
        new Response('', {
          status: 200,
        })
      )
    ).resolves.toBeNull();

    expect(
      extractProviderErrorMessage(
        {
          error: {
            message: 'Nested provider error',
          },
        },
        'fallback'
      )
    ).toBe('Nested provider error');
    expect(
      extractProviderErrorMessage(
        {
          message: 'Top-level provider error',
        },
        'fallback'
      )
    ).toBe('Top-level provider error');
    expect(extractProviderErrorMessage(null, 'fallback')).toBe('fallback');
  });

  it('creates OpenAI embeddings with the expected request shape', async () => {
    const fetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                embedding: [0.1, 0.2, 0.3],
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const embedder = createOpenAITextEmbedder({
      apiKey: 'test-key',
      fetch: fetchMock,
      model: 'text-embedding-3-large',
    });

    await expect(embedder.embedText('hello world')).resolves.toEqual([
      0.1, 0.2, 0.3,
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.openai.com/v1/embeddings'
    );
    expect(requestInit?.method).toBe('POST');
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Bearer test-key'
    );
  });

  it('surfaces OpenAI provider errors and invalid response shapes', async () => {
    const errorFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: 'OpenAI request was rejected',
            },
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const mismatchFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const missingEmbeddingFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [{}],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );

    const errorEmbedder = createOpenAITextEmbedder({
      apiKey: 'test-key',
      fetch: errorFetchMock,
    });
    const mismatchEmbedder = createOpenAITextEmbedder({
      apiKey: 'test-key',
      fetch: mismatchFetchMock,
    });
    const missingEmbeddingEmbedder = createOpenAITextEmbedder({
      apiKey: 'test-key',
      fetch: missingEmbeddingFetchMock,
    });

    await expect(errorEmbedder.embedText('hello world')).rejects.toThrow(
      'OpenAI request was rejected'
    );
    await expect(
      mismatchEmbedder.embedTexts?.(['hello world', 'bye world'])
    ).rejects.toThrow(
      'OpenAI embeddings response did not include one embedding per input text.'
    );
    await expect(
      missingEmbeddingEmbedder.embedText('hello world')
    ).rejects.toThrow('OpenAI did not return an embedding for the input text.');
  });

  it('creates Cohere embeddings with retrieval-aware input types', async () => {
    const fetchMock = vi.fn<FetchMock>(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        const parsedBody = parseRequestBody<CohereEmbeddingsRequestBody>(init);
        expect(parsedBody.input_type).toBe('search_query');
        expect(parsedBody.texts).toEqual(['hello world']);

        return Promise.resolve(
          new Response(
            JSON.stringify({
              embeddings: {
                float: [[0.3, 0.4, 0.5]],
              },
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        );
      }
    );
    const embedder = createCohereTextEmbedder({
      apiKey: 'test-key',
      fetch: fetchMock,
    });

    await expect(
      embedder.embedText('hello world', {
        inputType: 'query',
      })
    ).resolves.toEqual([0.3, 0.4, 0.5]);
  });

  it('surfaces Cohere provider errors and invalid response shapes', async () => {
    const errorFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            message: 'Cohere request was rejected',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const mismatchFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            embeddings: {
              float: [],
            },
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const missingEmbeddingFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            embeddings: {
              float: [undefined],
            },
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );

    const errorEmbedder = createCohereTextEmbedder({
      apiKey: 'test-key',
      fetch: errorFetchMock,
    });
    const mismatchEmbedder = createCohereTextEmbedder({
      apiKey: 'test-key',
      fetch: mismatchFetchMock,
    });
    const missingEmbeddingEmbedder = createCohereTextEmbedder({
      apiKey: 'test-key',
      fetch: missingEmbeddingFetchMock,
    });

    await expect(errorEmbedder.embedText('hello world')).rejects.toThrow(
      'Cohere request was rejected'
    );
    await expect(
      mismatchEmbedder.embedTexts?.(['hello world', 'bye world'])
    ).rejects.toThrow(
      'Cohere embeddings response did not include one float embedding per input text.'
    );
    await expect(
      missingEmbeddingEmbedder.embedText('hello world')
    ).rejects.toThrow('Cohere did not return an embedding for the input text.');
  });

  it('creates Voyage embeddings with query/document modes', async () => {
    const fetchMock = vi.fn<FetchMock>(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        const parsedBody = parseRequestBody<VoyageEmbeddingsRequestBody>(init);
        expect(parsedBody.input_type).toBe('document');

        return Promise.resolve(
          new Response(
            JSON.stringify({
              embeddings: [[0.7, 0.8, 0.9]],
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        );
      }
    );
    const embedder = createVoyageTextEmbedder({
      apiKey: 'test-key',
      fetch: fetchMock,
    });

    await expect(
      embedder.embedText('document text', {
        inputType: 'document',
      })
    ).resolves.toEqual([0.7, 0.8, 0.9]);
  });

  it('supports Voyage data responses and surfaces provider errors', async () => {
    const dataFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                embedding: [0.9, 0.8, 0.7],
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const errorFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: 'Voyage request was rejected',
            },
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const mismatchFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            embeddings: [],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const missingEmbeddingFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [{}],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );

    const dataEmbedder = createVoyageTextEmbedder({
      apiKey: 'test-key',
      fetch: dataFetchMock,
    });
    const errorEmbedder = createVoyageTextEmbedder({
      apiKey: 'test-key',
      fetch: errorFetchMock,
    });
    const mismatchEmbedder = createVoyageTextEmbedder({
      apiKey: 'test-key',
      fetch: mismatchFetchMock,
    });
    const missingEmbeddingEmbedder = createVoyageTextEmbedder({
      apiKey: 'test-key',
      fetch: missingEmbeddingFetchMock,
    });

    await expect(dataEmbedder.embedText('document text')).resolves.toEqual([
      0.9, 0.8, 0.7,
    ]);
    await expect(errorEmbedder.embedText('document text')).rejects.toThrow(
      'Voyage request was rejected'
    );
    await expect(
      mismatchEmbedder.embedTexts?.(['document text', 'another doc'])
    ).rejects.toThrow(
      'Voyage embeddings response did not include one embedding per input text.'
    );
    await expect(
      missingEmbeddingEmbedder.embedText('document text')
    ).rejects.toThrow('Voyage did not return an embedding for the input text.');
  });
});
