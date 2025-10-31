import type { Message, ChatTheme, MessageButtonVariant } from '../js/types';
import { cn } from '../lib/utils';

interface MessageButtonsProps {
  readonly buttons: Message['buttons'];
  readonly messageType: Message['type'];
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
    case 'default':
    default:
      return {
        backgroundColor: DEFAULT_BACKGROUND,
        color: DEFAULT_COLOR,
      };
  }
}

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
      className={`flex flex-wrap gap-2 mt-2 ${
        messageType === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {buttons.map((button, index) => {
        const variant = button.variant ?? 'default';
        const variantStyles = getButtonVariantStyles(variant, theme);
        // Merge variant styles with custom styles (custom styles override variant)
        const buttonStyles = { ...variantStyles, ...button.style };
        const baseClassName =
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
        const buttonClassName = cn(baseClassName, button.className);
        return (
          <button
            key={index}
            onClick={button.onClick}
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
