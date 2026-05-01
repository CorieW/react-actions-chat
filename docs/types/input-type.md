# `InputType`

`InputType` describes the supported shared-input modes.

## Supported Values

- `textarea`
- `select`
- `text`
- `password`
- `email`
- `number`
- `tel`
- `url`
- `search`

## Usage

Use `InputType` when configuring an input-request flow or when reading the current shared input state from `useInputFieldStore()`.

`textarea` is the default free-text mode and supports multiline prompts with `Shift+Enter` for a new line.

`select` renders a dropdown and uses `inputOptions` from the request-input configuration.

```tsx typecheck
import { createRequestInputButtonDef } from 'react-actions-chat';

const emailButtonDef = createRequestInputButtonDef({
  initialLabel: 'Update email',
  inputPromptMessage: 'Enter your new email address.',
  inputType: 'email',
});
```
