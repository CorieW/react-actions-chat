# Input-Request Buttons

Input-request buttons prompt the user for a follow-up value through the shared chat input.

The shared chat input stays disabled until an input-request flow enables it, so these buttons are the default way to collect follow-up text in guided experiences.

This is the pattern to use for collecting things like:

- email addresses
- passwords
- phone numbers
- search queries
- upload-assisted submissions that can include files and text together

## Create a Reusable Definition

```tsx typecheck
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
- `allowFileUpload`
- `fileValidator`
- `placeholder`
- `inputDescription`
- `validator`
- `minMessageLength`
- `cooldownMs`
- `inputTimeoutMs`
- `shouldWaitForTurn`
- `rateLimit`
- `abortLabel`
- `showAbort`
- `suppressValidationFailureMessage`
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

If the flow also collects files, use:

- `allowFileUpload` to show the upload button while the flow is active
- `fileValidator` to accept or reject each selected file
- the `submission.files` argument in `validator`, `onSuccess`, or runtime callbacks to inspect the full payload

## Password Flows

If `inputType` is `password`, the visible transcript message is masked. Use `rawContent` from the stored message when you need the real submitted value.

For a full walkthrough of text, password, email, search, and upload-aware flows, see [Using different input types](../guides/using-different-input-types.md).
