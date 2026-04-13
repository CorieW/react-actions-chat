# Actionable Support Chat Recommended Actions

Companion package for `actionable-support-chat` that adds query-driven and vector-search-backed recommended action flows.

## Installation

```bash
npm install actionable-support-chat actionable-support-chat-recommended-actions
```

## What It Includes

- `createQueryRecommendedActionsFlow`
- `createVectorSearchQueryRecommendedActionsFlow`
- `createOpenAITextEmbedder`
- `createCohereTextEmbedder`
- `createVoyageTextEmbedder`

## Shared Docs

- [Recommended actions overview](../../docs/guides/recommended-actions-overview.md)
- [Recommended actions with vector search](../../docs/guides/recommended-actions-vector-search.md)
- [Recommended actions API reference](../../docs/reference/recommended-actions-api.md)
- [Examples guide](../../docs/examples.md)

The runnable `settings` example lives at [examples/settings](../../examples/settings).

## Production Note

The `settings` example uses a browser-side OpenAI API key to stay self-contained. For production, call embedding providers from your own backend instead of exposing the key to the client.
