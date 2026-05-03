# packages/react-actions-chat-recommended-actions/src/vectorSearch

Internal vector-search recommendation modules for contracts, similarity scoring, and query flow integration.

## Directories

- None.

## Files

- `createVectorSearchQueryRecommendedActionsFlow.ts`: Connects vector-search resolver wiring to the shared query recommendation flow.
- `index.ts`: Internal barrel for vector-search exports consumed by public compatibility modules.
- `search.ts`: Builds vector-search resolvers for hosted search, precomputed embeddings, and local text embedding.
- `similarity.ts`: Cosine similarity helper used by local in-memory vector search.
- `types.ts`: Public vector-search configuration, adapter, match, and resolver contracts.

## Writing Rules

- Keep public vector-search type exports synchronized with `../vectorSearchQueryRecommendedActionsFlow.ts` and `../index.ts`.
- Follow inherited AGENTS.md guidance when applicable.
