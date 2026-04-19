import { describe, expect, it, vi } from 'vitest';
import {
  createTextGenerationBackend,
  type GenerateTextRequest,
} from 'react-actions-chat-llms';
import {
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from '../shared';

type FetchMock = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

function parseRequestBody<T>(init?: RequestInit): T {
  if (typeof init?.body !== 'string') {
    throw new Error('Expected request body to be a JSON string.');
  }

  return JSON.parse(init.body) as T;
}

describe('createTextGenerationBackend', () => {
  it('posts messages to the backend and returns the generated text', async () => {
    const fetchMock = vi.fn<FetchMock>(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        const requestBody = parseRequestBody<GenerateTextRequest>(init);

        expect(requestBody.messages).toEqual([
          {
            role: 'user',
            content: 'Help me cancel my plan.',
          },
        ]);
        expect(requestBody.maxOutputTokens).toBe(256);

        return Promise.resolve(
          new Response(
            JSON.stringify({
              text: 'You can cancel anytime from Settings > Billing.',
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
    const backend = createTextGenerationBackend({
      url: '/api/llm',
      fetch: fetchMock,
      headers: () => ({
        'X-Demo': 'true',
      }),
    });

    await expect(
      backend.generateText({
        messages: [
          {
            role: 'user',
            content: 'Help me cancel my plan.',
          },
        ],
        maxOutputTokens: 256,
      })
    ).resolves.toEqual({
      text: 'You can cancel anytime from Settings > Billing.',
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/llm');
    expect(requestInit?.method).toBe('POST');
    expect(new Headers(requestInit?.headers).get('X-Demo')).toBe('true');
  });

  it('surfaces backend errors and validates the response body', async () => {
    const rejectedBackend = createTextGenerationBackend({
      url: '/api/llm',
      fetch: vi.fn<FetchMock>(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: {
                message: 'Provider request was rejected',
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
      ),
    });
    const invalidBackend = createTextGenerationBackend({
      url: '/api/llm',
      fetch: vi.fn<FetchMock>(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        )
      ),
    });

    await expect(
      rejectedBackend.generateText({
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      })
    ).rejects.toThrow('Provider request was rejected');
    await expect(
      invalidBackend.generateText({
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      })
    ).rejects.toThrow(
      'The text generation backend did not return a valid response.'
    );
  });

  it('keeps the shared fetch utilities aligned with the package behavior', async () => {
    const originalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', undefined);

    expect(() => getFetchImplementation()).toThrow(
      'No fetch implementation was available for the text generation request.'
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
            message: 'Nested backend error',
          },
        },
        'fallback'
      )
    ).toBe('Nested backend error');
    expect(extractProviderErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
