import type { MessagePart, TextMessagePart } from '../js/types';

/**
 * Concatenates text part content from a message into a plain string.
 *
 * @param parts Message parts to flatten.
 */
export function getMessageRawText(parts: readonly MessagePart[]): string {
  return parts
    .map(part => part.text)
    .filter(value => value.length > 0)
    .join('\n');
}

/**
 * Returns the first text part in a message, if present.
 *
 * @param parts Message parts to inspect.
 */
export function getFirstTextPart(
  parts: readonly MessagePart[]
): TextMessagePart | undefined {
  return parts.find(part => part.type === 'text');
}
