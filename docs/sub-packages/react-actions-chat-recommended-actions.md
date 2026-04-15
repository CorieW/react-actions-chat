# `react-actions-chat-recommended-actions`

`react-actions-chat-recommended-actions` is the companion package for building query-driven and vector-search-backed recommended action flows on top of `react-actions-chat`.

## Installation

```bash
npm install react-actions-chat react-actions-chat-recommended-actions
```

## What It Adds

- `createQueryRecommendedActionsFlow`
- `createRemoteRecommendedActionsFlow`
- `createRemoteRecommendedActionsHandler`
- `createVectorSearchQueryRecommendedActionsFlow`
- `createOpenAITextEmbedder`
- `createCohereTextEmbedder`
- `createGeminiTextEmbedder`
- `createVoyageTextEmbedder`

## Use It When

Use this package when:

- users describe what they want in free-form text
- you want to recommend the best next actions instead of hard-coding every branch
- you want semantic matching over button definitions

Use the core package alone when your flows are already fully scripted and you know exactly which buttons should appear at each step.

## Main Paths

### Query-based recommendations

Use `createQueryRecommendedActionsFlow(...)` when you already have a resolver, search system, or backend endpoint that can decide which actions to recommend.

Use `createRemoteRecommendedActionsFlow(...)` when the frontend should call a
backend endpoint directly and you want the package to handle the request shape,
response parsing, and action hydration.

### Vector-search recommendations

Use `createVectorSearchQueryRecommendedActionsFlow(...)` when you want semantic matching over button definitions, with either in-memory embeddings or a hosted vector-search adapter.

### Backend handler

Use `createRemoteRecommendedActionsHandler(...)` on the backend when you want a
small JSON handler that matches the shared request and response format used by
the client helper.

## Production Note

The `settings` example in this repo is now intentionally simple: it asks the
user for an embedder provider and API key in the browser. Production apps
should still prefer their own trusted backend so the API key stays off the
client.

## Read Next

- [Recommended actions overview](../guides/recommended-actions-overview.md)
- [Recommended actions with vector search](../guides/recommended-actions-vector-search.md)
- [Recommended actions API reference](../reference/recommended-actions-api.md)
- [Examples guide](../examples.md)
