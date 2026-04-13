# `Chat`

`Chat` is the main public component in `actionable-support-chat`.

It renders three major areas:

- the transcript
- the persistent action bar
- the shared input field

## Basic Usage

```tsx
import { Chat, type InputMessage } from 'actionable-support-chat';
import 'actionable-support-chat/styles';

const initialMessages: readonly InputMessage[] = [
  {
    type: 'other',
    content: 'Hello! How can I help you today?',
  },
];

export function App() {
  return (
    <Chat
      initialMessages={initialMessages}
      theme='dark'
    />
  );
}
```

## Props

### `initialMessages`

Optional seed messages shown when the component first mounts.

Notes:

- it accepts `readonly InputMessage[]`
- messages are added into the shared chat store on mount
- if `initialMessages` is present, the component clears the existing transcript before adding them

### `theme`

Controls the visual style of the chat.

Accepted values:

- `'dark'`
- `'light'`
- a `ChatTheme` object

Custom theme objects are merged over the built-in dark theme, so partial theme objects still inherit defaults.

## What `Chat` Handles For You

The component wires together the public stores and UI pieces so your app does not need to manually assemble them:

- reads and renders `useChatStore()` messages
- shows a loading bubble when the store is in loading mode
- renders buttons attached to the current assistant message
- renders persistent buttons from `usePersistentButtonStore()`
- routes the shared input through `useInputFieldStore()`
- masks visible user content when the input type is `password`

## Conversation Model

When the user submits text:

1. `Chat` reads the current shared input value
2. it adds a `self` message to the transcript
3. if the previous assistant message had a `userResponseCallback`, that callback runs

That model is what makes the library's chat-like follow-up interactions work without each screen needing its own custom form state.

## Related Exports

`Chat` is the main component, but these supporting exports are useful for advanced interactions:

- `useChatStore`
- `useInputFieldStore`
- `usePersistentButtonStore`
- `LIGHT_THEME`
- `DARK_THEME`

## See Also

- [Types overview](../types/index.md)
- [Stores overview](../stores/index.md)
- [`useChatStore`](../stores/use-chat-store.md)
- [`useInputFieldStore`](../stores/use-input-field-store.md)
- [`usePersistentButtonStore`](../stores/use-persistent-button-store.md)
- [Build a chat conversation](../guides/building-a-chat-conversation.md)
- [Plain message buttons](./plain-message-buttons.md)
- [Input-request buttons](./input-request-buttons.md)
- [Core API reference](../reference/core-api.md)
