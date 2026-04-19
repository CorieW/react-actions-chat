# `Message`

`Message` is the normalized message shape stored in chat state.

You usually read it back from `useChatStore().getMessages()`.

## What It Guarantees

Compared with `InputMessage`, a stored `Message` always has:

- `id`
- `parts`
- `rawContent`
- `timestamp`

## Usage

```tsx typecheck
import { useChatStore } from 'react-actions-chat';

const messages = useChatStore.getState().getMessages();
```

That returns `readonly Message[]`.

## Common Uses

- reading transcript history
- finding the latest user-authored message
- inspecting `rawContent` for real submitted values
- branching on `type`, `parts`, `buttons`, or `timestamp`
