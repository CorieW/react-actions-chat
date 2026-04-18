import React from 'react';
import type { ChatTheme, InputMessage } from '../../js/types';
import { cn } from '../../lib/utils';
import { getButtonVariantStyles } from '../shared/buttonVariantStyles';

/**
 * Props for the action buttons shown below a message.
 *
 * @property buttons Action buttons attached to the message.
 * @property messageType Message side used to align the buttons with the bubble.
 * @property theme Theme tokens used to style button colors.
 */
interface MessageButtonsProps {
  readonly buttons: InputMessage['buttons'];
  readonly messageType: InputMessage['type'];
  readonly theme: ChatTheme;
}

/**
 * Renders the action buttons attached to a single message.
 *
 * @param props The `MessageButtonsProps` object.
 */
export function MessageButtons({
  buttons,
  messageType,
  theme,
}: MessageButtonsProps): React.JSX.Element | null {
  if (!buttons || buttons.length === 0) {
    return null;
  }

  return (
    <div
      className={`mt-2 flex flex-wrap gap-2 ${
        messageType === 'self' ? 'justify-end' : 'justify-start'
      }`}
      role='group'
      aria-label='Message actions'
      data-asc-region='message-actions'
    >
      {buttons.map((button, index) => {
        const variant = button.variant ?? 'default';
        const variantStyles = getButtonVariantStyles(variant, theme);
        const buttonStyles = { ...variantStyles, ...button.style };
        const baseClassName =
          'rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-1';
        const buttonClassName = cn(baseClassName, button.className);

        return (
          <button
            key={`${button.label}-${index}`}
            onClick={() => button.onClick?.()}
            className={buttonClassName}
            style={buttonStyles}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
}
