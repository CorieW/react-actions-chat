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

export interface AnthropicTextGeneratorConfig {
  readonly apiKey: string;
  readonly model?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly version?: string | undefined;
  readonly defaultMaxOutputTokens?: number | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly fetch?: FetchLike | undefined;
}

interface AnthropicMessagesResponse {
  readonly content?: readonly {
    readonly text?: string;
    readonly type?: string;
  }[];
  readonly error?: {
    readonly message?: string;
  };
  readonly stop_reason?: string;
}

const DEFAULT_ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5';
const DEFAULT_ANTHROPIC_MAX_OUTPUT_TOKENS = 512;
const DEFAULT_ANTHROPIC_VERSION = '2023-06-01';

function getAnthropicTextContent(
  response: AnthropicMessagesResponse
): GeneratedTextResult {
  const text = response.content
    ?.filter(part => part.type === 'text' && typeof part.text === 'string')
    .map(part => part.text)
    .join('');

  if (!text || text.trim() === '') {
    throw new Error('Anthropic did not return any text content.');
  }

  return {
    text,
    finishReason: response.stop_reason,
  };
}

/**
 * Creates a text generator backed by Anthropic's messages API.
 */
export function createAnthropicTextGenerator(
  config: AnthropicTextGeneratorConfig
): TextGenerator {
  const {
    apiKey,
    baseUrl = DEFAULT_ANTHROPIC_BASE_URL,
    defaultMaxOutputTokens = DEFAULT_ANTHROPIC_MAX_OUTPUT_TOKENS,
    fetch: fetchImpl,
    headers,
    model = DEFAULT_ANTHROPIC_MODEL,
    version = DEFAULT_ANTHROPIC_VERSION,
  } = config;
  const requestFetch = getFetchImplementation(fetchImpl);
  const messagesUrl = `${baseUrl.replace(/\/$/, '')}/messages`;

  return {
    generateText: async (
      request: GenerateTextRequest
    ): Promise<GeneratedTextResult> => {
      const { messages, systemPrompt } = splitSystemPrompt(request.messages);
      const response = await requestFetch(messagesUrl, {
        method: 'POST',
        headers: {
          'anthropic-version': version,
          'content-type': 'application/json',
          'x-api-key': apiKey,
          ...headers,
        },
        body: JSON.stringify({
          model,
          max_tokens: request.maxOutputTokens ?? defaultMaxOutputTokens,
          messages: messages.map(message => ({
            role: message.role,
            content: message.content,
          })),
          ...(systemPrompt ? { system: systemPrompt } : {}),
          ...(request.stopSequences && request.stopSequences.length > 0
            ? { stop_sequences: request.stopSequences }
            : {}),
          ...(request.temperature !== undefined
            ? { temperature: request.temperature }
            : {}),
          ...(request.topP !== undefined ? { top_p: request.topP } : {}),
        }),
        ...(request.signal ? { signal: request.signal } : {}),
      });
      const data = await parseJsonResponse<AnthropicMessagesResponse>(response);

      if (!response.ok) {
        throw new Error(
          extractProviderErrorMessage(
            data,
            `Anthropic text generation request failed with status ${response.status}.`
          )
        );
      }

      if (!data) {
        throw new Error('Anthropic returned an empty response body.');
      }

      return getAnthropicTextContent(data);
    },
  };
}
