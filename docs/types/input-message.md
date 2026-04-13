# `InputMessage`

`InputMessage` is the message shape you pass into `initialMessages` and `useChatStore().addMessage(...)`.

## Fields

- `id?`
- `type: 'self' | 'other'`
- `content`
- `rawContent?`
- `timestamp?`
- `isLoading?`
- `loadingLabel?`
- `userResponseCallback?`
- `buttons?`

## Usage

```tsx
import type { InputMessage } from 'react-actions-chat';

const initialMessages: readonly InputMessage[] = [
  {
    type: 'other',
    content: 'Hello! How can I help you today?',
  },
];
```

## Notes

- `rawContent` is useful when the visible transcript content is transformed, such as password masking
- `buttons` attaches actions under the message
- `userResponseCallback` lets the message react to the next user submission
