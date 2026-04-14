/**
 * Roles supported by the package-level text generation contract.
 */
export type LlmRole = 'system' | 'user' | 'assistant';

/**
 * Text-only message shape passed to the provider adapters.
 */
export interface LlmMessage {
  readonly role: LlmRole;
  readonly content: string;
}

/**
 * Common request fields supported by the built-in providers.
 */
export interface GenerateTextRequest {
  readonly messages: readonly LlmMessage[];
  readonly maxOutputTokens?: number | undefined;
  readonly stopSequences?: readonly string[] | undefined;
  readonly temperature?: number | undefined;
  readonly topP?: number | undefined;
  readonly signal?: AbortSignal | undefined;
}

/**
 * Normalized text generation response returned by all providers.
 */
export interface GeneratedTextResult {
  readonly text: string;
  readonly finishReason?: string | undefined;
}

/**
 * Generic text generation contract used by the chat responder helper.
 */
export interface TextGenerator {
  readonly generateText: (
    request: GenerateTextRequest
  ) => Promise<GeneratedTextResult>;
}

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

interface SplitSystemPromptResult {
  readonly messages: readonly LlmMessage[];
  readonly systemPrompt?: string | undefined;
}

export function splitSystemPrompt(
  messages: readonly LlmMessage[]
): SplitSystemPromptResult {
  const systemPrompts = messages
    .filter(message => message.role === 'system')
    .map(message => message.content.trim())
    .filter(Boolean);
  const conversationalMessages = messages.filter(
    message => message.role !== 'system'
  );

  if (systemPrompts.length === 0) {
    return {
      messages: conversationalMessages,
    };
  }

  return {
    messages: conversationalMessages,
    systemPrompt: systemPrompts.join('\n\n'),
  };
}

export function getFetchImplementation(fetchImpl?: FetchLike): FetchLike {
  const resolvedFetch = fetchImpl ?? globalThis.fetch;

  if (!resolvedFetch) {
    throw new Error(
      'No fetch implementation was available for the text generation request.'
    );
  }

  return resolvedFetch;
}

export async function parseJsonResponse<T>(
  response: Response
): Promise<T | null> {
  const responseText = await response.text();

  if (responseText.trim() === '') {
    return null;
  }

  return JSON.parse(responseText) as T;
}

export function extractProviderErrorMessage(
  data: unknown,
  fallbackMessage: string
): string {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    data.error &&
    typeof data.error === 'object' &&
    'message' in data.error &&
    typeof data.error.message === 'string'
  ) {
    return data.error.message;
  }

  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return fallbackMessage;
}
