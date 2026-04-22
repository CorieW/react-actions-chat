# `react-actions-chat-recommended-actions`

`react-actions-chat-recommended-actions` is the companion package for building query-driven and vector-search-backed recommended action flows on top of `react-actions-chat`.

## Installation

```bash
npm install react-actions-chat react-actions-chat-recommended-actions
```

## What It Adds

- `createQueryRecommendedActionsFlow`
- `createVectorSearchQueryRecommendedActionsFlow`
- `createOpenAITextEmbedder`
- `createCohereTextEmbedder`
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

### Vector-search recommendations

Use `createVectorSearchQueryRecommendedActionsFlow(...)` when you want semantic matching over button definitions, with either in-memory embeddings or a hosted vector-search adapter.

## Production Note

The `settings` example in this repo uses a browser-side OpenAI API key to stay self-contained. That is fine for a demo, but production apps should call embedding providers from a trusted backend.

## Read Next

- [Sub-packages overview](./index.md)
- [Recommended actions overview](../guides/recommended-actions-overview.md)
- [Recommended actions with vector search](../guides/recommended-actions-vector-search.md)
- [Recommended actions API reference](../reference/recommended-actions-api.md)
- [Examples guide](../examples.md)
