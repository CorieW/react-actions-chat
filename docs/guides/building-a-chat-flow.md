# Build a Chat Flow

This guide covers the core conversation model behind `actionable-support-chat`.

The best runnable reference in this repo is [examples/qa-bot/App.tsx](https://github.com/CorieW/actionable-support-chat/blob/master/examples/qa-bot/App.tsx).

## Core Pieces

- `Chat` renders the transcript, persistent buttons, and shared input field.
- `InputMessage` is the shape you pass into `initialMessages` or `useChatStore().addMessage(...)`.
- `MessageButton` describes an action shown under an assistant message.
- `userResponseCallback` lets an assistant message react to the next user submission.

## Start With Seed Messages

```tsx
import { Chat, type InputMessage } from 'actionable-support-chat';
import 'actionable-support-chat/styles';

const initialMessages: readonly InputMessage[] = [
  {
    type: 'other',
    content: 'Hello! I can help with orders, billing, or shipping.',
  },
];

export function App() {
  return <Chat initialMessages={initialMessages} />;
}
```

Use `type: 'other'` for assistant-side messages and `type: 'self'` for user-side messages. In most apps you add assistant messages yourself and let the component add user messages when the shared input is submitted.

## Add Action Buttons

```tsx
import { Chat, createButton, useChatStore } from 'actionable-support-chat';

function addWelcomeMessage() {
  useChatStore.getState().addMessage({
    type: 'other',
    content: 'What do you need help with?',
    buttons: [
      createButton({
        label: 'Billing help',
        onClick: () => {
          useChatStore.getState().addMessage({
            type: 'other',
            content: 'I can explain charges, invoices, or renewals.',
          });
        },
      }),
    ],
  });
}
```

Each new message clears buttons from older messages, which keeps the active step focused on the current part of the conversation.

## Handle Free-Form Follow-Ups

`userResponseCallback` is the hook that turns the shared input into a simple conversation loop.

```tsx
useChatStore.getState().addMessage({
  type: 'other',
  content: 'Ask me a question about your order.',
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
      content: `You asked: ${lastSelfMessage.rawContent}`,
    });
  },
});
```

Use `rawContent` when you need the real submitted value. That matters for flows such as password inputs, where the visible transcript may be masked.

## Advanced State Access

`useChatStore` is exported for advanced flows:

- `addMessage` and `addMessages` append assistant or seeded messages
- `getMessages` and `getPreviousMessage` inspect the current transcript
- `setLoading` and `clearLoading` drive async loading states
- `clearMessages`, `clearButtons`, and related helpers reset or trim the conversation

Reach for the store when you need app-driven branching or async coordination. For straightforward static UIs, `initialMessages` plus `createButton` is often enough.

## Related Docs

- [Getting started](../getting-started.md)
- [Collect input and confirmations](collecting-input-and-confirming-actions.md)
- [Core API reference](../reference/core-api.md)
- [Examples guide](../examples.md)
