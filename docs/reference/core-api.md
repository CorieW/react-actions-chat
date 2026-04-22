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

Bubble component that renders message chrome plus built-in message parts such as plain text, markdown text, inline images, and downloadable files.

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
- `userResponseCallback?: (submission?: InputSubmission) => void`
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
- `image`
- `file`

### `createTextPart(text)`

Creates a text part for a message.

### `createMarkdownTextPart(text, markdownOptions?)`

Creates a markdown-rendered text part for a message.

Useful option:

- `syntaxHighlighting?: boolean` to colorize fenced code blocks when a language like `ts`, `tsx`, or `js` is present

### `createImagePart(url, options?)`

Creates an inline image part for a message.

Useful options:

- `alt?: string` to describe the image for assistive technology
- `fileName?: string` to show the original filename in the transcript
- `mimeType?: string` to store the image content type
- `maxWidthPx?: number` to cap the preview width in the transcript
- `maxHeightPx?: number` to cap the preview height in the transcript
- `sizeBytes?: number` to show file-size metadata in the transcript

### `createFilePart(url, options?)`

Creates a downloadable file part for a message.

Useful options:

- `fileName?: string` to show the original filename in the transcript
- `mimeType?: string` to store the file content type
- `sizeBytes?: number` to show file-size metadata in the transcript

## Button Helpers

### `createButton(definition, runtimeConfig?)`

Creates a plain button or turns a reusable input/confirmation definition into a runtime button.

Supported definition shapes:

- plain button definition
- `RequestInputButtonDefinition`
- `RequestConfirmationButtonDefinition`

### `createRequestInputButtonDef(config)`

Creates a reusable input-request definition.

Useful upload-related config:

- `allowFileUpload?: boolean` to show the optional upload button during the flow
- `fileValidator?: (file, submission?) => InputValidationResult` to accept or reject uploaded files

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

- `fileValidator?`
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
- `allowFileUpload?`
