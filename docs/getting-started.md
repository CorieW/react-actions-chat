# Getting Started

`actionable-support-chat` gives you a chat UI plus the primitives needed to turn messages into guided actions.

## Install

```bash
npm install actionable-support-chat
```

This package targets Node.js `22.13.0+`.

Import the bundled styles anywhere you mount the chat:

```tsx
import 'actionable-support-chat/styles';
```

## First Chat

```tsx
import { Chat } from 'actionable-support-chat';
import 'actionable-support-chat/styles';

export function App() {
  return (
    <Chat
      theme='dark'
      initialMessages={[
        {
          type: 'other',
          content: 'Hello! How can I help you today?',
        },
      ]}
    />
  );
}
```

`initialMessages` seeds the conversation when the component first mounts. Each message is either from the local user (`self`) or the assistant side (`other`).

## What To Read Next

- [Build a chat flow](guides/building-a-chat-flow.md) for the core message model and button patterns
- [Collect input and confirmations](guides/collecting-input-and-confirming-actions.md) for email, password, and confirm/decline flows
- [Theming and styling](guides/theming-and-styling.md) for presets, custom themes, and Vite setup notes
- [Examples guide](examples.md) for runnable demos in this repo

## Companion Package

Install the companion package if you want recommended actions driven by a search query or vector search:

```bash
npm install actionable-support-chat actionable-support-chat-recommended-actions
```

Then continue with [Recommended actions overview](guides/recommended-actions-overview.md).
