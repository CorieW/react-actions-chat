import type { Message, ChatTheme, MessageButtonVariant } from '../js/types';
import { Avatar } from './ui/avatar';
import { cn } from '../lib/utils';

interface MessageBubbleProps {
  readonly message: Message;
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

export function MessageBubble({
  message,
  theme,
}: MessageBubbleProps): React.JSX.Element {
  return (
    <div
      className={`flex gap-3 ${
        message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div className='shrink-0'>
        <Avatar className='w-8 h-8'>
          <div
            className='flex items-center justify-center w-full h-full text-sm font-medium'
            style={{
              backgroundColor:
                message.type === 'user'
                  ? theme.primaryColor
                  : theme.secondaryColor,
              color:
                message.type === 'user'
                  ? theme.buttonTextColor
                  : theme.textColor,
            }}
          >
            {message.type === 'user' ? 'U' : 'A'}
          </div>
        </Avatar>
      </div>

      {/* Message Bubble */}
      <div className='max-w-[70%]'>
        <div
          className='rounded-lg p-3'
          style={{
            backgroundColor:
              message.type === 'user'
                ? theme.primaryColor
                : theme.secondaryColor,
            color:
              message.type === 'user' ? theme.buttonTextColor : theme.textColor,
          }}
        >
          <p className='text-sm wrap-break-words'>{message.content}</p>
          <span
            className='block mt-1 text-xs'
            style={{
              color:
                message.type === 'user'
                  ? `${theme.buttonTextColor}70`
                  : `${theme.textColor}70`,
            }}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        {/* Message Buttons */}
        {message.buttons && message.buttons.length > 0 && (
          <div
            className={`flex flex-wrap gap-2 mt-2 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.buttons.map((button, index) => {
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
        )}
      </div>
    </div>
  );
}
