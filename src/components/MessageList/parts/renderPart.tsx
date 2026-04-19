import React from 'react';
import type { ChatTheme, Message, TextMessagePart } from '../../../js/types';
import { TextPart } from './TextPart';

/**
 * Renders one built-in message part.
 *
 * @param part Part to render.
 * @param index Part index within the parent message.
 * @param message Parent message.
 * @param theme Active chat theme.
 */
export function renderPart(
  part: TextMessagePart,
  index: number,
  message: Message,
  theme: ChatTheme
): React.JSX.Element | null {
  return (
    <TextPart
      key={part.id ?? `text-${index}`}
      part={part}
      message={message}
      theme={theme}
    />
  );
}
