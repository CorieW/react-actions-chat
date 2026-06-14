import {
  createMarkdownTextPart,
  createTextPart,
  type InputMessage,
} from 'react-actions-chat';
import type { GeneratedText } from '../textGenerationBackend';

/**
 * Default message shown when text generation fails.
 */
const DEFAULT_GENERATION_ERROR_MESSAGE =
  'Something went wrong while contacting the language model. Please try again.';

/**
 * Creates a default assistant message.
 *
 * @param result - Resolver or provider result to normalize.
 */
export function createDefaultAssistantMessage(
  result: GeneratedText
): InputMessage {
  return {
    type: 'other',
    parts: [createMarkdownTextPart(result.text)],
  };
}

/**
 * Creates a default error message.
 */
export function createDefaultErrorMessage(): InputMessage {
  return {
    type: 'other',
    parts: [createTextPart(DEFAULT_GENERATION_ERROR_MESSAGE)],
  };
}
