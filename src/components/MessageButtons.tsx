import React from 'react';
import type {
  InputMessage,
  ChatTheme,
  MessageButtonVariant,
} from '../js/types';
import { cn } from '../lib/utils';

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
 * Gets button styles based on variant.
 *
 * @param variant The button variant
 * @param theme The current theme
 * @returns Object with backgroundColor and color
 */
function getButtonVariantStyles(
  variant: MessageButtonVariant,
  theme: ChatTheme
): { backgroundColor: string; color: string } {
  const DEFAULT_BACKGROUND = theme.buttonColor ?? '#3b82f6';
  const DEFAULT_COLOR = theme.buttonTextColor ?? '#ffffff';

  switch (variant) {
    case 'success':
      return {
        backgroundColor: '#10b981', // green-500
        color: '#ffffff',
      };
    case 'error':
      return {
        backgroundColor: '#ef4444', // red-500
        color: '#ffffff',
      };
    case 'warning':
      return {
        backgroundColor: '#f59e0b', // amber-500
        color: '#ffffff',
      };
    case 'info':
      return {
        backgroundColor: '#3b82f6', // blue-500
        color: '#ffffff',
      };
    case 'dull':
      return {
        backgroundColor: '#6b7280', // gray-500
        color: '#ffffff',
      };
    case 'default':
    default:
      return {
        backgroundColor: DEFAULT_BACKGROUND,
        color: DEFAULT_COLOR,
      };
  }
}

/**
 * Renders the action buttons attached to a single message.
 *
 * @param props The message button group props.
 */
export function MessageButtons({
  buttons,
  messageType,
  theme,
}: MessageButtonsProps): React.JSX.Element | null {
  if (!buttons || buttons.length === 0) {
    return null;
  }

  const handleButtonClick = (originalOnClick?: () => void): void => {
    if (originalOnClick) {
      originalOnClick();
    }
  };

  return (
    <div
      className={`mt-2 flex flex-wrap gap-2 ${
        messageType === 'self' ? 'justify-end' : 'justify-start'
      }`}
    >
      {buttons.map((button, index) => {
        const variant = button.variant ?? 'default';
        const variantStyles = getButtonVariantStyles(variant, theme);
        // Merge variant styles with custom styles (custom styles override variant)
        const buttonStyles = { ...variantStyles, ...button.style };
        const baseClassName =
          'px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-1';
        const buttonClassName = cn(baseClassName, button.className);
        return (
          <button
            key={index}
            onClick={() => handleButtonClick(button.onClick)}
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
