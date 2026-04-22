# LLMs API Reference

Concise reference for the public exports from `react-actions-chat-llms`.

## Main Flow Creator

### `createChatTextGenerationFlow(config)`

Creates a reusable flow that reads chat messages, converts them into LLM messages, calls a text generator, and adds the assistant reply back into the transcript.

Returned API:

- `respond(): Promise<GeneratedText | null>`
- `respondToMessages(messages): Promise<GeneratedText | null>`

Important config fields:

- `generator`
- `systemPrompt`
- `getMessages`
- `addMessage`
- `setLoading`
- `createAssistantMessage`
- `createErrorMessage`
- `throwOnError`

## Backend Helper

### `createTextGenerationBackend(config)`

Creates a `TextGenerator` that POSTs transcript messages to your own backend route.

Important config fields:

- `url`
- `credentials`
- `headers`
- `fetch`

## Core Types

### `TextGenerator`

Generator contract with:

- `generateText(request): Promise<GeneratedText>`

### `GenerateTextRequest`

Request shape with:

- `messages`
- `maxOutputTokens?`
- `signal?`

### `GeneratedText`

Successful generation result with:

- `text`

### `LLMMessage`

Provider-ready transcript message with:

- `role`
- `content`

### `LLMMessageRole`

Supported roles:

- `assistant`
- `developer`
- `system`
- `user`

### `ChatTextGenerationContext`

Flow context with:

- `chatMessages`
- `llmMessages`

### `ChatTextGenerationFlowMessage`

Chat message shape accepted by `respondToMessages(...)`.

## Shared Utilities

### `FetchLike`

Fetch-compatible type you can pass when you want a custom request implementation for tests or server runtimes.
