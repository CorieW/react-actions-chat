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

## `settings`

Path: [examples/settings](https://github.com/CorieW/react-actions-chat/tree/main/examples/settings)

Live demo: not published because this example requires an API key.

Use this example for:

- `react-actions-chat-recommended-actions`
- `createRemoteRecommendedActionsFlow`
- `createRemoteRecommendedActionsHandler`
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
OPENAI_API_KEY=your_openai_api_key
```

The example uses a local backend endpoint so the API key stays on the server while the browser talks to `/api/recommendations`.
