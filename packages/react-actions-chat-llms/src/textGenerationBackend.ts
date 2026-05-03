import {
  type FetchLike,
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
} from './shared';

/**
 * Chat role values accepted by the text-generation backend contract.
 */
export type LLMMessageRole = 'assistant' | 'developer' | 'system' | 'user';

/**
 * Single message sent to a text-generation backend.
 */
export interface LLMMessage {
  /**
   * LLM chat role assigned to this message.
   */
  readonly role: LLMMessageRole;
  /**
   * Text content sent to or returned from the LLM.
   */
  readonly content: string;
}

/**
 * Normalized text returned by a text-generation backend.
 */
export interface GeneratedText {
  /**
   * Text content carried by this value.
   */
  readonly text: string;
}

/**
 * Request payload sent to a text-generation backend.
 */
export interface GenerateTextRequest {
  /**
   * Messages associated with the transcript or support record.
   */
  readonly messages: readonly LLMMessage[];
  /**
   * Maximum number of tokens the backend should generate.
   */
  readonly maxOutputTokens?: number | undefined;
  /**
   * Abort signal forwarded to the generation request.
   */
  readonly signal?: AbortSignal | undefined;
}

/**
 * Client contract for objects that can generate assistant text.
 */
export interface TextGenerator {
  /**
   * Generates text for a request.
   *
   * @param request - Request payload for text generation.
   */
  readonly generateText: (
    request: GenerateTextRequest
  ) => Promise<GeneratedText>;
}

/**
 * Readonly header map sent with text-generation backend requests.
 */
type BackendHeaders = Readonly<Record<string, string>>;

/**
 * Configuration for the browser-side text-generation backend client.
 */
export interface TextGenerationBackendConfig {
  /**
   * URL for the file or image asset.
   */
  readonly url: string;
  /**
   * Fetch credentials mode used for backend requests.
   */
  readonly credentials?: RequestCredentials | undefined;
  /**
   * Handles headers.
   *
   * @param request - Request payload for text generation.
   */
  readonly headers?:
    | BackendHeaders
    | ((
        request: Omit<GenerateTextRequest, 'signal'>
      ) => BackendHeaders | Promise<BackendHeaders>)
    | undefined;
  /**
   * Fetch implementation used for HTTP requests.
   */
  readonly fetch?: FetchLike | undefined;
}

/**
 * Response shape expected from a text-generation backend route.
 */
interface TextGenerationBackendResponse {
  /**
   * Text content carried by this value.
   */
  readonly text?: string;
  /**
   * Error value raised by the operation.
   */
  readonly error?: {
    /**
     * Message object handled by this contract.
     */
    readonly message?: string;
  };
  /**
   * Message object handled by this contract.
   */
  readonly message?: string;
}

/**
 * Removes the AbortSignal before serializing a backend request body.
 *
 * @param request - Request payload being sent or normalized.
 */
function getRequestWithoutSignal(
  request: GenerateTextRequest
): Omit<GenerateTextRequest, 'signal'> {
  const { signal: _signal, ...requestWithoutSignal } = request;
  return requestWithoutSignal;
}

/**
 * Creates a text generation backend.
 *
 * @param config - Backend URL, headers, credentials, and optional fetch implementation.
 */
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
