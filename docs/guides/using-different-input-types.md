# Using Different Input Types

Use `createRequestInputButtonDef(...)` when you want the shared chat input to temporarily behave like a specific kind of field.

This is the default guided-input pattern, because `Chat` keeps the shared input disabled until an input-request flow enables it.

This guide focuses on choosing the right `inputType`, understanding what each mode changes, and handling text-plus-file submissions clearly.

The best runnable references in this repo are:

- [examples/login/App.tsx](https://github.com/CorieW/react-actions-chat/blob/main/examples/login/App.tsx)
- [examples/uploads/App.tsx](https://github.com/CorieW/react-actions-chat/blob/main/examples/uploads/App.tsx)
- [examples/settings/App.tsx](https://github.com/CorieW/react-actions-chat/blob/main/examples/settings/App.tsx)

## Two Separate Concepts

`inputType` controls the HTML behavior of the shared text field.

`allowFileUpload` controls whether the shared upload button is visible for the current request-input flow.

That means uploads are not their own `InputType`. A flow can use `text`, `textarea`, or `search` and still accept files when you enable uploads explicitly.

## Supported Input Types

The shared chat input supports the following [`InputType`](../types/input-type.md) values:

- `textarea`
- `text`
- `password`
- `email`
- `number`
- `tel`
- `url`
- `search`

`textarea` is the default mode and supports multiline input with `Shift+Enter`.

## Quick Reference

| Input type | Best for                                | Notes                                             |
| ---------- | --------------------------------------- | ------------------------------------------------- |
| `textarea` | Longer free-form replies                | Multiline; best default for open questions        |
| `text`     | Names, labels, short answers            | Single-line general purpose input                 |
| `password` | Secrets or masked values                | Transcript masks the visible user message         |
| `email`    | Account and contact addresses           | Pair with an email validator                      |
| `number`   | Numeric-only answers                    | Still arrives as a string in validators/callbacks |
| `tel`      | Phone numbers                           | Accepts phone-friendly keyboard layouts on mobile |
| `url`      | Links and endpoint inputs               | Pair with normalization or URL validation         |
| `search`   | Help lookups and recommendation queries | Good fit for find/recommend/discovery prompts     |

## Basic Pattern

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

The button click reconfigures the shared input, waits for the next user submission, runs the validator, and then calls `onValidInput` if the value is accepted.

## `textarea`

Use `textarea` when you want the most flexible guided input and the user may need more than one line.

Common use cases:

- issue descriptions
- reproduction steps
- general support requests

```tsx
const summaryButtonDef = createRequestInputButtonDef({
  initialLabel: 'Describe the issue',
  inputPromptMessage: 'Tell me what happened.',
  inputType: 'textarea',
  placeholder:
    'Include what you expected, what happened instead, and any error text...',
  minMessageLength: 20,
});
```

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

## `number`

Use `number` when the answer is inherently numeric, such as seat counts, quantities, or thresholds.

```tsx
const seatsButtonDef = createRequestInputButtonDef({
  initialLabel: 'Update seat count',
  inputPromptMessage: 'How many seats should the workspace have?',
  inputType: 'number',
  placeholder: '25',
  validator: value => {
    const nextSeatCount = Number(value);

    return Number.isInteger(nextSeatCount) && nextSeatCount > 0
      ? true
      : 'Enter a whole number greater than zero.';
  },
});
```

Even with `inputType: 'number'`, the submitted value still arrives as a string. Parse it in your validator or success handler.

## `url`

Use `url` for links, callback URLs, or API endpoints.

```tsx
const webhookButtonDef = createRequestInputButtonDef({
  initialLabel: 'Add webhook URL',
  inputPromptMessage: 'Paste the webhook endpoint you want to use.',
  inputType: 'url',
  placeholder: 'https://example.com/webhooks/support',
  validator: value => {
    try {
      new URL(value);
      return true;
    } catch {
      return 'Enter a valid URL.';
    }
  },
});
```

## Upload-aware Flows

Uploads are configured separately from `inputType`. This is the clearest pattern when you want a request to collect optional notes plus one or more files.

```tsx typecheck
import { createRequestInputButtonDef } from 'react-actions-chat';

const screenshotButtonDef = createRequestInputButtonDef({
  initialLabel: 'Share screenshot',
  inputPromptMessage:
    'Upload one or more screenshots and add an optional note.',
  inputType: 'text',
  placeholder: 'Optional note about what the screenshot shows',
  inputDescription: 'PNG, JPG, WEBP, and GIF are accepted in this flow.',
  allowFileUpload: true,
  validator: (_value, submission) => {
    return (submission?.files.length ?? 0) > 0
      ? true
      : 'Upload at least one image to continue.';
  },
  fileValidator: file => {
    return file.type.startsWith('image/')
      ? true
      : 'Only image files are allowed in this flow.';
  },
  onSuccess: (note, submission) => {
    console.log(note, submission.files);
  },
});
```

Use this pattern when:

- the user might attach screenshots or documents
- the text field is optional but files are required
- you want different validation rules for images versus non-image attachments

The [uploads example](../examples.md) shows both an image-only and a non-image document flow built around the same shared input.

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

### Text-plus-file validation

```tsx
validator: (value, submission) => {
  const hasNote = value.trim().length > 0;
  const hasFiles = (submission?.files.length ?? 0) > 0;

  return hasNote || hasFiles || 'Add a short note or upload a file.';
};
```

### Per-file validation

```tsx
fileValidator: file => {
  if (file.size > 5 * 1024 * 1024) {
    return 'Each file must be 5 MB or smaller.';
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

## Password Masking and `rawContent`

When `inputType` is `password`:

- the visible user message in the transcript is masked
- the real submitted value is still stored in [`Message.rawContent`](../types/message.md)

Use that when you need to forward the submitted secret to your own backend or next flow step without exposing it in the visible transcript.

## Reading the Current Input Mode

If you need to inspect the live shared input field directly, use [`useInputFieldStore`](../stores/use-input-field-store.md).

That store can tell you:

- the current input type
- the current placeholder
- the current description
- the current validator
- the current input value
- the currently selected files and whether uploads are enabled for the current step

## Choosing the Right Input Type

- Use `textarea` when longer, multiline answers are likely.
- Use `text` for shorter flexible answers.
- Use `email` for account and contact addresses.
- Use `password` when the transcript should mask what the user typed.
- Use `tel` for phone numbers.
- Use `search` for lookup-style queries and recommendation prompts.
- Use `number` when numeric entry improves clarity or mobile keyboard behavior.
- Use `url` when you want URL semantics and validation.
- Enable `allowFileUpload` separately whenever the step should accept attachments.
