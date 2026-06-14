import type { FetchLike } from '../shared';

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
