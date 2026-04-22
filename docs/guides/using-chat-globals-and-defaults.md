# Using Chat Globals and Defaults

Use `Chat`'s `globals` prop when multiple request-input flows inside the same chat should share the same defaults.

This is especially useful when most steps in a chat should:

- use the same placeholder or helper text
- share validation, cooldown, or timeout behavior
- consistently show an abort button
- apply a common upload policy

## What `globals` Controls

`globals` is a chat-level configuration object passed directly to `Chat`.

Right now the main supported surface is `requestInputDefaults`, which applies defaults to request-input flows created inside that chat.

Those defaults are used only for request-input buttons. They do not change the behavior of plain message buttons or free-text chat turns.

## Prefer the `globals` Prop

Most apps should set chat-wide defaults with the `globals` prop:

```tsx typecheck
import {
  Chat,
  createButton,
  createRequestInputButtonDef,
  createTextPart,
  type ChatGlobals,
  type InputMessage,
} from 'react-actions-chat';
import 'react-actions-chat/styles';

const globals: ChatGlobals = {
  requestInputDefaults: {
    inputType: 'email',
    placeholder: 'you@example.com',
    inputDescription: 'We use this only for support follow-up.',
    showAbort: true,
    abortLabel: 'Cancel',
    minMessageLength: 5,
  },
};

const followUpEmailButton = createButton(
  createRequestInputButtonDef({
    initialLabel: 'Share contact email',
    inputPromptMessage: 'What email should we use to follow up?',
    onSuccess: value => {
      console.log(value);
    },
  })
);

const callbackNumberButton = createButton(
  createRequestInputButtonDef({
    initialLabel: 'Request phone callback',
    inputPromptMessage: 'Enter the best callback number.',
    inputType: 'tel',
    placeholder: '+1 555 123 4567',
    onSuccess: value => {
      console.log(value);
    },
  })
);

const initialMessages: readonly InputMessage[] = [
  {
    type: 'other',
    parts: [createTextPart('Choose how support should contact you.')],
    buttons: [followUpEmailButton, callbackNumberButton],
  },
];

export function App() {
  return (
    <Chat
      globals={globals}
      initialMessages={initialMessages}
    />
  );
}
```

In that example:

- the first button inherits `inputType`, `placeholder`, `inputDescription`, and abort behavior from chat globals
- the second button overrides `inputType` and `placeholder` while still inheriting the shared abort behavior and minimum length

## Button Config Still Wins

Chat defaults are merged field by field.

That means a specific button can override only the fields it cares about while inheriting the rest from `requestInputDefaults`.

This is the main reason to use globals: you can remove repeated boilerplate without giving up per-step control.

## Useful Fields To Centralize

`requestInputDefaults` can define shared values such as:

- `placeholder`
- `inputDescription`
- `inputType`
- `allowFileUpload`
- `fileValidator`
- `validator`
- `minMessageLength`
- `cooldownMs`
- `inputTimeoutMs`
- `abortLabel`
- `showAbort`
- `shouldWaitForTurn`
- `rateLimit`
- `suppressValidationFailureMessage`

Use globals for the values that feel like chat-wide policy, and leave step-specific prompts or overrides on each button definition.

## Common Patterns

### Shared support-contact defaults

Set `inputType`, `placeholder`, and `showAbort` once when many steps collect contact details or short replies in the same support chat.

### Shared upload policy

Set `allowFileUpload` and `fileValidator` in globals when the whole chat experience should accept attachments by default, then opt out on specific buttons when needed.

### Shared guardrails

Use `minMessageLength`, `cooldownMs`, `inputTimeoutMs`, or `rateLimit` when every guided step in the chat should enforce similar pacing and validation behavior.

## Advanced: `useChatGlobalsStore()`

`Chat` syncs the `globals` prop into `useChatGlobalsStore()` when it mounts and resets the store when it unmounts.

That means direct store access is mainly useful when you need to inspect the active globals or coordinate advanced flows outside JSX:

```ts
import { useChatGlobalsStore } from 'react-actions-chat';

const globalsStore = useChatGlobalsStore.getState();
const currentGlobals = globalsStore.getChatGlobals();
```

In most apps, prefer the `globals` prop. If a mounted `Chat` already owns `globals`, later renders of that component will overwrite manual store changes.

## Read Next

- [Using different input types](./using-different-input-types.md)
- [Collect input and confirm actions](./collecting-input-and-confirming-actions.md)
- [Chat](../components/chat.md)
- [Core API reference](../reference/core-api.md)
