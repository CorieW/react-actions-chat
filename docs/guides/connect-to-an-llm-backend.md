# Connect to an LLM Backend

Use `react-actions-chat-llms` when you want `react-actions-chat` to stay in charge of the transcript and shared input while your own backend handles text generation.

The best runnable references in this repo are:

- [examples/llm-support/App.tsx](https://github.com/CorieW/react-actions-chat/blob/main/examples/llm-support/App.tsx)
- [examples/llm-support/llmDemoServer.ts](https://github.com/CorieW/react-actions-chat/blob/main/examples/llm-support/llmDemoServer.ts)

## The Request Shape

The frontend helper sends your backend a JSON body like:

```ts
{
  messages: [
    { role: 'system', content: '...' },
    { role: 'user', content: '...' },
    { role: 'assistant', content: '...' },
  ],
  maxOutputTokens: 400,
}
```

Your backend should respond with:

```ts
{
  text: 'Assistant reply goes here.';
}
```

That contract is intentionally small. You can use OpenAI, another provider, or your own service behind the route.

## Frontend Wiring

```tsx typecheck
import { Chat, createTextPart, type InputMessage } from 'react-actions-chat';
import {
  createChatTextGenerationFlow,
  createTextGenerationBackend,
} from 'react-actions-chat-llms';
import 'react-actions-chat/styles';

const backend = createTextGenerationBackend({
  url: '/api/llm',
});

const flow = createChatTextGenerationFlow({
  generator: {
    generateText: request =>
      backend.generateText({
        ...request,
        maxOutputTokens: 400,
      }),
  },
  systemPrompt: 'You are a concise support assistant.',
  createAssistantMessage: result => ({
    type: 'other',
    parts: [createTextPart(result.text)],
    userResponseCallback: () => {
      void flow.respond();
    },
  }),
  createErrorMessage: error => ({
    type: 'other',
    parts: [
      createTextPart(
        error instanceof Error ? error.message : 'Something went wrong.'
      ),
    ],
    userResponseCallback: () => {
      void flow.respond();
    },
  }),
});

const initialMessages: readonly InputMessage[] = [
  {
    type: 'other',
    parts: [createTextPart('Ask about billing, exports, or account access.')],
    userResponseCallback: () => {
      void flow.respond();
    },
  },
];

export function App() {
  return (
    <Chat
      allowFreeTextInput
      initialMessages={initialMessages}
    />
  );
}
```

## Why `userResponseCallback` Appears Again

For an always-on assistant, every assistant reply should add the next `userResponseCallback`.

That is why the example above adds `userResponseCallback` to:

- the initial assistant message
- each generated assistant reply
- each error message

Without that, only the first user turn would trigger the flow automatically.

## Backend Route Example

The package does not require a specific server framework. The main job of your route is:

1. accept `messages` and optional `maxOutputTokens`
2. call your provider
3. return `{ text }`

Example:

```ts
import type { LLMMessage } from 'react-actions-chat-llms';

interface GenerateTextRequestBody {
  readonly messages: readonly LLMMessage[];
  readonly maxOutputTokens?: number | undefined;
}

interface OpenAIResponsesResponse {
  readonly output_text?: string;
  readonly error?: {
    readonly message?: string;
  };
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as GenerateTextRequestBody;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      input: body.messages,
      ...(body.maxOutputTokens
        ? {
            max_output_tokens: body.maxOutputTokens,
          }
        : {}),
    }),
  });

  const data = (await response.json()) as OpenAIResponsesResponse;

  if (!response.ok) {
    return Response.json(
      {
        message:
          data.error?.message ??
          `OpenAI request failed with status ${response.status}.`,
      },
      { status: response.status }
    );
  }

  return Response.json({
    text: data.output_text ?? '',
  });
}
```

## Keep Credentials On The Server

The browser-side helper should call your backend route, not the provider directly.

That lets you keep:

- provider API keys on the server
- provider/model selection in one place
- auth, logging, quotas, or workspace routing behind your own API boundary

## Optional: Disable Input While Waiting

`createChatTextGenerationFlow(...)` already toggles the chat loading state for you.

If you also want to temporarily disable typing and show a waiting placeholder, coordinate it with `useInputFieldStore()`:

```ts
import { useInputFieldStore } from 'react-actions-chat';

async function runResponseCycle(): Promise<void> {
  const inputFieldStore = useInputFieldStore.getState();
  inputFieldStore.setInputFieldParams({
    disabled: true,
    disabledPlaceholder: 'Thinking through your request...',
  });

  try {
    await flow.respond();
  } finally {
    inputFieldStore.resetInputFieldDisabled();
  }
}
```

This is the same pattern used by the runnable `llm-support` example.

## Read Next

- [react-actions-chat-llms](../sub-packages/react-actions-chat-llms.md)
- [LLMs API reference](../reference/llms-api.md)
- [Build a chat flow](./building-a-chat-flow.md)
