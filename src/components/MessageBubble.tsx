import type { ChatTheme, Message } from '../js/types';
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
      className={`flex gap-3 mb-1 ${
        message.type === 'self' ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div className='max-w-[85%]'>
        <div
          className={`rounded-lg px-4 py-3 shadow-sm ${
            message.type === 'self' ? 'ml-auto' : 'mr-auto'
          }`}
          style={{
            background:
              message.type === 'self'
                ? `${theme.primaryColor}ee`
                : `${theme.secondaryColor}f5`,
            color:
              message.type === 'self' ? theme.buttonTextColor : theme.textColor,
            maxWidth: message.type === 'self' ? 'fit-content' : '100%',
          }}
        >
          <p
            data-testid='chat-message-content'
            className='text-sm leading-relaxed wrap-break-words'
          >
            {message.content}
          </p>
          <span
            className='block mt-1.5 text-xs'
            style={{
              color:
                message.type === 'self'
                  ? `${theme.buttonTextColor}70`
                  : `${theme.textColor}60`,
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
