# React Actions Chat Recommended Actions

Companion package for `react-actions-chat` that adds query-driven and vector-search-backed recommended action flows.

## Installation

```bash
npm install react-actions-chat react-actions-chat-recommended-actions
```

## What It Includes

- `createQueryRecommendedActionsFlow`
- `createRemoteRecommendedActionsFlow`
- `createRemoteRecommendedActionsHandler`
- `createVectorSearchQueryRecommendedActionsFlow`
- `createOpenAITextEmbedder`
- `createCohereTextEmbedder`
- `createGeminiTextEmbedder`
- `createVoyageTextEmbedder`

## Frontend And Backend Helpers

The package now includes a higher-level remote recommendation workflow:

- `react-actions-chat-recommended-actions/client` exports `createRemoteRecommendedActionsFlow(...)`
- `react-actions-chat-recommended-actions/server` exports `createRemoteRecommendedActionsHandler(...)`
- `react-actions-chat-recommended-actions/shared` exports the shared request and response types

That setup lets the frontend point at an endpoint and map returned action ids to local buttons, while the backend returns a serializable recommendation payload.

## Shared Docs

- [Sub-packages](../../docs/sub-packages/index.md)
- [react-actions-chat-recommended-actions](../../docs/sub-packages/react-actions-chat-recommended-actions.md)
- [Recommended actions overview](../../docs/guides/recommended-actions-overview.md)
- [Recommended actions with vector search](../../docs/guides/recommended-actions-vector-search.md)
- [Recommended actions API reference](../../docs/reference/recommended-actions-api.md)
- [Examples guide](../../docs/examples.md)

The runnable `settings` example lives at [examples/settings](../../examples/settings).

## Production Note

The `settings` example now keeps the demo simple by collecting the embedder
provider and API key in the browser. Production apps should still prefer their
own trusted backend so provider keys stay off the client.
