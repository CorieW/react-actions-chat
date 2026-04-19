# Examples Guide

This repo includes six runnable example apps. Each one maps cleanly to a section of the docs.

## `coding`

Path: [examples/coding](https://github.com/CorieW/react-actions-chat/tree/main/examples/coding)

Live demo: [coding](https://coriew.github.io/react-actions-chat/examples/coding/)

Use this example for:

- multiline free-text input
- markdown-rendered text parts with headings, lists, and fenced code blocks
- local coding-assistant style follow-up flows

Docs:

- [Build a chat flow](guides/building-a-chat-flow.md)
- [Theming and styling](guides/theming-and-styling.md)

Run it:

```bash
pnpm --filter coding-example dev
```

## `qa-bot`

Path: [examples/qa-bot](https://github.com/CorieW/react-actions-chat/tree/main/examples/qa-bot)

Live demo: [qa-bot](https://coriew.github.io/react-actions-chat/examples/qa-bot/)

Use this example for:

- the core `Chat` component
- `initialMessages`
- free-form follow-up handling with `userResponseCallback`
- plain action buttons created with `createButton`

Docs:

- [Build a chat flow](guides/building-a-chat-flow.md)
- [Theming and styling](guides/theming-and-styling.md)

Run it:

```bash
pnpm --filter qa-bot-example dev
```

## `login`

Path: [examples/login](https://github.com/CorieW/react-actions-chat/tree/main/examples/login)

Live demo: [login](https://coriew.github.io/react-actions-chat/examples/login/)

Use this example for:

- `createRequestInputButtonDef`
- `createRequestConfirmationButtonDef`
- validators, retries, and abort behavior
- password masking and `rawContent`

Docs:

- [Collect input and confirmations](guides/collecting-input-and-confirming-actions.md)
- [Theming and styling](guides/theming-and-styling.md)

Run it:

```bash
pnpm --filter login-example dev
```

## `llm-support`

Path: [examples/llm-support](https://github.com/CorieW/react-actions-chat/tree/main/examples/llm-support)

Live demo: not published because this example depends on an API key.

Use this example for:

- `react-actions-chat-llms`
- `createChatTextGenerationFlow`
- `createTextGenerationBackend`
- a local backend route wired through `react-actions-chat-llms`
- an in-chat startup API-key step that keeps the key in memory for the current tab

Run it:

```bash
pnpm --filter llm-support-example dev
```

The demo starts by asking for an OpenAI API key in-chat before the first request. It keeps that key in memory for the current tab only.

You can optionally set `OPENAI_MODEL` and `VITE_LLM_SUPPORT_EXAMPLE_MODE` in your shell if you want a specific model or startup mode locally.

## `settings`

Path: [examples/settings](https://github.com/CorieW/react-actions-chat/tree/main/examples/settings)

Live demo: not published because this example requires an API key.

Use this example for:

- `react-actions-chat-recommended-actions`
- `createVectorSearchQueryRecommendedActionsFlow`
- `VectorSearchButtonDefinition`
- `createOpenAITextEmbedder`

Docs:

- [Recommended actions overview](guides/recommended-actions-overview.md)
- [Recommended actions with vector search](guides/recommended-actions-vector-search.md)

Run it:

```bash
pnpm --filter settings-example dev
```

If you want to run the `settings` demo with real embeddings, create `examples/settings/.env.local` with:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key
```

That keeps the example easy to run locally, but production apps should move embedding calls behind a backend service.

## `support-desk`

Path: [examples/support-desk](https://github.com/CorieW/react-actions-chat/tree/main/examples/support-desk)

Live demo: [support-desk](https://coriew.github.io/react-actions-chat/examples/support-desk/)

Use this example for:

- `react-actions-chat-support`
- `createSupportUserFlow`
- `createSupportAdminFlow`
- `createInMemorySupportFlowAdapter`
- sharing a ticket queue between customer and admin views in one demo workspace

Run it:

```bash
pnpm --filter support-desk-example dev
```

The demo starts with seeded tickets, lets the customer side create new ones, and uses the same in-memory adapter when you switch to the admin console.
