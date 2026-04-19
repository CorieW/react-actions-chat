import React from 'react';
import type { ChatTheme, TextMessagePart } from '../../../js/types';

/**
 * Props for rendering a plain text part.
 */
interface PlainTextFormatterProps {
  readonly part: TextMessagePart;
  readonly theme: ChatTheme;
}

/**
 * Renders plain text exactly as supplied.
 *
 * @param props The `PlainTextFormatterProps` object.
 */
export function PlainTextFormatter({
  part,
}: PlainTextFormatterProps): React.JSX.Element {
  return (
    <p
      className='text-sm leading-relaxed'
      style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
    >
      {part.text}
    </p>
  );
}
