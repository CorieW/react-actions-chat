# packages/react-actions-chat-recommended-actions/src/queryFlow

Internal query recommendation flow modules for contracts, defaults, message resolution, timing, and chat-store updates.

## Directories

- None.

## Files

- `createQueryRecommendedActionsFlow.ts`: Orchestrates query collection, resolver execution, request coordination, and response rendering.
- `defaults.ts`: Default labels and message builders for the query recommendation flow.
- `index.ts`: Internal barrel for query flow exports consumed by public compatibility modules.
- `messages.ts`: Converts resolver results and errors into chat message drafts.
- `results.ts`: Normalizes supported recommendation resolver result shapes.
- `storeMessages.ts`: Chat-store helpers for recommendation context, loading messages, and resolved responses.
- `timing.ts`: Promise-based wait helper for minimum loading duration behavior.
- `types.ts`: Public query flow contracts plus internal message and queue coordination types.

## Writing Rules

- Keep public query flow type exports synchronized with `../queryRecommendedActionsFlow.ts` and `../index.ts`.
- Follow inherited AGENTS.md guidance when applicable.
