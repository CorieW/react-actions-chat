import {
  type FetchLike,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from './shared';

export type LLMMessageRole = 'assistant' | 'developer' | 'system' | 'user';

export interface LLMMessage {
  readonly role: LLMMessageRole;
  readonly content: string;
}

export interface GeneratedText {
  readonly text: string;
}

export interface GenerateTextRequest {
  readonly messages: readonly LLMMessage[];
  readonly maxOutputTokens?: number | undefined;
  readonly signal?: AbortSignal | undefined;
}

export interface TextGenerator {
  readonly generateText: (
    request: GenerateTextRequest
  ) => Promise<GeneratedText>;
}

type BackendHeaders = Readonly<Record<string, string>>;

export interface TextGenerationBackendConfig {
  readonly url: string;
  readonly credentials?: RequestCredentials | undefined;
  readonly headers?:
    | BackendHeaders
    | ((
        request: Omit<GenerateTextRequest, 'signal'>
      ) => BackendHeaders | Promise<BackendHeaders>)
    | undefined;
  readonly fetch?: FetchLike | undefined;
}

interface TextGenerationBackendResponse {
  readonly text?: string;
  readonly error?: {
    readonly message?: string;
  };
  readonly message?: string;
}

function getRequestWithoutSignal(
  request: GenerateTextRequest
): Omit<GenerateTextRequest, 'signal'> {
  const { signal: _signal, ...requestWithoutSignal } = request;
  return requestWithoutSignal;
}

export function createTextGenerationBackend(
  config: TextGenerationBackendConfig
): TextGenerator {
  const { credentials, fetch: fetchImpl, headers, url } = config;
  const requestFetch = getFetchImplementation(fetchImpl);

  return {
    generateText: async request => {
      const requestWithoutSignal = getRequestWithoutSignal(request);
      const resolvedHeaders =
        typeof headers === 'function'
          ? await headers(requestWithoutSignal)
          : headers;
      const response = await requestFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...resolvedHeaders,
        },
        ...(credentials ? { credentials } : {}),
        body: JSON.stringify(requestWithoutSignal),
        ...(request.signal ? { signal: request.signal } : {}),
      });
      const data =
        await parseJsonResponse<TextGenerationBackendResponse>(response);

      if (!response.ok) {
        throw new Error(
          extractProviderErrorMessage(
            data,
            `Text generation backend request failed with status ${response.status}.`
          )
        );
      }

      if (!data || typeof data !== 'object' || typeof data.text !== 'string') {
        throw new Error(
          'The text generation backend did not return a valid response.'
        );
      }

      return {
        text: data.text,
      };
    },
  };
}
