import React from 'react';
import type { ChatTheme, TextMessagePart } from '../../../js/types';
import { PlainTextFormatter } from './PlainTextFormatter';

/**
 * Props for rendering a text part.
 */
interface FormattedTextPartProps {
  readonly part: TextMessagePart;
  readonly theme: ChatTheme;
}

/**
 * Renders a text part.
 *
 * @param props The `FormattedTextPartProps` object.
 */
export function FormattedTextPart({
  part,
  theme,
}: FormattedTextPartProps): React.JSX.Element {
  return (
    <PlainTextFormatter
      part={part}
      theme={theme}
    />
  );
}
