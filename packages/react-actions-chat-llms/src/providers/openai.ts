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

export interface OpenAITextGeneratorConfig {
  readonly apiKey: string;
  readonly model?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly organization?: string | undefined;
  readonly project?: string | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly fetch?: FetchLike | undefined;
}

interface OpenAIChatCompletionsResponse {
  readonly choices?: readonly {
    readonly finish_reason?: string;
    readonly message?: {
      readonly content?:
        | string
        | readonly {
            readonly text?: string;
            readonly type?: string;
          }[];
    };
  }[];
  readonly error?: {
    readonly message?: string;
  };
}

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

function getOpenAITextContent(
  response: OpenAIChatCompletionsResponse
): GeneratedTextResult {
  const choice = response.choices?.[0];
  const content = choice?.message?.content;

  if (typeof content === 'string' && content.trim() !== '') {
    return {
      text: content,
      finishReason: choice?.finish_reason,
    };
  }

  if (Array.isArray(content)) {
    const text = content
      .filter(part => part.type === 'text' && typeof part.text === 'string')
      .map(part => part.text)
      .join('');

    if (text.trim() !== '') {
      return {
        text,
        finishReason: choice?.finish_reason,
      };
    }
  }

  throw new Error('OpenAI did not return any text in the first choice.');
}

/**
 * Creates a text generator backed by OpenAI's chat completions API.
 */
export function createOpenAITextGenerator(
  config: OpenAITextGeneratorConfig
): TextGenerator {
  const {
    apiKey,
    baseUrl = DEFAULT_OPENAI_BASE_URL,
    fetch: fetchImpl,
    headers,
    model = DEFAULT_OPENAI_MODEL,
    organization,
    project,
  } = config;
  const requestFetch = getFetchImplementation(fetchImpl);
  const chatCompletionsUrl = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  return {
    generateText: async (
      request: GenerateTextRequest
    ): Promise<GeneratedTextResult> => {
      const { messages, systemPrompt } = splitSystemPrompt(request.messages);
      const response = await requestFetch(chatCompletionsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(organization ? { 'OpenAI-Organization': organization } : {}),
          ...(project ? { 'OpenAI-Project': project } : {}),
          ...headers,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt
              ? [
                  {
                    role: 'developer',
                    content: systemPrompt,
                  } as const,
                ]
              : []),
            ...messages.map(message => ({
              role: message.role,
              content: message.content,
            })),
          ],
          ...(request.maxOutputTokens
            ? { max_completion_tokens: request.maxOutputTokens }
            : {}),
          ...(request.stopSequences && request.stopSequences.length > 0
            ? { stop: request.stopSequences }
            : {}),
          ...(request.temperature !== undefined
            ? { temperature: request.temperature }
            : {}),
          ...(request.topP !== undefined ? { top_p: request.topP } : {}),
        }),
        ...(request.signal ? { signal: request.signal } : {}),
      });
      const data =
        await parseJsonResponse<OpenAIChatCompletionsResponse>(response);

      if (!response.ok) {
        throw new Error(
          extractProviderErrorMessage(
            data,
            `OpenAI text generation request failed with status ${response.status}.`
          )
        );
      }

      if (!data) {
        throw new Error('OpenAI returned an empty response body.');
      }

      return getOpenAITextContent(data);
    },
  };
}
