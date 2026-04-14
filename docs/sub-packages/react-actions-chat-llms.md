# `react-actions-chat-llms`

`react-actions-chat-llms` is the companion package for calling popular hosted LLM APIs from a `react-actions-chat` conversation.

## Installation

```bash
npm install react-actions-chat react-actions-chat-llms
```

## What It Adds

- `createLlmAssistantResponder`
- `buildLlmMessagesFromChatMessages`
- `createRemoteTextGenerator`
- `handleTextGenerationApiRequest`
- `executeTextGenerationApiRequest`
- `createOpenAITextGenerator`
- `createAnthropicTextGenerator`
- `createGeminiTextGenerator`

## Use It When

Use this package when:

- you want a hosted model to draft assistant-side replies from transcript history
- you want provider adapters without pulling full provider SDKs into your app
- you want a small helper that fits naturally into `userResponseCallback`

Use the core package alone when your replies are fully scripted or already come from your own backend abstraction.

## Main Pieces

### Provider adapters

Use the built-in generators when you want a small fetch-based integration for OpenAI, Anthropic, or Gemini.

### Backend-safe frontend helper

Use `createRemoteTextGenerator(...)` in the browser when you want the chat UI to call your own backend endpoint instead of a provider API directly.

### Chat responder helper

Use `createLlmAssistantResponder(...)` when you want to read the current transcript, generate a reply, show loading through the shared store, and append the assistant response back into the chat.

### Backend endpoint helpers

Use `handleTextGenerationApiRequest(...)` or `executeTextGenerationApiRequest(...)` on the server when you want to validate the incoming JSON body, call the provider generator with server-side credentials, and return a normalized JSON payload to the client.

## Production Note

For demos it can be convenient to call providers directly from the browser. For production apps, use `createRemoteTextGenerator(...)` on the client and a backend endpoint powered by `handleTextGenerationApiRequest(...)` so API keys, rate limits, logging, and safety controls stay under your control.

## Read Next

- [LLM integrations overview](../guides/llm-integrations-overview.md)
- [LLM integrations API reference](../reference/llm-integrations-api.md)
- [Examples guide](../examples.md)
- [examples/llm-support](https://github.com/CorieW/react-actions-chat/tree/main/examples/llm-support)
