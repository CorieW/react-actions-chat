import React from 'react';
import type { ChatTheme, MessageButtonVariant } from '../js/types';
import { usePersistentButtonStore } from '../lib';
import { cn } from '../lib/utils';

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
 * Props for the persistent action bar.
 *
 * @property theme Theme tokens used to style the persistent action bar and buttons.
 */
interface PersistentButtonsProps {
  readonly theme: ChatTheme;
}

/**
 * Renders the persistent action buttons shown above the input field.
 *
 * @param props The `PersistentButtonsProps` object.
 */
export function PersistentButtons({
  theme,
}: PersistentButtonsProps): React.JSX.Element | null {
  const buttons = usePersistentButtonStore(state => state.buttons);

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
      className='flex flex-wrap justify-center gap-2 border-t px-4 py-3'
      style={{
        borderColor: `${theme.borderColor}40`,
        backgroundColor: theme.backgroundColor,
      }}
    >
      {buttons.map(button => {
        const variant = button.variant ?? 'default';
        const variantStyles = getButtonVariantStyles(variant, theme);
        // Merge variant styles with custom styles (custom styles override variant)
        const buttonStyles = { ...variantStyles, ...button.style };
        const baseClassName =
          'px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-1';
        const buttonClassName = cn(baseClassName, button.className);
        return (
          <button
            key={button.id}
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
