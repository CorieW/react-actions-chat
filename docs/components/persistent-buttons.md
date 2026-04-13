# Persistent Buttons

Persistent buttons stay visible above the shared input field instead of living under a single transcript message.

They are managed through `usePersistentButtonStore()`.

## When To Use Them

Use persistent buttons when:

- an action should stay available across multiple steps
- you need a visible escape hatch or shortcut
- an input-request flow should expose an abort action outside the transcript

## Read the Current Buttons

```tsx
import { usePersistentButtonStore } from 'actionable-support-chat';

const buttons = usePersistentButtonStore.getState().getButtons();
```

## Add or Remove Buttons

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

## Notes

- each persistent button needs an `id`
- adding a button with the same `id` updates the existing button
- the store can also `setButtons(...)` or `clearButtons()`
