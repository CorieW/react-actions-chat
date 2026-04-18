# Core API Reference

Concise reference for the main public exports from `react-actions-chat`.

## Components

### `Chat`

The composition root for the chat UI. It renders the transcript, persistent actions, and shared input bar.

Props:

- `initialMessages?: readonly InputMessage[]`
- `allowFreeTextInput?: boolean`
- `globals?: ChatGlobals`
- `theme?: 'light' | 'dark' | ChatTheme`

### `MessageList`

Transcript component that renders stored messages.

### `Message`

Bubble component that renders message chrome plus plain text content.

### `InputBar`

Shared input component used by free-form chat and input-request flows.

## Message Model

### `InputMessage`

Message shape accepted by `initialMessages` and `useChatStore().addMessage(...)`.

Key fields:

- `id?: number`
- `type: 'self' | 'other'`
- `parts: readonly MessagePart[]`
- `rawContent?: string`
- `timestamp?: Date`
- `isLoading?: boolean`
- `loadingLabel?: string`
- `userResponseCallback?: () => void`
- `buttons?: readonly MessageButton[]`

### `Message`

Normalized message shape stored in chat state. It always has:

- `id`
- `parts`
- `rawContent`
- `timestamp`

### `MessagePart`

Built-in content parts:

- `text`

### `createTextPart(text)`

Creates a text part for a message.

## Button Helpers

### `createButton(definition, runtimeConfig?)`

Creates a plain button or turns a reusable input/confirmation definition into a runtime button.

Supported definition shapes:

- plain button definition
- `RequestInputButtonDefinition`
- `RequestConfirmationButtonDefinition`

### `createRequestInputButtonDef(config)`

Creates a reusable input-request definition.

### `createRequestConfirmationButtonDef(config)`

Creates a reusable confirmation definition.

## Input Bar Types

### `InputBarModeConfig`

Public mode settings for the shared input bar:

- `type`
- `placeholder?`
- `description?`

### `InputBarValidationConfig`

Public validation settings for the shared input bar:

- `validator?`
- `submitGuard?`

### `InputBarBehaviorConfig`

Public behavior settings for the shared input bar:

- `disabled?`
- `disabledPlaceholder?`
- `shouldWaitForTurn?`
- `cooldownMs?`
- `timeoutMs?`
- `showAbort?`
