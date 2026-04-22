import React from 'react';
import type { ChatTheme, Message, MessagePart } from '../../../js/types';
import { FilePart } from './FilePart';
import { ImagePart } from './ImagePart';
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
  part: MessagePart,
  index: number,
  message: Message,
  theme: ChatTheme
): React.JSX.Element | null {
  switch (part.type) {
    case 'text':
      return (
        <TextPart
          key={part.id ?? `text-${index}`}
          part={part}
          message={message}
          theme={theme}
        />
      );
    case 'image':
      return (
        <ImagePart
          key={part.id ?? `image-${index}`}
          part={part}
          message={message}
          theme={theme}
        />
      );
    case 'file':
      return (
        <FilePart
          key={part.id ?? `file-${index}`}
          part={part}
          message={message}
          theme={theme}
        />
      );
  }
}
