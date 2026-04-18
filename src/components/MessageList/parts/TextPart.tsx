import React from 'react';
import type {
  MessagePartRendererProps,
  TextMessagePart,
} from '../../../js/types';
import { FormattedTextPart } from '../../Message/formatters/FormattedTextPart';

/**
 * Renders a text message part using the built-in formatter registry.
 *
 * @param props The `MessagePartRendererProps<TextMessagePart>` object.
 */
export function TextPart({
  part,
  theme,
}: MessagePartRendererProps<TextMessagePart>): React.JSX.Element {
  return (
    <FormattedTextPart
      part={part}
      theme={theme}
    />
  );
}
