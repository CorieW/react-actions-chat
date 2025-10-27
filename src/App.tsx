import type { Message } from './js/types';
import { Chat } from './components/Chat';

const INITIAL_MESSAGES: readonly Message[] = [{
  id: 1,
  type: 'agent',
  content: 'Hello! How can I help you today?',
  timestamp: new Date()
}];

function App(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <Chat initialMessages={INITIAL_MESSAGES} />
    </div>
  );
}

export default App;

