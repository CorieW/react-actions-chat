# Collect Input and Confirm Actions

Use the shared input and confirmation helpers when a chat step needs real user data or a clear confirm/decline decision.

The best runnable reference in this repo is [examples/login/App.tsx](https://github.com/CorieW/actionable-support-chat/blob/master/examples/login/App.tsx).

## Reusable Button Definitions

`createButton` accepts plain buttons plus reusable input and confirmation definitions.

```tsx
import {
  createButton,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
} from 'actionable-support-chat';
```

This lets you define the shape of a flow once and attach runtime callbacks when you render the button.

## Request Input

```tsx
const EMAIL_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Update email',
  inputPromptMessage: 'Enter your new email address.',
  inputType: 'email',
  placeholder: 'you@example.com',
  inputDescription: 'We will send a verification email to this address.',
  validator: value => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isValidEmail || 'Please enter a valid email address.';
  },
});

const emailButton = createButton(EMAIL_BUTTON_DEF, {
  onValidInput: value => {
    console.log('Accepted email:', value);
  },
});
```

When the button is clicked, the library:

- adds the prompt message to the transcript
- reconfigures the shared input field
- validates the next user submission
- calls `onValidInput` when validation succeeds

## Validation and Retry Behavior

`validator` returns either `true` or an error message string.

By default, invalid input adds a new assistant message with the validation error and keeps the flow active for another try. Use these options when you need more control:

- `onInvalidInput` to log or branch on a validation failure
- `suppressValidationFailureMessage` to skip the default retry message
- `abortLabel`, `showAbort`, and `abortCallback` to customize the cancel path

## Password Inputs and Masking

If the shared input field is configured as `password`, the visible user message is masked in the transcript. The original value is still preserved in `rawContent`.

That is why the login demo reads the latest user message from `rawContent` instead of `content`.

## Confirm and Decline Actions

```tsx
const DELETE_ACCOUNT_DEF = createRequestConfirmationButtonDef({
  initialLabel: 'Delete account',
  confirmationMessage: 'Delete this account permanently?',
  confirmLabel: 'Delete account',
  rejectLabel: 'Keep account',
  variant: 'error',
});

const deleteButton = createButton(DELETE_ACCOUNT_DEF, {
  onConfirm: () => {
    console.log('Confirmed');
  },
  onReject: () => {
    console.log('Canceled');
  },
});
```

The initial click adds a follow-up assistant message with confirm and reject buttons. Use `onConfirm` for the destructive path and `onReject` for the safe exit.

## Related Stores

These flows are powered by exported stores:

- `useInputFieldStore` for the shared input field type, placeholder, description, validator, and current value
- `usePersistentButtonStore` for buttons that stay visible above the input field

Most apps can stay at the helper level, but the stores are available when you need to coordinate multi-step flows with external state.

## Related Docs

- [Build a chat flow](building-a-chat-flow.md)
- [Theming and styling](theming-and-styling.md)
- [Core API reference](../reference/core-api.md)
- [Examples guide](../examples.md)
