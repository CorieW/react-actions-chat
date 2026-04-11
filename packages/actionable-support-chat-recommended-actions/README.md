# Actionable Support Chat Recommended Actions

Companion package for `actionable-support-chat` that provides recommended-action flows, vector-search helpers for button definitions, and built-in embedders for common providers.

## Installation

```bash
npm install actionable-support-chat actionable-support-chat-recommended-actions
```

## Included Helpers

- `createQueryRecommendedActionsFlow`
- `createVectorSearchQueryRecommendedActionsFlow`
- `createOpenAITextEmbedder`
- `createCohereTextEmbedder`
- `createVoyageTextEmbedder`

Use this package when you want semantic retrieval over button definitions or recommended-action flows without expanding the core chat package.

The `examples/settings` app in this repo demonstrates the package with a real OpenAI embedder. It uses a client-side API key to keep the example self-contained; production apps should call provider embedders from a trusted backend.
