# `useChatStore`

`useChatStore` is the shared transcript and loading-state store.

It is the main store to use when you need to read history or add assistant messages programmatically.

## What It Manages

- the current transcript as `readonly Message[]`
- the loading state
- message addition and replacement helpers
- transcript reset and cleanup helpers

## Common Reads

### Read Transcript History

```tsx
import { useChatStore } from 'react-actions-chat';

const messages = useChatStore.getState().getMessages();
const latestMessage = useChatStore.getState().getPreviousMessage();
```

Useful methods:

- `getMessages()`
- `getPreviousMessage()`

## Read the Latest User Submission

When building follow-up flows, you often want the most recent user-authored message:

```tsx
const messages = useChatStore.getState().getMessages();

const lastSelfMessage = [...messages]
  .reverse()
  .find(message => message.type === 'self');
```

This pattern is used by the example apps when an assistant message needs to react to what the user just typed.

## `content` vs `rawContent`

Use `rawContent` when you need the actual submitted value.

That matters most for password flows:

- `content` may be masked in the transcript
- `rawContent` still keeps the real submitted string

For ordinary text flows, `content` and `rawContent` are usually the same.

## Read Message Metadata

Each stored `Message` includes:

- `id`
- `timestamp`
- `type`
- `buttons`

This is useful for analytics, debugging, or custom branching logic.

## Common Writes

Useful methods:

- `addMessage(message)`
- `addMessages(messages)`
- `setMessages(messages)`
- `clearMessages()`
- `clearButtons()`
- `clearPreviousMessageButtons()`
- `clearPreviousMessageCallback()`

## Loading State

The chat store also exposes loading state:

```tsx
const { isLoading } = useChatStore.getState();
```

Useful methods:

- `setLoading(true | false)`
- `clearLoading()`

When `isLoading` is true, `Chat` renders a loading bubble at the bottom of the transcript.
