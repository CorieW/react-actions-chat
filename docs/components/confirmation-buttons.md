# Confirmation Buttons

Confirmation buttons add an explicit confirm or decline step before an action continues.

Use them for destructive or high-friction actions such as sign-out, deletion, or any workflow where the user should opt in clearly.

## Example

```tsx
import {
  createButton,
  createRequestConfirmationButtonDef,
} from 'react-actions-chat';

const deleteAccountDef = createRequestConfirmationButtonDef({
  initialLabel: 'Delete account',
  confirmationMessage: 'Delete this account permanently?',
  confirmLabel: 'Delete account',
  rejectLabel: 'Keep account',
  variant: 'error',
});

const deleteAccountButton = createButton(deleteAccountDef, {
  onConfirm: () => {
    console.log('Confirmed');
  },
  onReject: () => {
    console.log('Canceled');
  },
});
```

## What Happens When Clicked

The initial click adds a follow-up assistant message with two buttons:

- a confirm button
- a reject button

`onConfirm` runs when the user accepts the action. `onReject` runs when they cancel it.

## Common Options

Important definition fields:

- `initialLabel`
- `confirmationMessage`
- `confirmLabel`
- `rejectLabel`
- `variant`
- `onSuccess`

Important runtime fields:

- `onConfirm`
- `onReject`
