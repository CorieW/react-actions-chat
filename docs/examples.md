# Examples Guide

This repo includes three runnable example apps. Each one maps cleanly to a section of the docs.

## `qa-bot`

Path: [examples/qa-bot](https://github.com/CorieW/react-actions-chat/tree/master/examples/qa-bot)

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

Path: [examples/login](https://github.com/CorieW/react-actions-chat/tree/master/examples/login)

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

## `settings`

Path: [examples/settings](https://github.com/CorieW/react-actions-chat/tree/master/examples/settings)

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
