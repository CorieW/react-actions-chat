# packages/react-actions-chat-recommended-actions/src/__tests__

Automated tests for the recommended-actions companion package.

## Directories

- None.

## Files

- `embedders.test.ts`: Unit tests for the provider embedder helpers.
- `queryRecommendedActionsFlow.test.tsx`: Integration tests for query and vector-search recommended-action flows.

## Writing Rules

- Reset the shared chat, input-field, globals, and persistent-button stores in `beforeEach` for tests that touch singleton state.
- Stub provider fetches in the test file instead of calling live embedding APIs.
- Follow inherited AGENTS.md guidance when applicable.
