# React Actions Chat LLMs

Companion package for `react-actions-chat` that adds backend-routed text-generation helpers.

## Installation

```bash
npm install react-actions-chat react-actions-chat-llms
```

## What It Includes

- `createChatTextGenerationFlow`
- `createTextGenerationBackend`

## Shared Docs

- [Examples guide](../../docs/examples.md)

The runnable demo for this package lives at [examples/llm-support](../../examples/llm-support).

## Production Note

The `llm-support` example asks for an API key in-chat and keeps it in memory for the current tab only. In production, keep provider credentials on a trusted backend even if your UI still uses `createTextGenerationBackend`.
