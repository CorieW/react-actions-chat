import type { ChatTheme, Message } from '../js/types';
import { Avatar } from './ui/avatar';
import { MessageButtons } from './MessageButtons';

interface MessageBubbleProps {
  readonly message: Message;
  readonly theme: ChatTheme;
}

export function MessageBubble({
  message,
  theme,
}: MessageBubbleProps): React.JSX.Element {
  return (
    <div
      className={`flex gap-3 ${
        message.type === 'self' ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div className='shrink-0'>
        <Avatar className='w-8 h-8'>
          <div
            className='flex items-center justify-center w-full h-full text-sm font-medium'
            style={{
              backgroundColor:
                message.type === 'self'
                  ? theme.primaryColor
                  : theme.secondaryColor,
              color:
                message.type === 'self'
                  ? theme.buttonTextColor
                  : theme.textColor,
            }}
          >
            {message.type === 'self' ? 'S' : 'O'}
          </div>
        </Avatar>
      </div>

      {/* Message Bubble */}
      <div className='max-w-[70%]'>
        <div
          className='rounded-lg p-3'
          style={{
            backgroundColor:
              message.type === 'self'
                ? theme.primaryColor
                : theme.secondaryColor,
            color:
              message.type === 'self' ? theme.buttonTextColor : theme.textColor,
          }}
        >
          <p className='text-sm wrap-break-words'>{message.content}</p>
          <span
            className='block mt-1 text-xs'
            style={{
              color:
                message.type === 'self'
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
        <MessageButtons
          buttons={message.buttons}
          messageType={message.type}
          theme={theme}
        />
      </div>
    </div>
  );
}
