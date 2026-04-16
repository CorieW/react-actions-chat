# Core API Reference

Concise reference for the public exports from `react-actions-chat`.

## Components

### `Chat`

Primary React component for rendering the transcript, persistent buttons, and shared input field.

Props:

- `initialMessages?: readonly InputMessage[]`
- `theme?: 'light' | 'dark' | ChatTheme`

## Core Types

### `ChatTheme`

Theme token object for the chat UI.

Fields:

- `primaryColor`
- `secondaryColor`
- `backgroundColor`
- `textColor`
- `borderColor`
- `inputBackgroundColor`
- `inputTextColor`
- `buttonColor`
- `buttonTextColor`

### `InputMessage`

Message shape accepted by `initialMessages` and `useChatStore().addMessage(...)`.

Key fields:

- `type: 'self' | 'other'`
- `content: string`
- `rawContent?: string`
- `timestamp?: Date`
- `isLoading?: boolean`
- `loadingLabel?: string`
- `userResponseCallback?: () => void`
- `buttons?: readonly MessageButton[]`

### `MessageButton`

Button displayed under a message.

Key fields:

- `label: string`
- `onClick?: () => void`
- `variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'dull'`
- `className?: string`
- `style?: React.CSSProperties`

## Button Helpers

### `createButton(definition, runtimeConfig?)`

Creates a plain button or turns a reusable input/confirmation definition into a runtime button.

Supported definition shapes:

- plain button definition
- `RequestInputButtonDefinition`
- `RequestConfirmationButtonDefinition`

### `createRequestInputButtonDef(config)`

Creates a reusable input-request definition.

Common config fields:

- `initialLabel`
- `inputPromptMessage`
- `inputType`
- `placeholder`
- `inputDescription`
- `validator`
- `minMessageLength`
- `cooldownMs`
- `inputTimeoutMs`
- `shouldWaitForTurn`
- `rateLimit`
- `variant`
- `abortLabel`
- `showAbort`
- `onSuccess`

### `createRequestConfirmationButtonDef(config)`

Creates a reusable confirmation definition.

Common config fields:

- `initialLabel`
- `confirmationMessage`
- `confirmLabel`
- `rejectLabel`
- `variant`
- `onSuccess`

## Theme Helpers

### `LIGHT_THEME`

Built-in light preset.

### `DARK_THEME`

Built-in dark preset.

### `getResolvedTheme(theme)`

Normalizes `'light'`, `'dark'`, `undefined`, or a custom theme object into a complete `ChatTheme`.

### `getThemeStyles(theme)`

Converts a theme into CSS custom properties that match the chat component.

## Stores

### `useChatStore`

Advanced shared state for the transcript and loading state.

Common methods:

- `getMessages()`
- `getPreviousMessage()`
- `addMessage(message)`
- `addMessages(messages)`
- `setMessages(messages)`
- `setLoading(isLoading)`
- `clearLoading()`
- `clearMessages()`

### `useInputFieldStore`

Advanced shared state for the single input field used by input-request flows.

Useful fields and methods:

- `getInputFieldType()`
- `getInputFieldPlaceholder()`
- `getInputFieldDescription()`
- `getInputFieldValidator()`
- `setInputFieldType(type)`
- `setInputFieldPlaceholder(text)`
- `setInputFieldDescription(text)`
- `setInputFieldValidator(validator)`
- reset helpers for returning to the default text field

### `usePersistentButtonStore`

Shared state for buttons shown above the input field.

Common methods:

- `getButtons()`
- `addButton(button)`
- `removeButton(id)`
- `setButtons(buttons)`
- `clearButtons()`
