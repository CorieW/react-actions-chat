# `InputType`

`InputType` describes the supported shared-input modes.

## Supported Values

- `text`
- `password`
- `email`
- `number`
- `tel`
- `url`
- `search`

## Usage

Use `InputType` when configuring an input-request flow or when reading the current shared input state from `useInputFieldStore()`.

```tsx typecheck
import { createRequestInputButtonDef } from 'react-actions-chat';

const emailButtonDef = createRequestInputButtonDef({
  initialLabel: 'Update email',
  inputPromptMessage: 'Enter your new email address.',
  inputType: 'email',
});
```
