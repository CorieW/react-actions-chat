import type { Message } from '../js/types';

/**
 * Returns whether any visible message button is currently blocking free-form input.
 *
 * @param messages Chat transcript to inspect.
 */
export function hasInputBlockingButtons(
  messages: readonly Pick<Message, 'buttons'>[]
): boolean {
  return messages.some(
    message =>
      message.buttons?.some(button => button.blocksInputWhileVisible) ?? false
  );
}
