# Input-Request Buttons

Input-request buttons prompt the user for a follow-up value through the shared chat input.

This is the pattern to use for collecting things like:

- email addresses
- passwords
- phone numbers
- search queries

## Create a Reusable Definition

```tsx
import { createButton, createRequestInputButtonDef } from 'react-actions-chat';

const emailButtonDef = createRequestInputButtonDef({
  initialLabel: 'Update email',
  inputPromptMessage: 'Enter your new email address.',
  inputType: 'email',
  placeholder: 'you@example.com',
  validator: value => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isValidEmail || 'Please enter a valid email address.';
  },
});

const emailButton = createButton(emailButtonDef, {
  onValidInput: value => {
    console.log(value);
  },
});
```

## What Happens When Clicked

The button flow:

- adds a prompt message to the transcript
- reconfigures the shared input field
- validates the next user submission
- calls `onValidInput` when the value is accepted

## Common Options

Important definition fields:

- `initialLabel`
- `inputPromptMessage`
- `inputType`
- `placeholder`
- `inputDescription`
- `validator`
- `abortLabel`
- `showAbort`
- `onSuccess`

Important runtime fields:

- `onValidInput`
- `onInvalidInput`
- `abortCallback`

## Validation and Retries

`validator` returns:

- `true` when the value is valid
- an error string when the value is invalid

By default, invalid input adds a retry message and keeps the flow active.

## Password Flows

If `inputType` is `password`, the visible transcript message is masked. Use `rawContent` from the stored message when you need the real submitted value.
