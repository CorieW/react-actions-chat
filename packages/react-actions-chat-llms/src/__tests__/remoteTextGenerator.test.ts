import { describe, expect, it, vi } from 'vitest';
import { createRemoteTextGenerator } from 'react-actions-chat-llms';

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

describe('createRemoteTextGenerator', () => {
  it('posts normalized requests to the backend and returns the response', async () => {
    const fetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            text: 'Backend reply',
            finishReason: 'stop',
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
    const generator = createRemoteTextGenerator({
      url: '/api/llm',
      fetch: fetchMock,
      credentials: 'include',
      headers: {
        'X-Test': '1',
      },
    });
    const abortController = new AbortController();

    await expect(
      generator.generateText({
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        maxOutputTokens: 120,
        signal: abortController.signal,
      })
    ).resolves.toEqual({
      text: 'Backend reply',
      finishReason: 'stop',
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/llm');
    expect(requestInit?.credentials).toBe('include');
    expect(requestInit?.signal).toBe(abortController.signal);
    expect(new Headers(requestInit?.headers).get('X-Test')).toBe('1');
    expect(
      parseRequestBody<{
        readonly maxOutputTokens?: number;
        readonly signal?: unknown;
      }>(requestInit)
    ).toEqual({
      messages: [
        {
          role: 'user',
          content: 'Hello',
        },
      ],
      maxOutputTokens: 120,
    });
  });

  it('supports async header factories and surfaces backend errors', async () => {
    const fetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: 'Backend refused the request',
            },
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const generator = createRemoteTextGenerator({
      url: '/api/llm',
      fetch: fetchMock,
      headers: async request => ({
        'X-Message-Count': String(request.messages.length),
      }),
    });

    await expect(
      generator.generateText({
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      })
    ).rejects.toThrow('Backend refused the request');

    const [, requestInit] = fetchMock.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];

    expect(new Headers(requestInit?.headers).get('X-Message-Count')).toBe('1');
  });

  it('fails when the backend returns an invalid success payload', async () => {
    const fetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    );
    const generator = createRemoteTextGenerator({
      url: '/api/llm',
      fetch: fetchMock,
    });

    await expect(
      generator.generateText({
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
});
