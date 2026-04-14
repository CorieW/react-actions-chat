import {
  type FetchLike,
  type GenerateTextRequest,
  type GeneratedTextResult,
  type TextGenerator,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
  splitSystemPrompt,
} from './shared';

export interface GeminiTextGeneratorConfig {
  readonly apiKey: string;
  readonly model?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly fetch?: FetchLike | undefined;
}

interface GeminiGenerateContentResponse {
  readonly candidates?: readonly {
    readonly content?: {
      readonly parts?: readonly {
        readonly text?: string;
      }[];
    };
    readonly finishReason?: string;
  }[];
  readonly error?: {
    readonly message?: string;
  };
}

const DEFAULT_GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function normalizeGeminiModel(model: string): string {
  return model.startsWith('models/') ? model : `models/${model}`;
}

function getGeminiTextContent(
  response: GeminiGenerateContentResponse
): GeneratedTextResult {
  const candidate = response.candidates?.[0];

  if (!candidate) {
    throw new Error('Gemini did not return any text content.');
  }

  const text = candidate?.content?.parts?.map(part => part.text ?? '').join('');

  if (!text || text.trim() === '') {
    throw new Error('Gemini did not return any text content.');
  }

  return {
    text,
    finishReason: candidate.finishReason,
  };
}

/**
 * Creates a text generator backed by the Gemini generateContent API.
 */
export function createGeminiTextGenerator(
  config: GeminiTextGeneratorConfig
): TextGenerator {
  const {
    apiKey,
    baseUrl = DEFAULT_GEMINI_BASE_URL,
    fetch: fetchImpl,
    headers,
    model = DEFAULT_GEMINI_MODEL,
  } = config;
  const requestFetch = getFetchImplementation(fetchImpl);
  const normalizedModel = normalizeGeminiModel(model);
  const generateContentUrl = `${baseUrl.replace(/\/$/, '')}/${normalizedModel}:generateContent`;

  return {
    generateText: async (
      request: GenerateTextRequest
    ): Promise<GeneratedTextResult> => {
      const { messages, systemPrompt } = splitSystemPrompt(request.messages);
      const response = await requestFetch(generateContentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          ...headers,
        },
        body: JSON.stringify({
          contents: messages.map(message => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [
              {
                text: message.content,
              },
            ],
          })),
          ...(systemPrompt
            ? {
                systemInstruction: {
                  parts: [
                    {
                      text: systemPrompt,
                    },
                  ],
                },
              }
            : {}),
          ...(request.maxOutputTokens ||
          request.stopSequences ||
          request.temperature !== undefined ||
          request.topP !== undefined
            ? {
                generationConfig: {
                  ...(request.maxOutputTokens
                    ? { maxOutputTokens: request.maxOutputTokens }
                    : {}),
                  ...(request.stopSequences && request.stopSequences.length > 0
                    ? { stopSequences: request.stopSequences }
                    : {}),
                  ...(request.temperature !== undefined
                    ? { temperature: request.temperature }
                    : {}),
                  ...(request.topP !== undefined ? { topP: request.topP } : {}),
                },
              }
            : {}),
        }),
        ...(request.signal ? { signal: request.signal } : {}),
      });
      const data =
        await parseJsonResponse<GeminiGenerateContentResponse>(response);

      if (!response.ok) {
        throw new Error(
          extractProviderErrorMessage(
            data,
            `Gemini text generation request failed with status ${response.status}.`
          )
        );
      }

      if (!data) {
        throw new Error('Gemini returned an empty response body.');
      }

      return getGeminiTextContent(data);
    },
  };
}
