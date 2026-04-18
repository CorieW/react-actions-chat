# Getting Started

`react-actions-chat` gives you a chat UI plus structured message parts for building guided support flows.

## Install

```bash
npm install react-actions-chat
```

Import the bundled styles anywhere you mount the chat:

```tsx
import 'react-actions-chat/styles';
```

## First Chat

```tsx typecheck
import { Chat, createTextPart } from 'react-actions-chat';
import 'react-actions-chat/styles';

export function App() {
  return (
    <Chat
      theme='dark'
      allowFreeTextInput
      initialMessages={[
        {
          type: 'other',
          parts: [createTextPart('Hello! How can I help you today?')],
        },
      ]}
    />
  );
}
```

`initialMessages` seeds the conversation when the component first mounts. Each message uses structured `parts`, and each message belongs to either the local user (`self`) or the assistant side (`other`).

`Chat` disables the shared input by default so guided request-input flows can take control when needed. Set `allowFreeTextInput` for open-ended bots, or attach input-request buttons when you want the assistant to decide when typing is allowed.

## What To Read Next

- [Components overview](components/index.md)
- [Types overview](types/index.md)
- [Stores overview](stores/index.md)
- [Chat](components/chat.md)
- [Build a chat flow](guides/building-a-chat-flow.md)
- [Using different input types](guides/using-different-input-types.md)
- [Collect input and confirmations](guides/collecting-input-and-confirming-actions.md)
