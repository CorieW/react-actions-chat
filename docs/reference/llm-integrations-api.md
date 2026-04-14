# LLM Integrations API Reference

Concise reference for the public exports from `react-actions-chat-llms`.

## Chat Helper

### `createLlmAssistantResponder(config)`

Creates a responder that:

- reads the current transcript from `useChatStore` by default
- converts it into LLM messages
- calls the configured `TextGenerator`
- appends the assistant reply back into the chat transcript
- toggles the shared loading state while the request is in flight

Useful config fields:

- `generator`
- `systemPrompt?: string | (messages) => string | undefined`
- `getMessages?`
- `addMessage?`
- `setLoading?`
- `createAssistantMessage?`
- `createErrorMessage?`
- `throwOnError?`

Returned methods:

- `respond()`
- `respondToMessages(messages)`

### `buildLlmMessagesFromChatMessages(messages)`

Converts `react-actions-chat` transcript entries into provider-neutral LLM messages.

## Frontend Helper

### `createRemoteTextGenerator(config)`

Creates a browser-safe `TextGenerator` that POSTs normalized requests to your own backend endpoint.

Useful config fields:

- `url`
- `credentials?`
- `headers?`
- `fetch?`

The helper strips `signal` from the JSON body and forwards it to `fetch(...)` so aborts still work.

## Backend Helpers

### `handleTextGenerationApiRequest(request, config)`

Creates a fetch-style backend handler that:

- requires `POST`
- reads and validates the JSON request body
- calls the configured server-side `TextGenerator`
- returns a normalized JSON response or error payload

Useful config fields:

- `generator`
- `onError?`

### `executeTextGenerationApiRequest(body, config)`

Validates a parsed request body and calls the server-side generator. Use this when your framework already manages request and response objects.

Useful config fields:

- `generator`
- `signal?`

### `parseTextGenerationApiRequest(body)`

Validates and normalizes the JSON body expected by the backend endpoint.

## Provider Helpers

### `createOpenAITextGenerator(config)`

Creates a text generator backed by the OpenAI chat completions API.

Common config fields:

- `apiKey`
- `model`
- `baseUrl`
- `organization`
- `project`
- `headers`
- `fetch`

### `createAnthropicTextGenerator(config)`

Creates a text generator backed by the Anthropic Messages API.

Common config fields:

- `apiKey`
- `model`
- `baseUrl`
- `version`
- `defaultMaxOutputTokens`
- `headers`
- `fetch`

### `createGeminiTextGenerator(config)`

Creates a text generator backed by the Gemini `generateContent` API.

Common config fields:

- `apiKey`
- `model`
- `baseUrl`
- `headers`
- `fetch`

## Core Types

### `LlmMessage`

Provider-neutral text message:

- `role: 'system' | 'user' | 'assistant'`
- `content: string`

### `GenerateTextRequest`

Shared request shape used by the built-in generators.

Fields:

- `messages`
- `maxOutputTokens?`
- `stopSequences?`
- `temperature?`
- `topP?`
- `signal?`

### `TextGenerationApiRequest`

Serialized request shape used between the browser helper and your backend endpoint.

Fields:

- `messages`
- `maxOutputTokens?`
- `stopSequences?`
- `temperature?`
- `topP?`

### `GeneratedTextResult`

Normalized provider response.

Fields:

- `text`
- `finishReason?`

### `TextGenerator`

Provider-neutral contract implemented by the built-in generators.

### `FetchLike`

Fetch signature accepted by the provider adapters for testing or custom runtimes.
