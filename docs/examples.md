# Examples Guide

This repo includes three runnable example apps. Each one maps cleanly to a section of the docs.

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

Live demo: not published because this example requires a server-side OpenAI API key.

Use this example for:

- `react-actions-chat-llms`
- `createLlmAssistantResponder`
- `createOpenAITextGenerator`
- production-safe follow-up helpers documented via `createRemoteTextGenerator` and `handleTextGenerationApiRequest`
- a simple chat-only UI for talking directly with the LLM

Docs:

- [LLM integrations overview](guides/llm-integrations-overview.md)

Run it:

```bash
pnpm --filter llm-support-example dev
```

If you want to run the `llm-support` demo, create `examples/llm-support/.env.local` with a server-side OpenAI key:

```bash
OPENAI_API_KEY=your_openai_api_key
```

The example browser app calls a local `/api/llm` backend route provided by the example's Vite server, so the key stays server-side instead of being exposed in the browser bundle.

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

## Companion Package Example Pattern

The repo now includes both:

- `examples/llm-support` for hosted LLM replies with `react-actions-chat-llms`
- `examples/settings` for query and vector-search recommendations with `react-actions-chat-recommended-actions`
