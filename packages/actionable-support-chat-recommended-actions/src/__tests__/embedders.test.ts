import { describe, expect, it, vi } from 'vitest';
import {
  createCohereTextEmbedder,
  createOpenAITextEmbedder,
  createVoyageTextEmbedder,
} from 'actionable-support-chat-recommended-actions';

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
});
