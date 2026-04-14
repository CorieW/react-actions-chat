# LLM Integrations Overview

Use `react-actions-chat-llms` when you want transcript-driven assistant replies backed by a hosted language model.

Install it alongside the core package:

```bash
npm install react-actions-chat react-actions-chat-llms
```

## What It Covers

The companion package gives you:

- fetch-based text generators for OpenAI, Anthropic, and Gemini
- `createRemoteTextGenerator(...)` for browser-to-backend calls
- backend helpers for validating and executing text-generation requests server-side
- a shared `TextGenerator` contract if you want to plug in your own provider
- `createLlmAssistantResponder(...)` to map the current transcript into LLM messages, show loading, call the model, and append the reply

The best runnable reference in this repo is [examples/llm-support/App.tsx](https://github.com/CorieW/react-actions-chat/blob/main/examples/llm-support/App.tsx), which uses `createRemoteTextGenerator(...)` in the browser and a local OpenAI backend route in the example's Vite server.

## Recommended Production Wiring

The recommended browser setup is to call your own backend endpoint and keep provider keys server-side.

```tsx
import { useEffect, useMemo } from 'react';
import { Chat, useChatStore } from 'react-actions-chat';
import {
  createLlmAssistantResponder,
  createRemoteTextGenerator,
} from 'react-actions-chat-llms';

export function SupportChat(): React.JSX.Element {
  const addMessage = useChatStore(state => state.addMessage);

  const responder = useMemo(
    () =>
      createLlmAssistantResponder({
        generator: createRemoteTextGenerator({
          url: '/api/llm',
        }),
        systemPrompt:
          'You are a support assistant. Keep replies concise, practical, and accurate.',
      }),
    []
  );

  useEffect(() => {
    addMessage({
      type: 'other',
      content: 'Hi. Tell me what you need help with.',
      userResponseCallback: () => {
        void responder.respond();
      },
    });
  }, [addMessage, responder]);

  return <Chat />;
}
```

Example backend route:

```ts
import {
  createOpenAITextGenerator,
  handleTextGenerationApiRequest,
} from 'react-actions-chat-llms';

const generator = createOpenAITextGenerator({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request): Promise<Response> {
  return handleTextGenerationApiRequest(request, {
    generator,
  });
}
```

When the user replies:

- `react-actions-chat` stores the user message
- `createLlmAssistantResponder(...)` reads the transcript from `useChatStore`
- `createRemoteTextGenerator(...)` sends the request to your backend
- the backend helper validates the request and calls the provider with server-side credentials
- the helper appends a new assistant message and clears loading

## Direct Provider Wiring

For demos or server-only apps, you can still call the provider adapters directly.

## Provider Options

Built-in direct generators:

- `createOpenAITextGenerator`
- `createAnthropicTextGenerator`
- `createGeminiTextGenerator`

All three use a shared text-only contract, which keeps the package lightweight and makes it easy to swap providers later.

## Transcript Mapping

`buildLlmMessagesFromChatMessages(...)` converts chat messages into provider-neutral LLM messages:

- `self` becomes `user`
- `other` becomes `assistant`
- `rawContent` is preferred when present
- loading placeholders are skipped

That makes password masking and other display-only transcript transformations safe by default.

## Production Guidance

Use the backend-safe path when the chat runs in a browser:

- frontend: `createRemoteTextGenerator(...)`
- backend: `handleTextGenerationApiRequest(...)` or `executeTextGenerationApiRequest(...)`

That keeps provider API tokens out of the client bundle while still letting the chat UI use the same `createLlmAssistantResponder(...)` workflow.
