import React from 'react';
import type { ChatTheme, TextMessagePart } from '../../../js/types';

/**
 * Props for rendering a plain text part.
 */
interface PlainTextFormatterProps {
  /**
   * Message part rendered by this component.
   */
  readonly part: TextMessagePart;
  /**
   * Theme tokens used to style the rendered UI.
   */
  readonly theme: ChatTheme;
}

/**
 * Renders plain text exactly as supplied.
 *
 * @param props - The `PlainTextFormatterProps` object.
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
