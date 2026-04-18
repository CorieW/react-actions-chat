# packages/react-actions-chat-recommended-actions/src

Published source for the recommended-actions companion package, including query flows, embedder integrations, and test coverage.

## Directories

- `__tests__/`: Automated tests for the companion package flows and embedder helpers.
- `embedders/`: Provider-specific text embedder implementations and shared embedding utilities.

## Files

- `index.ts`: Public export barrel for the recommended-actions companion package.
- `queryRecommendedActionsFlow.ts`: Builds query-driven flows that recommend action buttons from free-text user requests.
- `vectorSearchButtonDefinition.ts`: Types and helpers for button definitions used in vector-search recommendation flows.
- `vectorSearchQueryRecommendedActionsFlow.ts`: Builds recommended-action flows backed by vector search.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
