# Using Different Input Types

Use `createRequestInputButtonDef(...)` when you want the shared chat input to temporarily behave like a specific kind of field.

This guide focuses on choosing the right `inputType`, adding validation, and handling the submitted value correctly.

The best runnable references in this repo are:

- [examples/login/App.tsx](https://github.com/CorieW/react-actions-chat/blob/master/examples/login/App.tsx)
- [examples/settings/App.tsx](https://github.com/CorieW/react-actions-chat/blob/master/examples/settings/App.tsx)
- [examples/qa-bot/App.tsx](https://github.com/CorieW/react-actions-chat/blob/master/examples/qa-bot/App.tsx)

## Supported Input Types

The shared chat input supports the following [`InputType`](../types/input-type.md) values:

- `text`
- `password`
- `email`
- `number`
- `tel`
- `url`
- `search`

## Basic Pattern

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

The button click reconfigures the shared input, waits for the next user submission, runs the validator, and then calls `onValidInput` if the value is accepted.

## `text`

Use `text` for general-purpose free-form input.

Common use cases:

- names
- short labels
- generic follow-up answers

```tsx
const displayNameButtonDef = createRequestInputButtonDef({
  initialLabel: 'Update display name',
  inputPromptMessage: 'What display name would you like to use?',
  inputType: 'text',
  placeholder: 'Enter display name',
});
```

## `email`

Use `email` when collecting email addresses.

This is a good match for:

- sign-in flows
- account recovery
- contact handoff steps

```tsx
const emailButtonDef = createRequestInputButtonDef({
  initialLabel: 'Sign in with email',
  inputPromptMessage: 'Enter your work email.',
  inputType: 'email',
  placeholder: 'you@example.com',
  validator: value => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isValidEmail || 'Please enter a valid email address.';
  },
});
```

## `password`

Use `password` when the shared input should hide what the user typed in the visible transcript.

```tsx
const passwordButtonDef = createRequestInputButtonDef({
  initialLabel: 'Change password',
  inputPromptMessage: 'Enter your new password.',
  inputType: 'password',
  placeholder: 'Enter password',
  validator: value => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    return true;
  },
});
```

Important behavior:

- the visible message in the transcript is masked
- the real value is still available in [`Message.rawContent`](../types/message.md)

When you need the actual submitted password, read `rawContent` from the stored message through [`useChatStore`](../stores/use-chat-store.md).

## `tel`

Use `tel` for phone numbers or other dial-like inputs.

```tsx
const phoneButtonDef = createRequestInputButtonDef({
  initialLabel: 'Update phone number',
  inputPromptMessage: 'Enter your new phone number.',
  inputType: 'tel',
  placeholder: '+44 7700 900123',
  validator: value => {
    const digitsOnly = value.replace(/\D/g, '');
    return (
      (digitsOnly.length >= 7 && digitsOnly.length <= 15) ||
      'Please enter a valid phone number.'
    );
  },
});
```

## `search`

Use `search` when the input is really a lookup query rather than account data.

This is especially useful for:

- help searches
- recommendation queries
- intent discovery

```tsx
const helpSearchButtonDef = createRequestInputButtonDef({
  initialLabel: 'Find help',
  inputPromptMessage: 'What would you like help with?',
  inputType: 'search',
  placeholder: 'Search for help topics...',
});
```

## Other Supported Types

The shared input also supports:

- `number`
- `url`

Use them when those HTML input semantics match your flow better than plain text.

## Validation Patterns

Validators follow the [`InputValidator`](../types/input-validator.md) shape and return an [`InputValidationResult`](../types/input-validation-result.md):

- `true` for valid input
- a string error message for invalid input

### Email validation

```tsx
validator: value => {
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return isValidEmail || 'Please enter a valid email address.';
};
```

### Length validation

```tsx
validator: value => {
  const trimmedValue = value.trim();

  if (trimmedValue.length < 2) {
    return 'Value must be at least 2 characters long.';
  }

  if (trimmedValue.length > 40) {
    return 'Value must be 40 characters or less.';
  }

  return true;
};
```

### Password validation

```tsx
validator: value => {
  if (value.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(value)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(value)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(value)) {
    return 'Password must contain at least one number.';
  }

  return true;
};
```

## Retry and Abort Behavior

By default:

- invalid input adds an assistant error message
- the same input flow stays active so the user can retry

Useful options:

- `onInvalidInput`
- `suppressValidationFailureMessage`
- `abortLabel`
- `showAbort`
- `abortCallback`

## Reading the Current Input Mode

If you need to inspect the live shared input field directly, use [`useInputFieldStore`](../stores/use-input-field-store.md).

That store can tell you:

- the current input type
- the current placeholder
- the current description
- the current validator
- the current input value

## Choosing the Right Input Type

- Use `text` for flexible free-form answers.
- Use `email` for account and contact addresses.
- Use `password` when the transcript should mask what the user typed.
- Use `tel` for phone numbers.
- Use `search` for lookup-style queries and recommendation prompts.
- Use `number` or `url` only when those semantics genuinely match the data you want.
