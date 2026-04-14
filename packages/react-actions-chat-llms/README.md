# React Actions Chat LLMs

Companion package for `react-actions-chat` that adds lightweight integrations for popular hosted LLM APIs.

## Installation

```bash
npm install react-actions-chat react-actions-chat-llms
```

## What It Includes

- `createLlmAssistantResponder`
- `buildLlmMessagesFromChatMessages`
- `createRemoteTextGenerator`
- `handleTextGenerationApiRequest`
- `executeTextGenerationApiRequest`
- `createOpenAITextGenerator`
- `createAnthropicTextGenerator`
- `createGeminiTextGenerator`

## Shared Docs

- [Sub-packages](../../docs/sub-packages/index.md)
- [react-actions-chat-llms](../../docs/sub-packages/react-actions-chat-llms.md)
- [LLM integrations overview](../../docs/guides/llm-integrations-overview.md)
- [LLM integrations API reference](../../docs/reference/llm-integrations-api.md)
- [Examples guide](../../docs/examples.md)

## Production Note

For simple demos you can call providers directly from the browser, but the package now also includes:

- a frontend helper, `createRemoteTextGenerator(...)`, for calling your own backend endpoint
- backend helpers, `handleTextGenerationApiRequest(...)` and `executeTextGenerationApiRequest(...)`, for validating requests and calling provider generators server-side

That lets you keep provider tokens on the server instead of exposing them in the browser bundle.
