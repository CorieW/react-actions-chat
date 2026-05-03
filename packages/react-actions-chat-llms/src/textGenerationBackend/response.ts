import { extractProviderErrorMessage } from '../shared';
import type { GeneratedText } from './types';

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
 * Returns whether a parsed payload contains generated text.
 *
 * @param data - Parsed response body returned by the backend.
 */
function hasGeneratedText(
  data: unknown
): data is TextGenerationBackendResponse & { readonly text: string } {
  return (
    data !== null &&
    typeof data === 'object' &&
    'text' in data &&
    typeof data.text === 'string'
  );
}

/**
 * Creates an error for a non-OK text-generation backend response.
 *
 * @param data - Parsed response body returned by the backend.
 * @param status - HTTP status code returned by the backend.
 */
export function createTextGenerationBackendError(
  data: unknown,
  status: number
): Error {
  return new Error(
    extractProviderErrorMessage(
      data,
      `Text generation backend request failed with status ${status}.`
    )
  );
}

/**
 * Validates and normalizes a successful backend response.
 *
 * @param data - Parsed response body returned by the backend.
 */
export function normalizeTextGenerationBackendResponse(
  data: unknown
): GeneratedText {
  if (!hasGeneratedText(data)) {
    throw new Error(
      'The text generation backend did not return a valid response.'
    );
  }

  return {
    text: data.text,
  };
}
