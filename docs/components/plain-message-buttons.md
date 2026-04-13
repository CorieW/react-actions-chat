# Plain Message Buttons

Plain message buttons are the simplest action type in `actionable-support-chat`.

They render under a message and run an `onClick` callback immediately.

## Base Shape

Plain buttons use the `MessageButton` shape:

- `label`
- `onClick?`
- `variant?`
- `className?`
- `style?`

## Example

```tsx
import { createButton, useChatStore } from 'actionable-support-chat';

const billingButton = createButton({
  label: 'Billing help',
  onClick: () => {
    useChatStore.getState().addMessage({
      type: 'other',
      content: 'I can help explain charges, invoices, and renewals.',
    });
  },
});
```

## When To Use Them

Use a plain message button when:

- the next action can happen immediately
- you do not need extra input from the user
- you do not need an explicit confirm or decline step

## Variants

`MessageButton.variant` supports:

- `default`
- `success`
- `error`
- `warning`
- `info`
- `dull`

`default` uses the active theme's button colors. The other variants use built-in semantic colors.
