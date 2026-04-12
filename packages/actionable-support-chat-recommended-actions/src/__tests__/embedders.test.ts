import { describe, expect, it, vi } from 'vitest';
import {
  createCohereTextEmbedder,
  createOpenAITextEmbedder,
  createVoyageTextEmbedder,
} from 'actionable-support-chat-recommended-actions';

describe('Built-in Embedders', () => {
  it('creates OpenAI embeddings with the expected request shape', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
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
      );
    });
    const embedder = createOpenAITextEmbedder({
      apiKey: 'test-key',
      fetch: fetchMock,
      model: 'text-embedding-3-large',
    });

    await expect(embedder.embedText('hello world')).resolves.toEqual([
      0.1, 0.2, 0.3,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });

  it('creates Cohere embeddings with retrieval-aware input types', async () => {
    const fetchMock = vi.fn(async (_input, init) => {
      const parsedBody = JSON.parse(String(init?.body));
      expect(parsedBody.input_type).toBe('search_query');
      expect(parsedBody.texts).toEqual(['hello world']);

      return new Response(
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
      );
    });
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
    const fetchMock = vi.fn(async (_input, init) => {
      const parsedBody = JSON.parse(String(init?.body));
      expect(parsedBody.input_type).toBe('document');

      return new Response(
        JSON.stringify({
          embeddings: [[0.7, 0.8, 0.9]],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });
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
