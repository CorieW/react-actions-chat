# Stores Overview

These pages describe the exported Zustand stores that power `react-actions-chat`.

## Available Stores

- [`useChatStore`](./use-chat-store.md): transcript history, loading state, and message mutations
- [`useInputFieldStore`](./use-input-field-store.md): shared input value, type, placeholder, description, validator, and submit helpers
- [`usePersistentButtonStore`](./use-persistent-button-store.md): buttons that stay visible above the shared input field

## When To Read These Pages

Read the store pages when you want to:

- inspect or mutate transcript history directly
- retrieve the latest submitted value or previous message
- inspect the current shared-input mode
- control long-lived buttons outside a single message bubble

If you want the underlying data shapes first, start with:

- [Types overview](../types/index.md)
- [`Message`](../types/message.md)
- [`InputMessage`](../types/input-message.md)
