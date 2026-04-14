import { describe, expect, it, vi } from 'vitest';
import {
  executeTextGenerationApiRequest,
  handleTextGenerationApiRequest,
  parseTextGenerationApiRequest,
} from 'react-actions-chat-llms';
import type { TextGenerator } from 'react-actions-chat-llms';

describe('text generation API helpers', () => {
  it('validates and normalizes request bodies', () => {
    expect(
      parseTextGenerationApiRequest({
        messages: [
          {
            role: 'system',
            content: 'Be concise.',
          },
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        maxOutputTokens: 200,
        stopSequences: ['DONE'],
        temperature: 0.5,
        topP: 0.8,
      })
    ).toEqual({
      messages: [
        {
          role: 'system',
          content: 'Be concise.',
        },
        {
          role: 'user',
          content: 'Hello',
        },
      ],
      maxOutputTokens: 200,
      stopSequences: ['DONE'],
      temperature: 0.5,
      topP: 0.8,
    });

    expect(() =>
      parseTextGenerationApiRequest({
        messages: 'nope',
      })
    ).toThrow(
      'Text generation request body must include a valid messages array.'
    );
  });

  it('executes validated requests with the provided generator', async () => {
    const generateText = vi.fn(() =>
      Promise.resolve({
        text: 'Server reply',
      })
    );

    await expect(
      executeTextGenerationApiRequest(
        {
          messages: [
            {
              role: 'user',
              content: 'Hello',
            },
          ],
        },
        {
          generator: {
            generateText,
          },
        }
      )
    ).resolves.toEqual({
      text: 'Server reply',
    });

    expect(generateText).toHaveBeenCalledWith({
      messages: [
        {
          role: 'user',
          content: 'Hello',
        },
      ],
    });
  });

  it('handles POST requests and returns normalized JSON responses', async () => {
    const generateText = vi.fn(() =>
      Promise.resolve({
        text: 'Backend reply',
        finishReason: 'stop',
      })
    );
    const response = await handleTextGenerationApiRequest(
      new Request('https://example.com/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Hello',
            },
          ],
          maxOutputTokens: 90,
        }),
      }),
      {
        generator: {
          generateText,
        },
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      text: 'Backend reply',
      finishReason: 'stop',
    });
    expect(generateText).toHaveBeenCalledWith({
      messages: [
        {
          role: 'user',
          content: 'Hello',
        },
      ],
      maxOutputTokens: 90,
      signal: expect.any(AbortSignal),
    });
  });

  it('rejects invalid methods and invalid JSON bodies', async () => {
    const generator: TextGenerator = {
      generateText: () => Promise.resolve({ text: 'unused' }),
    };

    const methodResponse = await handleTextGenerationApiRequest(
      new Request('https://example.com/api/llm', {
        method: 'GET',
      }),
      {
        generator,
      }
    );
    const jsonResponse = await handleTextGenerationApiRequest(
      new Request('https://example.com/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{not-valid-json',
      }),
      {
        generator,
      }
    );

    expect(methodResponse.status).toBe(405);
    await expect(methodResponse.json()).resolves.toEqual({
      error: {
        message: 'Method not allowed. Use POST for text generation requests.',
      },
    });
    expect(jsonResponse.status).toBe(400);
    await expect(jsonResponse.json()).resolves.toEqual({
      error: {
        message: 'Text generation request body must be valid JSON.',
      },
    });
  });

  it('returns validation and server errors with normalized error payloads', async () => {
    const validationResponse = await handleTextGenerationApiRequest(
      new Request('https://example.com/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [],
          maxOutputTokens: 0,
        }),
      }),
      {
        generator: {
          generateText: () => Promise.resolve({ text: 'unused' }),
        },
      }
    );
    const providerErrorResponse = await handleTextGenerationApiRequest(
      new Request('https://example.com/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Hello',
            },
          ],
        }),
      }),
      {
        generator: {
          generateText: () => Promise.reject(new Error('Provider failed')),
        },
      }
    );
    const customErrorResponse = await handleTextGenerationApiRequest(
      new Request('https://example.com/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Hello',
            },
          ],
        }),
      }),
      {
        generator: {
          generateText: () => Promise.reject(new Error('Provider failed')),
        },
        onError: async error => ({
          message:
            error instanceof Error
              ? `Custom: ${error.message}`
              : 'Custom error',
          status: 502,
        }),
      }
    );

    expect(validationResponse.status).toBe(400);
    await expect(validationResponse.json()).resolves.toEqual({
      error: {
        message:
          'Text generation request body must include a valid messages array.',
      },
    });
    expect(providerErrorResponse.status).toBe(500);
    await expect(providerErrorResponse.json()).resolves.toEqual({
      error: {
        message: 'Provider failed',
      },
    });
    expect(customErrorResponse.status).toBe(502);
    await expect(customErrorResponse.json()).resolves.toEqual({
      error: {
        message: 'Custom: Provider failed',
      },
    });
  });
});
