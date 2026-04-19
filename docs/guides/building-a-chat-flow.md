# Build a Chat Flow

This guide covers the core conversation model behind `react-actions-chat`.

## Core Pieces

- [`Chat`](../components/chat.md) renders the transcript and shared input experience
- [`InputMessage`](../types/input-message.md) is the shape you pass into `initialMessages` or `useChatStore().addMessage(...)`
- `MessagePart` makes message content explicit and extensible
- `userResponseCallback` lets an assistant message react to the next user submission

## Start With Seed Messages

```tsx typecheck
import { Chat, createTextPart, type InputMessage } from 'react-actions-chat';
import 'react-actions-chat/styles';

const initialMessages: readonly InputMessage[] = [
  {
    type: 'other',
    parts: [
      createTextPart('Hello! I can help with orders, billing, or shipping.'),
    ],
  },
];

export function App() {
  return (
    <Chat
      initialMessages={initialMessages}
      allowFreeTextInput
    />
  );
}
```

## Add Action Buttons

```tsx typecheck
import {
  Chat,
  createButton,
  createTextPart,
  useChatStore,
} from 'react-actions-chat';

function addWelcomeMessage() {
  useChatStore.getState().addMessage({
    type: 'other',
    parts: [createTextPart('What do you need help with?')],
    buttons: [
      createButton({
        label: 'Billing help',
        onClick: () => {
          useChatStore.getState().addMessage({
            type: 'other',
            parts: [
              createTextPart('I can explain charges, invoices, or renewals.'),
            ],
          });
        },
      }),
    ],
  });
}
```

## Handle Free-Form Follow-Ups

Use `allowFreeTextInput` when your flow should keep the chat box available between assistant turns. For guided steps where the assistant should explicitly request the next value, prefer `createRequestInputButtonDef(...)` instead.

```tsx
useChatStore.getState().addMessage({
  type: 'other',
  parts: [createTextPart('Ask me a question about your order.')],
  userResponseCallback: () => {
    const messages = useChatStore.getState().getMessages();
    const lastSelfMessage = [...messages]
      .reverse()
      .find(message => message.type === 'self');

    if (!lastSelfMessage) {
      return;
    }

    useChatStore.getState().addMessage({
      type: 'other',
      parts: [createTextPart(`You asked: ${lastSelfMessage.rawContent}`)],
    });
  },
});
```

Use `rawContent` when you need the real submitted value. That matters for flows such as password inputs, where the visible transcript may be masked.
