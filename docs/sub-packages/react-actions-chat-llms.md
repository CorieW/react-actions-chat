# `react-actions-chat-llms`

`react-actions-chat-llms` is the companion package for backend-routed text-generation flows built on top of `react-actions-chat`.

## Installation

```bash
npm install react-actions-chat react-actions-chat-llms
```

## What It Adds

- `createChatTextGenerationFlow`
- `createTextGenerationBackend`
- `ChatTextGenerationFlowConfig`
- `TextGenerationBackendConfig`

## Use It When

Use this package when:

- your chat transcript should be turned into LLM-ready messages
- the browser should call your own backend route instead of a provider SDK directly
- you want a small integration layer that can add loading messages, custom assistant rendering, or custom error handling

Use the core package alone when your replies are fully deterministic and do not need text generation.

## Typical Shape

1. Create a backend client with `createTextGenerationBackend({ url, headers? })`.
2. Create a chat flow with `createChatTextGenerationFlow({ generator, systemPrompt, ... })`.
3. Trigger `flow.respond()` after each user turn, or call `flow.respondToMessages(...)` for a custom transcript slice.

## Production Note

This package is designed for backend-routed generation. Keep provider credentials on your own server even if the browser still uses `createTextGenerationBackend(...)` to call that backend.

## Read Next

- [Sub-packages overview](./index.md)
- [Connect to an LLM backend](../guides/connect-to-an-llm-backend.md)
- [LLMs API reference](../reference/llms-api.md)
- [Examples guide](../examples.md)

The runnable demo for this package lives at [examples/llm-support](https://github.com/CorieW/react-actions-chat/tree/main/examples/llm-support).
