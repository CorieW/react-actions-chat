# `usePersistentButtonStore`

`usePersistentButtonStore` manages the buttons shown above the shared input field.

Use it when an action should stay visible across multiple steps instead of living under one message bubble.

## Common Reads

```tsx
import { usePersistentButtonStore } from 'actionable-support-chat';

const buttons = usePersistentButtonStore.getState().getButtons();
```

Useful method:

- `getButtons()`

## Common Writes

```tsx
import { usePersistentButtonStore } from 'actionable-support-chat';

usePersistentButtonStore.getState().addButton({
  id: 'cancel-flow',
  label: 'Cancel',
  variant: 'error',
  onClick: () => {
    console.log('Canceled');
  },
});

usePersistentButtonStore.getState().removeButton('cancel-flow');
```

Useful methods:

- `addButton(button)`
- `removeButton(id)`
- `setButtons(buttons)`
- `clearButtons()`

## Notes

- each persistent button needs an `id`
- adding a button with the same `id` updates the existing button
- this is a good place for escape hatches and long-lived quick actions
