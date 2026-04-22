# `Chat`

`Chat` is the main public component in `react-actions-chat`.

It composes:

- `MessageList`
- persistent actions
- `InputBar`

## Basic Usage

```tsx typecheck
import { Chat, createTextPart, type InputMessage } from 'react-actions-chat';
import 'react-actions-chat/styles';

const initialMessages: readonly InputMessage[] = [
  {
    type: 'other',
    parts: [createTextPart('Hello! How can I help you today?')],
  },
];

export function App() {
  return (
    <Chat
      initialMessages={initialMessages}
      theme='dark'
      allowFreeTextInput
    />
  );
}
```

## What `Chat` Handles For You

- reads and renders `useChatStore()` messages
- shows a loading bubble when the store is in loading mode
- renders buttons attached to the current assistant message
- renders persistent buttons from `usePersistentButtonStore()`
- routes the shared input and optional uploads through `useInputFieldStore()`
- masks visible user text when the active input type is `password`

By default, `Chat` keeps the shared input disabled until an input-request flow enables it. Set `allowFreeTextInput` when your assistant should accept open-ended typing at all times.

## Conversation Model

When the user submits text and/or files:

1. `Chat` reads the current shared input submission, including any selected files
2. it adds a `self` message with built-in text, image, and file parts as needed
3. if the previous assistant message had a `userResponseCallback`, that callback runs with the submitted `text` and `files`
