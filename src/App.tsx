import type { Message } from './js/types';
import { Chat } from './components/Chat';
import { useChatStore } from './lib/chatStore';
import { useMemo } from 'react';

function App(): React.JSX.Element {
  const { addMessage } = useChatStore();

  const repeatMsg = (content: string) =>
  {
    addMessage({
      type: 'agent',
      content: content,
      userResponseCallback: () => repeatMsg(content),
    });
  }

  // Memoize initial messages so the userResponseCallback is stable and doesn't retrigger on every render,
  // and avoids calling useChatStore inside the callback directly (prevents update depth errors)
  const INITIAL_MESSAGES: readonly Message[] = useMemo(() => [
    {
      id: 1,
      type: 'agent',
      content: 'Hello! How can I help you today?',
      timestamp: new Date(),
      userResponseCallback: () => {
        // Call addMessage without causing a render loop
        addMessage({
          type: 'agent',
          content: 'We\'re busy right now. Please try again later.',
          userResponseCallback: () => repeatMsg('We\'re busy right now. Please try again later.'),
        });
      }
    }
  ], [addMessage]);

  return (
    <div className="min-h-screen bg-background">
      <Chat initialMessages={INITIAL_MESSAGES} theme="dark" />
    </div>
  );
}

export default App;
