# packages/react-actions-chat-recommended-actions/src

Published source for the recommended-actions companion package, including query flows, embedder integrations, and test coverage.

## Directories

- `__tests__/`: Automated tests for the companion package flows and embedder helpers.
- `embedders/`: Provider-specific text embedder implementations and shared embedding utilities.
- `queryFlow/`: Internal query recommendation flow contracts, defaults, message resolution, and chat-store orchestration.
- `vectorSearch/`: Internal vector-search recommendation contracts, scoring, and resolver wiring.

## Files

- `index.ts`: Public export barrel for the recommended-actions companion package.
- `queryRecommendedActionsFlow.ts`: Compatibility export for query-driven recommended action flows.
- `vectorSearchButtonDefinition.ts`: Types and helpers for button definitions used in vector-search recommendation flows.
- `vectorSearchQueryRecommendedActionsFlow.ts`: Compatibility export for vector-search-backed recommended action flows.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
