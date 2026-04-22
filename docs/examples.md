# Examples Guide

This repo includes seven runnable example apps. Each one maps cleanly to a section of the docs.

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

## `uploads`

Path: [examples/uploads](https://github.com/CorieW/react-actions-chat/tree/main/examples/uploads)

Live demo: [uploads](https://coriew.github.io/react-actions-chat/examples/uploads/)

Use this example for:

- optional file uploads that stay disabled by default
- `fileValidator`
- built-in `image` and `file` message parts
- upload-focused request-input flows

Docs:

- [Core API reference](reference/core-api.md)
- [Input-request buttons](components/input-request-buttons.md)
- [Using different input types](guides/using-different-input-types.md)

Run it:

```bash
pnpm --filter uploads-example dev
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

Live demo: [llm-support](https://coriew.github.io/react-actions-chat/examples/llm-support/)

Use this example for:

- `react-actions-chat-llms`
- `createChatTextGenerationFlow`
- `createTextGenerationBackend`
- a local backend route wired through `react-actions-chat-llms`
- an in-chat startup API-key step that keeps the key in memory for the current tab

Docs:

- [react-actions-chat-llms](sub-packages/react-actions-chat-llms.md)
- [Connect to an LLM backend](guides/connect-to-an-llm-backend.md)
- [LLMs API reference](reference/llms-api.md)

Run it:

```bash
pnpm --filter llm-support-example dev
```

The demo starts by asking for an OpenAI API key in-chat before the first request. It keeps that key in memory for the current tab only.

You can optionally set `OPENAI_MODEL` and `VITE_LLM_SUPPORT_EXAMPLE_MODE` in your shell if you want a specific model or startup mode locally.

## `settings`

Path: [examples/settings](https://github.com/CorieW/react-actions-chat/tree/main/examples/settings)

Live demo: [settings](https://coriew.github.io/react-actions-chat/examples/settings/)

Use this example for:

- `react-actions-chat-recommended-actions`
- `createVectorSearchQueryRecommendedActionsFlow`
- `VectorSearchButtonDefinition`
- `createOpenAITextEmbedder`

Docs:

- [react-actions-chat-recommended-actions](sub-packages/react-actions-chat-recommended-actions.md)
- [Recommended actions overview](guides/recommended-actions-overview.md)
- [Recommended actions with vector search](guides/recommended-actions-vector-search.md)
- [Recommended Actions API reference](reference/recommended-actions-api.md)

Run it:

```bash
pnpm --filter settings-example dev
```

The public demo is published without `VITE_OPENAI_API_KEY`, so the page is available but real embedding-backed recommendations stay disabled there.

If you want to run the `settings` demo with real embeddings locally, create `examples/settings/.env.local` with:

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

Docs:

- [react-actions-chat-support](sub-packages/react-actions-chat-support.md)
- [Build a support desk](guides/build-a-support-desk.md)
- [Support API reference](reference/support-api.md)

Run it:

```bash
pnpm --filter support-desk-example dev
```

The demo starts with seeded tickets, lets the customer side create new ones, and uses the same in-memory adapter when you switch to the admin console.
