import { describe, expect, it, vi } from 'vitest';
import {
  createAnthropicTextGenerator,
  createGeminiTextGenerator,
  createOpenAITextGenerator,
} from 'react-actions-chat-llms';
import {
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
  splitSystemPrompt,
  type GenerateTextRequest,
} from '../providers/shared';

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

describe('LLM Providers', () => {
  it('handles shared helpers', async () => {
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
      splitSystemPrompt([
        {
          role: 'system',
          content: 'Be concise.',
        },
        {
          role: 'user',
          content: 'Hello',
        },
      ])
    ).toEqual({
      messages: [
        {
          role: 'user',
          content: 'Hello',
        },
      ],
      systemPrompt: 'Be concise.',
    });

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
  });

  it('creates OpenAI requests with developer instructions', async () => {
    const fetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [
              {
                finish_reason: 'stop',
                message: {
                  content: 'OpenAI says hello.',
                },
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
    const generator = createOpenAITextGenerator({
      apiKey: 'test-key',
      fetch: fetchMock,
      model: 'gpt-4.1-mini',
    });

    await expect(
      generator.generateText({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful support assistant.',
          },
          {
            role: 'user',
            content: 'Hello there',
          },
        ],
        maxOutputTokens: 200,
      })
    ).resolves.toEqual({
      text: 'OpenAI says hello.',
      finishReason: 'stop',
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];
    const requestBody = parseRequestBody<{
      readonly max_completion_tokens?: number;
      readonly messages: readonly {
        readonly content: string;
        readonly role: string;
      }[];
    }>(requestInit);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.openai.com/v1/chat/completions'
    );
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Bearer test-key'
    );
    expect(requestBody.max_completion_tokens).toBe(200);
    expect(requestBody.messages).toEqual([
      {
        role: 'developer',
        content: 'You are a helpful support assistant.',
      },
      {
        role: 'user',
        content: 'Hello there',
      },
    ]);
  });

  it('surfaces OpenAI errors and invalid response shapes', async () => {
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
    const emptyFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '',
                },
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
    const errorGenerator = createOpenAITextGenerator({
      apiKey: 'test-key',
      fetch: errorFetchMock,
    });
    const emptyGenerator = createOpenAITextGenerator({
      apiKey: 'test-key',
      fetch: emptyFetchMock,
    });
    const request: GenerateTextRequest = {
      messages: [
        {
          role: 'user',
          content: 'hello',
        },
      ],
    };

    await expect(errorGenerator.generateText(request)).rejects.toThrow(
      'OpenAI request was rejected'
    );
    await expect(emptyGenerator.generateText(request)).rejects.toThrow(
      'OpenAI did not return any text in the first choice.'
    );
  });

  it('creates Anthropic requests with a top-level system prompt', async () => {
    const fetchMock = vi.fn<FetchMock>(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = parseRequestBody<{
          readonly system?: string;
          readonly messages: readonly {
            readonly role: string;
            readonly content: string;
          }[];
          readonly max_tokens: number;
        }>(init);

        expect(body.system).toBe('Keep answers focused on support.');
        expect(body.messages).toEqual([
          {
            role: 'user',
            content: 'How do I reset my password?',
          },
        ]);
        expect(body.max_tokens).toBe(256);

        return Promise.resolve(
          new Response(
            JSON.stringify({
              content: [
                {
                  type: 'text',
                  text: 'Use the reset password link.',
                },
              ],
              stop_reason: 'end_turn',
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
    const generator = createAnthropicTextGenerator({
      apiKey: 'anthropic-test-key',
      fetch: fetchMock,
    });

    await expect(
      generator.generateText({
        messages: [
          {
            role: 'system',
            content: 'Keep answers focused on support.',
          },
          {
            role: 'user',
            content: 'How do I reset my password?',
          },
        ],
        maxOutputTokens: 256,
      })
    ).resolves.toEqual({
      text: 'Use the reset password link.',
      finishReason: 'end_turn',
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.anthropic.com/v1/messages'
    );
    expect(new Headers(requestInit?.headers).get('x-api-key')).toBe(
      'anthropic-test-key'
    );
    expect(new Headers(requestInit?.headers).get('anthropic-version')).toBe(
      '2023-06-01'
    );
  });

  it('surfaces Anthropic provider errors', async () => {
    const fetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: 'Anthropic denied the request',
            },
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );
    const generator = createAnthropicTextGenerator({
      apiKey: 'anthropic-test-key',
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
    ).rejects.toThrow('Anthropic denied the request');
  });

  it('creates Gemini generateContent requests with systemInstruction', async () => {
    const fetchMock = vi.fn<FetchMock>(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = parseRequestBody<{
          readonly contents: readonly {
            readonly role: string;
            readonly parts: readonly {
              readonly text: string;
            }[];
          }[];
          readonly systemInstruction?: {
            readonly parts: readonly {
              readonly text: string;
            }[];
          };
          readonly generationConfig?: {
            readonly maxOutputTokens?: number;
          };
        }>(init);

        expect(body.systemInstruction?.parts[0]?.text).toBe(
          'Answer as a concise product assistant.'
        );
        expect(body.contents).toEqual([
          {
            role: 'user',
            parts: [
              {
                text: 'Tell me about your billing plan.',
              },
            ],
          },
        ]);
        expect(body.generationConfig?.maxOutputTokens).toBe(128);

        return Promise.resolve(
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: 'Our billing plan renews monthly.',
                      },
                    ],
                  },
                  finishReason: 'STOP',
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
        );
      }
    );
    const generator = createGeminiTextGenerator({
      apiKey: 'gemini-test-key',
      fetch: fetchMock,
      model: 'gemini-2.5-flash',
    });

    await expect(
      generator.generateText({
        messages: [
          {
            role: 'system',
            content: 'Answer as a concise product assistant.',
          },
          {
            role: 'user',
            content: 'Tell me about your billing plan.',
          },
        ],
        maxOutputTokens: 128,
      })
    ).resolves.toEqual({
      text: 'Our billing plan renews monthly.',
      finishReason: 'STOP',
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    );
    expect(new Headers(requestInit?.headers).get('x-goog-api-key')).toBe(
      'gemini-test-key'
    );
  });

  it('surfaces Gemini provider errors and empty responses', async () => {
    const errorFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: 'Gemini rejected the request',
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
    const emptyFetchMock = vi.fn<FetchMock>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [],
                },
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
    const request: GenerateTextRequest = {
      messages: [
        {
          role: 'user',
          content: 'Hello',
        },
      ],
    };

    await expect(
      createGeminiTextGenerator({
        apiKey: 'gemini-test-key',
        fetch: errorFetchMock,
      }).generateText(request)
    ).rejects.toThrow('Gemini rejected the request');
    await expect(
      createGeminiTextGenerator({
        apiKey: 'gemini-test-key',
        fetch: emptyFetchMock,
      }).generateText(request)
    ).rejects.toThrow('Gemini did not return any text content.');
  });
});
