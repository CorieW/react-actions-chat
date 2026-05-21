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

## Embedded Layout

`Chat` defaults to `layout='viewport'` so existing full-page demos keep the same viewport-height behavior. Use `layout='fill'` when the chat should fit an app panel that already controls its height.

```tsx typecheck
import { Chat } from 'react-actions-chat';

export function SupportPanel() {
  return (
    <section style={{ height: 520, minHeight: 0 }}>
      <Chat
        layout='fill'
        className='h-full min-h-0'
        containerClassName='rounded-lg border'
        contentClassName='px-5'
      />
    </section>
  );
}
```

The root wrapper exposes `data-asc-region='root'`, the themed container exposes `data-asc-region='container'`, the transcript keeps `data-asc-region='transcript'`, and the input area wrapper exposes `data-asc-region='input'`. You can also set `height`, `minHeight`, or the `--asc-chat-height` and `--asc-chat-min-height` CSS variables to tune sizing without reaching into child selectors.

## Conversation Model

When the user submits text and/or files:

1. `Chat` reads the current shared input submission, including any selected files
2. it adds a `self` message with built-in text, image, and file parts as needed
3. if the previous assistant message had a `userResponseCallback`, that callback runs with the submitted `text` and `files`
