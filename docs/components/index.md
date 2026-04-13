# Components Overview

These pages describe the main building blocks exported by `react-actions-chat`.

## Core Entry Point

- [Chat](./chat.md): the main component that renders the transcript, persistent actions, and shared input field

## Actions

- [Plain message buttons](./plain-message-buttons.md): immediate actions attached to a message
- [Input-request buttons](./input-request-buttons.md): follow-up actions that collect email, password, search, or other input
- [Confirmation buttons](./confirmation-buttons.md): actions that require an explicit confirm or decline step
- [Persistent buttons](./persistent-buttons.md): buttons that stay visible above the shared input field

## When To Read These Pages

Read the component pages when you want to understand how the package is put together or when you are composing custom flows on top of the exported helpers and stores.

For the data shapes and store access patterns behind these components, see:

- [Types overview](../types/index.md)
- [Stores overview](../stores/index.md)
- [`useChatStore`](../stores/use-chat-store.md)
- [`useInputFieldStore`](../stores/use-input-field-store.md)
- [`usePersistentButtonStore`](../stores/use-persistent-button-store.md)

If you want a task-first walkthrough instead, start with:

- [Build a chat flow](../guides/building-a-chat-flow.md)
- [Collect input and confirmations](../guides/collecting-input-and-confirming-actions.md)
- [Theming and styling](../guides/theming-and-styling.md)
