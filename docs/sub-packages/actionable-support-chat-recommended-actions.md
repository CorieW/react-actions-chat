# `actionable-support-chat-recommended-actions`

`actionable-support-chat-recommended-actions` is the companion package for building query-driven and vector-search-backed recommended action recommenders on top of `actionable-support-chat`.

## Installation

```bash
npm install actionable-support-chat actionable-support-chat-recommended-actions
```

## What It Adds

- `createQueryRecommendedActionsRecommender`
- `createVectorSearchQueryRecommendedActionsRecommender`
- `createOpenAITextEmbedder`
- `createCohereTextEmbedder`
- `createVoyageTextEmbedder`

## Use It When

Use this package when:

- users describe what they want in free-form text
- you want to recommend the best next actions instead of hard-coding every branch
- you want semantic matching over button definitions

Use the core package alone when your button choices are already fully scripted and you know exactly which buttons should appear at each step.

## Main Paths

### Query-based recommendations

Use `createQueryRecommendedActionsRecommender(...)` when you already have a resolver, search system, or backend endpoint that can decide which actions to recommend.

### Vector-search recommendations

Use `createVectorSearchQueryRecommendedActionsRecommender(...)` when you want semantic matching over button definitions, with either in-memory embeddings or a hosted vector-search adapter.

## Production Note

The `settings` example in this repo uses a browser-side OpenAI API key to stay self-contained. That is fine for a demo, but production apps should call embedding providers from a trusted backend.

## Read Next

- [Recommended actions overview](../guides/recommended-actions-overview.md)
- [Recommended actions with vector search](../guides/recommended-actions-vector-search.md)
- [Recommended actions API reference](../reference/recommended-actions-api.md)
- [Examples guide](../examples.md)
