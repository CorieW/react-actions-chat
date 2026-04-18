# Plain Message Buttons

Plain message buttons are the simplest action type in `react-actions-chat`.

They render under a message and run an `onClick` callback immediately.

## Example

```tsx typecheck
import { createButton, createTextPart, useChatStore } from 'react-actions-chat';

const billingButton = createButton({
  label: 'Billing help',
  onClick: () => {
    useChatStore.getState().addMessage({
      type: 'other',
      parts: [
        createTextPart('I can help explain charges, invoices, and renewals.'),
      ],
    });
  },
});
```

## When To Use Them

- when the next action can happen immediately
- when you do not need extra input from the user
- when you do not need an explicit confirm or decline step
