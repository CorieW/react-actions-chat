# packages/react-actions-chat-support/src/__tests__

Automated tests for the support companion package.

## Directories

- None.

## Files

- `supportFlows.test.tsx`: Integration tests for the user and admin support flows, including shared adapter behavior.

## Writing Rules

- Reset the shared chat, input-field, globals, and persistent-button stores in `beforeEach` for tests that touch singleton state.
- Prefer the in-memory adapter for flow tests so package behavior stays deterministic and local.
- Follow inherited AGENTS.md guidance when applicable.
